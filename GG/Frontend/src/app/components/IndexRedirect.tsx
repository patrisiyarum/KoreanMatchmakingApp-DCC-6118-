import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function IndexRedirect() {
  const { userId } = useAuth();
  if (userId) {
    return <Navigate to="/home" replace />;
  }
  return <Navigate to="/login" replace />;
}
