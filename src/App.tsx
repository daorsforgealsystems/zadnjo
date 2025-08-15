import { Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingScreen from './components/LoadingScreen';
import LanguageChangeNotification from './components/LanguageChangeNotification';
import ErrorBoundary from './components/ErrorBoundary';
import DebugOverlay from './components/DebugOverlay';
import { AppProviders } from './components/providers/AppProviders';
import { debug } from './lib/debug';

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
const lazyWithErrorHandling = (importFn) => {
  const LazyComponent = lazy(() => 
    importFn().catch(error => {
      console.error("Error loading component:", error);
      return { default: LazyLoadingErrorFallback };
    })
  );
  
  return (props) => (
    <ErrorBoundary fallback={<LazyLoadingErrorFallback />}>
      <LazyComponent {...props} />
    </ErrorBoundary>
  );
};

// Lazy load components to improve initial load time
const CustomerDashboard = lazyWithErrorHandling(() => import('./pages/CustomerDashboard'));
const Index = lazyWithErrorHandling(() => import('./pages/Index'));
const Inventory = lazyWithErrorHandling(() => import('./pages/Inventory'));
const ItemTracking = lazyWithErrorHandling(() => import('./pages/ItemTracking'));
const LiveMap = lazyWithErrorHandling(() => import('./pages/LiveMap'));
const AuthPage = lazyWithErrorHandling(() => import('./pages/AuthPage'));
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
const CustomerPortalLayout = lazyWithErrorHandling(() => import('./components/CustomerPortalLayout'));
const ProtectedRoute = lazyWithErrorHandling(() => import('./components/ProtectedRoute'));
const LandingPage = lazyWithErrorHandling(() => import('./pages/LandingPage'));
const ResponsiveLayout = lazyWithErrorHandling(() => import('./components/ResponsiveLayout'));
const DemoPage = lazyWithErrorHandling(() => import('./pages/DemoPage'));
const ModernFooter = lazyWithErrorHandling(() => import('./components/ModernFooter'));
const ProfilePage = lazyWithErrorHandling(() => import('./pages/ProfilePage'));
const DashboardLayout = lazyWithErrorHandling(() => import('./components/layout/DashboardLayout'));

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
const IntegratedLayoutDemo = lazyWithErrorHandling(() => import('./components/layout/IntegratedLayoutDemo'));

const AppContent = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Pages where footer should be hidden
  const hideFooterPaths = ['/login', '/signup'];
  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

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
              <Route
                path="/"
                element={
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-screen bg-gradient-to-b from-background via-background to-background"
                  >
                    <LandingPage />
                  </motion.div>
                }
              />

              {/* Logistics-themed slide/fade for key app sections */}
              {[
                // Original routes
                { path: '/dashboard', element: <Index /> },
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
                { path: '/demo', element: <DemoPage /> },
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
                { path: '/layout-demo', element: <IntegratedLayoutDemo /> },
              ].map(({ path, element }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ErrorBoundary>
                      <DashboardLayout>
                        <motion.div
                          key={location.pathname}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="min-h-screen"
                        >
                          {element}
                        </motion.div>
                      </DashboardLayout>
                    </ErrorBoundary>
                  }
                />
              ))}

              {/* Auth pages: subtle fade to keep focus on form with transport vibe */}
              <Route
                path="/login"
                element={
                  <ErrorBoundary>
                    <motion.div
                      key={location.pathname}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="min-h-screen"
                    >
                      <AuthPage />
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="min-h-screen"
                    >
                      <AuthPage />
                    </motion.div>
                  </ErrorBoundary>
                }
              />

              {/* Portal with nested routes: fade/slide container while children render */}
              <Route
                element={
                  <ErrorBoundary>
                    <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'DRIVER', 'CLIENT', 'GUEST']} />
                  </ErrorBoundary>
                }
              >
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
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
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
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

  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
        {/* Debug overlay - press Ctrl+Shift+D to show/hide */}
        <DebugOverlay enabled={true} />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
