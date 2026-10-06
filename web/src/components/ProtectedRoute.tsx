import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Spinner } from './Spinner';

export function ProtectedRoute() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <Spinner label="Checking session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <Spinner label="Checking session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
