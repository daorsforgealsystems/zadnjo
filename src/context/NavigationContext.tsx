import React, { createContext, useContext } from 'react';

// Deprecated: NavigationContext is no longer used. Navigation has been fully migrated to Redux.
// Keeping this minimal shim temporarily to avoid breaking imports during migration. Remove after cleanup.

const NavigationContext = createContext<undefined>(undefined);

export const useNavigation = () => {
  throw new Error('useNavigation is deprecated. Use Redux selectors/hooks from useNavigationState instead.');
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  return <>{children}</>;
};