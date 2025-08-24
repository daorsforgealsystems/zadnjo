import { Route, Routes, useLocationfunction lazyWithErrorHandling<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>
): React.FC<P> {
  const LazyComponent = lazy(importFn);

  const componentName = importFn.toString().includes('DashboardLayout') ? 'DashboardLayout' : 'Unknown';

  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary fallback={<LazyLoadingErrorFallback />}>
      <Suspense fallback={<LoadingScreen />}>
        <LazyComponent {...(props as P)} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `lazyWithErrorHandling(${componentName})`;

  return WrappedComponent;
}er-dom';
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';
import LanguageChangeNotification from './components/LanguageChangeNotification';
import ErrorBoundary from './components/ErrorBoundary';
import DebugOverlay from './components/DebugOverlay';
import { debug } from './lib/debug';
import { pageTransition, authFade, nestedFadeSlide } from './lib/motion-variants';
import { EnhancedResponsiveLayout } from './components/layout/EnhancedResponsiveLayout';

// Simple fallback component for lazy loading errors
const LazyLoadingErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-6 max-w-md">
      <div className="text-destructive mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Failed to load component</h2>
      <p className="text-muted-foreground mb-4">There was an error loading this page. Please try refreshing.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Wrapper for lazy loaded components with error handling
function lazyWithErrorHandling<P extends JSX.IntrinsicAttributes>(
  importFn: () => Promise<{ default: React.ComponentType<P> } | { default: React.FC<any> }>
): React.FC<P> {
  const LazyComponent = lazy(async () => {
    const module = await importFn();
    return { default: module.default as React.ComponentType<P> };
  });

  const componentName = importFn.toString().includes('DashboardLayout') ? 'DashboardLayout' : 'Unknown';

  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary fallback={<LazyLoadingErrorFallback />}>
      <Suspense fallback={<LoadingScreen />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `lazyWithErrorHandling(${componentName})`;

  return WrappedComponent;
}
const Inventory = lazyWithErrorHandling(() => import('./pages/Inventory'));
const ItemTracking = lazyWithErrorHandling(() => import('./pages/ItemTracking'));
const LiveMap = lazyWithErrorHandling(() => import('./pages/LiveMap'));
const NotFound = lazyWithErrorHandling(() => import('./pages/NotFound'));
const Reports = lazyWithErrorHandling(() => import('./pages/Reports'));
const RouteOptimization = lazyWithErrorHandling(() => import('./pages/RouteOptimization'));
const Settings = lazyWithErrorHandling(() => import('./pages/Settings'));
const Support = lazyWithErrorHandling(() => import('./pages/Support'));
const Team = lazyWithErrorHandling(() => import('./pages/Team'));
const EnhancedDashboard = lazyWithErrorHandling(() => import('./pages/EnhancedDashboard'));
const PortalDashboard = lazyWithErrorHandling(() => import('./pages/portal/Dashboard'));
const PortalProfile = lazyWithErrorHandling(() => import('./pages/portal/Profile'));
const PortalShipments = lazyWithErrorHandling(() => import('./pages/portal/Shipments'));
const ProtectedRoute = lazyWithErrorHandling(() => import('./components/ProtectedRoute'));
const CustomerPortalLayout = lazyWithErrorHandling(() => import('./components/CustomerPortalLayout'));
const ModernFooter = lazyWithErrorHandling(() => import('./components/ModernFooter'));
const ProfilePage = lazyWithErrorHandling(() => import('./pages/ProfilePage'));
const DashboardLayout = lazyWithErrorHandling(() => import('./components/layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const LandingPage = lazyWithErrorHandling(() => import('./pages/LandingPage'));
const LoginPage = lazyWithErrorHandling(() => import('./pages/Login'));

// New Dashboard Pages
const MainDashboard = lazyWithErrorHandling(() => import('./pages/dashboard/MainDashboard'));
const DriverDashboard = lazyWithErrorHandling(() => import('./pages/driver/DriverDashboard'));
const ManagerDashboard = lazyWithErrorHandling(() => import('./pages/manager/ManagerDashboard'));
const AdminDashboard = lazyWithErrorHandling(() => import('./pages/admin/AdminDashboard'));
const OrderManagement = lazyWithErrorHandling(() => import('./pages/orders/OrderManagement'));
const ShipmentTracking = lazyWithErrorHandling(() => import('./pages/shipments/ShipmentTracking'));
const VehicleTracking = lazyWithErrorHandling(() => import('./pages/vehicles/VehicleTracking'));
const InvoiceGeneration = lazyWithErrorHandling(() => import('./pages/invoices/InvoiceGeneration'));
const PaymentProcessing = lazyWithErrorHandling(() => import('./pages/payments/PaymentProcessing'));
const DocumentManagement = lazyWithErrorHandling(() => import('./pages/documents/DocumentManagement'));
const ReportGeneration = lazyWithErrorHandling(() => import('./pages/reports/ReportGeneration'));
const Chatbot = lazyWithErrorHandling(() => import('./pages/chatbot/Chatbot'));
const FleetTracking = lazyWithErrorHandling(() => import('./pages/FleetTracking'));

// Tracking Pages
const LiveTracking = lazyWithErrorHandling(() => import('./pages/tracking/LiveTracking'));
const ShipmentHistory = lazyWithErrorHandling(() => import('./pages/tracking/ShipmentHistory'));

const AppContent = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Pages where footer should be hidden
  const shouldHideFooter =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/portal') ||
    location.pathname === '/enhanced-dashboard';

  // Log when AppContent component is rendered
  useEffect(() => {
    debug('AppContent component mounted', 'info');
    debug(`Current location: ${location.pathname}`, 'info');
    
    return () => {
      debug('AppContent component unmounted', 'info');
    };
  }, [location.pathname]);

  // Simulate initial loading with debug logs
  useEffect(() => {
    debug('Starting initial loading timer', 'info');
    
    const timer = setTimeout(() => {
      debug('Initial loading completed', 'info');
      setIsLoading(false);
    }, 1000);
    
    return () => {
      debug('Clearing initial loading timer', 'info');
      clearTimeout(timer);
    };
  }, []);

  // If still in initial loading state, show loading screen
  if (isLoading) {
    debug('Rendering LoadingScreen', 'info');
    return <LoadingScreen />;
  }
  
  debug('Rendering main application content', 'info');

  return (
    <div className="flex flex-col min-h-screen">
      <ErrorBoundary>
        <LanguageChangeNotification />
      </ErrorBoundary>
      
      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={<LoadingScreen />}>
          <ErrorBoundary>
            <Routes location={location}>
              {/* Public landing page */}
              <Route
                path="/"
                element={
                  <motion.div
                    key={location.pathname}
                    variants={pageTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="min-h-screen bg-gradient-to-b from-background via-background to-background"
                  >
                    <LandingPage />
                  </motion.div>
                }
              />

              {/* Core app routes (dashboard etc.) */}
              {[
                // Core app routes continue below; /dashboard is defined as a guarded route
                { path: '/customer-dashboard', element: <CustomerDashboard /> },
                { path: '/inventory', element: <Inventory /> },
                { path: '/item-tracking', element: <ItemTracking /> },
                { path: '/live-map', element: <LiveMap /> },
                { path: '/reports', element: <Reports /> },
                { path: '/route-optimization', element: <RouteOptimization /> },
                { path: '/settings', element: <Settings /> },
                { path: '/support', element: <Support /> },
                { path: '/team', element: <Team /> },
                { path: '/enhanced-dashboard', element: <EnhancedDashboard /> },
                { path: '/contact', element: <Support /> },
                { path: '/profile', element: <ProfilePage /> },
                // New dashboard pages
                { path: '/main-dashboard', element: <MainDashboard /> },
                { path: '/driver-dashboard', element: <DriverDashboard /> },
                { path: '/manager-dashboard', element: <ManagerDashboard /> },
                { path: '/admin-dashboard', element: <AdminDashboard /> },
                { path: '/order-management', element: <OrderManagement /> },
                { path: '/shipment-tracking', element: <ShipmentTracking /> },
                { path: '/vehicle-tracking', element: <VehicleTracking /> },
                { path: '/invoice-generation', element: <InvoiceGeneration /> },
                { path: '/payment-processing', element: <PaymentProcessing /> },
                { path: '/document-management', element: <DocumentManagement /> },
                { path: '/report-generation', element: <ReportGeneration /> },
                { path: '/chatbot', element: <Chatbot /> },
                { path: '/fleet-tracking', element: <FleetTracking /> },
                // Tracking routes
                { path: '/tracking/live', element: <LiveTracking /> },
                { path: '/tracking/history', element: <ShipmentHistory /> },
              ].map(({ path, element }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ErrorBoundary>
                      <EnhancedResponsiveLayout>
                        <DashboardLayout>
                          <motion.div
                            key={location.pathname}
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="min-h-screen"
                          >
                            {element}
                          </motion.div>
                        </DashboardLayout>
                      </EnhancedResponsiveLayout>
                    </ErrorBoundary>
                  }
                />
              ))}

              {/* Auth pages */}
              <Route
                path="/login"
                element={
                  <ErrorBoundary>
                    <motion.div
                      key={location.pathname}
                      variants={authFade}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="min-h-screen"
                    >
                      <LoginPage />
                    </motion.div>
                  </ErrorBoundary>
                }
              />
              <Route
                path="/signup"
                element={
                  <ErrorBoundary>
                    <motion.div
                      key={location.pathname}
                      variants={authFade}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="min-h-screen"
                    >
                      {/* Reuse Login page or keep existing AuthPage if present later */}
                      <LoginPage />
                    </motion.div>
                  </ErrorBoundary>
                }
              />

              {/* Guarded dashboard route */}
              <Route
                element={
                  <ErrorBoundary>
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DRIVER', 'CLIENT', 'GUEST']} />
                  </ErrorBoundary>
                }
              >
                <Route
                  path="/dashboard"
                  element={
                    <ErrorBoundary>
                      <EnhancedResponsiveLayout>
                        <DashboardLayout>
                          <motion.div
                            key={location.pathname}
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="min-h-screen"
                          >
                            <MainDashboard />
                          </motion.div>
                        </DashboardLayout>
                      </EnhancedResponsiveLayout>
                    </ErrorBoundary>
                  }
                />

                {/* Portal with nested routes */}
                <Route
                  path="/portal"
                  element={
                    <ErrorBoundary>
                      <CustomerPortalLayout />
                    </ErrorBoundary>
                  }
                >
                  <Route
                    index
                    element={
                      <ErrorBoundary>
                        <motion.div
                          key={location.pathname}
                          variants={nestedFadeSlide}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <PortalDashboard />
                        </motion.div>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="dashboard"
                    element={
                      <ErrorBoundary>
                        <motion.div
                          key={location.pathname}
                          variants={nestedFadeSlide}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <PortalDashboard />
                        </motion.div>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <ErrorBoundary>
                        <motion.div
                          key={location.pathname}
                          variants={nestedFadeSlide}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <PortalProfile />
                        </motion.div>
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="shipments"
                    element={
                      <ErrorBoundary>
                        <motion.div
                          key={location.pathname}
                          variants={nestedFadeSlide}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <PortalShipments />
                        </motion.div>
                      </ErrorBoundary>
                    }
                  />
                </Route>
              </Route>

              <Route
                path="*"
                element={
                  <ErrorBoundary>
                    <motion.div
                      key={location.pathname}
                      variants={authFade}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <NotFound />
                    </motion.div>
                  </ErrorBoundary>
                }
              />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </AnimatePresence>

      {/* ModernFooter on all pages except auth pages */}
      {!shouldHideFooter && (
        <ErrorBoundary>
          <Suspense fallback={<div className="h-20" />}>
            <ModernFooter />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};

const App = () => {
  // Log when App component is rendered
  useEffect(() => {
    debug('App component mounted', 'info');
    return () => {
      debug('App component unmounted', 'info');
    };
  }, []);

  // Prefetch critical routes/modules to speed up first navigation
  useEffect(() => {
    const prefetch = () => {
      debug('Prefetching critical routes', 'info');
      // Trigger dynamic imports for commonly visited routes
      // These match lazy-loaded modules above
      import('./pages/LandingPage');
      import('./pages/Inventory');
      import('./pages/LiveMap');
      import('./pages/tracking/LiveTracking');
      import('./pages/tracking/ShipmentHistory');
      import('./components/layout/DashboardLayout');
    };

    const idle = (window as Window & typeof globalThis).requestIdleCallback as undefined | ((cb: () => void) => number);
    let handle: number | undefined;
    if (typeof idle === 'function') {
      handle = idle(prefetch);
    } else {
      handle = window.setTimeout(prefetch, 800);
    }

    return () => {
      // cancelIdleCallback may not exist on all browsers; use a correctly typed shim instead of `any`
      const win = window as unknown as { cancelIdleCallback?: (handle: number) => void };
      if (typeof win.cancelIdleCallback === 'function' && handle) {
        win.cancelIdleCallback(handle);
      } else if (handle) {
        clearTimeout(handle);
      }
    };
  }, []);

  return (
    <>
      <AppContent />
      {/* Debug overlay - press Ctrl+Shift+D to show/hide */}
      <DebugOverlay enabled={true} />
    </>
  );
};

export default App;
