
// Forge Constitution: Security boundary clarification
// This component enforces client-side UX for authentication and RBAC.
// True security and access control MUST be enforced server-side.
// Architectural justification: Modular, reusable route guard for UX only.
// Trade-off: Improves user experience, but does NOT guarantee security.
// Security assessment: Never rely solely on this for sensitive actions.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { Role } from '@/lib/types';


interface ProtectedRouteProps {
  allowedRoles: Role[];
}


const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  // UX: Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // UX: Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // UX: Check client-side role authorization
  const isAuthorized = hasRole(allowedRoles);

  // UX: Redirect unauthorized users (client-side only)
  if (!isAuthorized) {
    // Note: For true security, enforce RBAC server-side.
    // Consider a dedicated "403 Unauthorized" page for better UX.
    return <Navigate to="/not-found" replace />;
  }

  // Render child routes if authenticated and authorized (client-side only)
  return <Outlet />;
};


export default ProtectedRoute;
