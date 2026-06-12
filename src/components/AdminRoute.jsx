import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, userData, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (userData === null) return null;  // user is set but Firestore doc not fetched yet — wait
  if (userData?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
