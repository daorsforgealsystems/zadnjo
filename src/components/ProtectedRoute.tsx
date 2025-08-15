import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/lib/types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If not authenticated, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = hasRole(allowedRoles);

  if (!isAuthorized) {
    // If authenticated but not authorized, redirect to a not-found page
    // In a real app, you might have a dedicated "403 Unauthorized" page
    return <Navigate to="/not-found" replace />;
  }

  // If authenticated and authorized, render the child components
  return <Outlet />;
};

export default ProtectedRoute;
