import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LayoutProvider } from '@/context/LayoutContext';
import { NavigationProvider } from '@/context/NavigationContext';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <LayoutProvider>
            <NavigationProvider>
              {children}
            </NavigationProvider>
          </LayoutProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};