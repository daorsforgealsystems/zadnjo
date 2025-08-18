import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { LayoutProvider } from '@/context/LayoutContext';
import { NavigationProvider } from '@/context/NavigationContext';
import { AnimationProvider } from './AnimationProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <AnimationProvider>
        <Router>
          <AuthProvider>
            <LayoutProvider>
              <NavigationProvider>
                {children}
              </NavigationProvider>
            </LayoutProvider>
          </AuthProvider>
        </Router>
      </AnimationProvider>
    </ErrorBoundary>
  );
};