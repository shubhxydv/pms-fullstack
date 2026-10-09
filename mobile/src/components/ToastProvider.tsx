// Global toast notification system: context provider plus the useToast() hook.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, variant?: Toast['variant']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

// Holds and auto-dismisses active toasts
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: Toast['variant'] = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="none" style={styles.container}>
        {toasts.map((toast) => (
          <View
            key={toast.id}
            accessibilityRole="alert"
            style={[
              styles.toast,
              toast.variant === 'success' && styles.success,
              toast.variant === 'error' && styles.error,
            ]}
          >
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// Gives access to showToast()
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 32, left: 16, right: 16, gap: 8 },
  toast: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12 },
  success: { backgroundColor: '#047857' },
  error: { backgroundColor: '#B91C1C' },
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
