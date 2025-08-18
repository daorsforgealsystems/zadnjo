import { store } from '@/store';
import { NavigationAPI } from '@/lib/api/navigation-api';
import type { UserRole } from '@/lib/api/navigation-api';

// Route guard utility functions that work with the data stored in Redux
export const RouteGuardUtils = {
  // Check if a route is accessible
  async canActivate(route: string): Promise<boolean> {
    const state = store.getState();
    const { userId, role, allowedRoutes } = state.navigation.routeGuard;
    
    // Guest users can access all routes
    if (role === 'GUEST' || userId.includes('guest')) {
      return true;
    }
    
    // If allowedRoutes includes '*', all routes are allowed
    if (allowedRoutes.includes('*')) {
      return true;
    }
    
    // Check if the route is in the allowed routes
    if (allowedRoutes.includes(route)) {
      return true;
    }
    
    // If not found in the store data, make an API call
    try {
      const result = await NavigationAPI.checkRouteAccess(userId, route, role);
      return result.hasAccess;
    } catch (error) {
      console.warn('Failed to check route access:', error);
      // Default to allowing access in case of error
      return true;
    }
  },
  
  // Get allowed routes
  getAllowedRoutes(): string[] {
    const state = store.getState();
    return state.navigation.routeGuard.allowedRoutes;
  },
  
  // Get restricted components
  getRestrictedComponents(): string[] {
    const state = store.getState();
    return state.navigation.routeGuard.restrictedComponents;
  },
  
  // Get available actions
  getAvailableActions(): string[] {
    const state = store.getState();
    return state.navigation.routeGuard.availableActions;
  },
  
  // Check if a component is restricted
  isComponentRestricted(componentId: string): boolean {
    const restrictedComponents = this.getRestrictedComponents();
    return restrictedComponents.includes(componentId);
  },
  
  // Check if an action is available
  isActionAvailable(action: string): boolean {
    const availableActions = this.getAvailableActions();
    return availableActions.includes(action);
  }
};