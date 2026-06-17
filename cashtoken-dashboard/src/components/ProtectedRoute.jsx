import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#00C896] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const passwordChangeRequired =
    user.password_change_required === 'TRUE' || user.password_change_required === true;

  if (passwordChangeRequired && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return children ?? <Outlet />;
}
