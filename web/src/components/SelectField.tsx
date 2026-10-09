// Labeled select dropdown with built-in error message display.
import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

// Renders labeled dropdown with error
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, id, children, ...rest }, ref) => {
    const fieldId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <select
          ref={ref}
          id={fieldId}
          className={`rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
          {...rest}
        >
          {children}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);
SelectField.displayName = 'SelectField';
