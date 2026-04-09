import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function RequireAuthLayout() {
  const { userId } = useAuth();
  if (!userId) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
