import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { User, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * Demo component showing how to use the improved authentication system
 * This can be used in development or as a reference for other components
 */
export function AuthStatusDemo() {
  const auth = useAuthStatus();

  const getStatusIcon = () => {
    if (auth.isLoading) return <Clock className="w-4 h-4" />;
    if (auth.isError) return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (auth.isAuthenticated) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (auth.isGuest) return <User className="w-4 h-4 text-amber-600" />;
    return <Shield className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (auth.isLoading) return 'Loading...';
    if (auth.isError) return 'Error';
    if (auth.isAuthenticated) return 'Authenticated';
    if (auth.isGuest) return 'Guest Mode';
    return 'Unknown';
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (auth.isError) return 'destructive';
    if (auth.isAuthenticated) return 'default';
    if (auth.isGuest) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Authentication Status</span>
        </CardTitle>
        <CardDescription>
          Current authentication state and user permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={getStatusVariant()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* User Information */}
        {auth.user && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">User Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2">{auth.userName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>
                <span className="ml-2">{auth.userRole || 'N/A'}</span>
              </div>
              {auth.userEmail && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2">{auth.userEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permissions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Permissions</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant={auth.isAdmin ? 'default' : 'outline'}>
              Admin: {auth.isAdmin ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={auth.canManage ? 'default' : 'outline'}>
              Manage: {auth.canManage ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={auth.canDrive ? 'default' : 'outline'}>
              Drive: {auth.canDrive ? 'Yes' : 'No'}
            </Badge>
            <Badge variant={auth.canViewAll ? 'default' : 'outline'}>
              View All: {auth.canViewAll ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Error Information */}
        {auth.error && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Error</h4>
            <p className="text-sm text-muted-foreground bg-destructive/10 p-3 rounded">
              {auth.error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {auth.canRetry && auth.retry && (
            <Button onClick={auth.retry} variant="outline" size="sm">
              Retry Connection
            </Button>
          )}
          
          {!auth.isAuthenticated && (
            <Button onClick={auth.loginAsGuest} variant="outline" size="sm">
              Continue as Guest
            </Button>
          )}
          
          {(auth.isAuthenticated || auth.isGuest) && (
            <Button onClick={auth.signOut} variant="outline" size="sm">
              Sign Out
            </Button>
          )}
        </div>

        {/* Development Info */}
        {import.meta.env.DEV && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Debug Information (Dev Only)
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify({
                isLoading: auth.isLoading,
                isAuthenticated: auth.isAuthenticated,
                isGuest: auth.isGuest,
                isError: auth.isError,
                userRole: auth.userRole,
                error: auth.error,
              }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthStatusDemo;