# DaorsForge AI Logistics - Platform Architecture

This document outlines the comprehensive architecture for the DaorsForge AI Logistics platform, focusing on the requested dashboard pages and features. The architecture is designed to be modular, maintainable, and scalable.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [API Endpoints](#api-endpoints)
5. [Third-Party Integrations](#third-party-integrations)
6. [State Management](#state-management)
7. [Authentication & Authorization](#authentication--authorization)
8. [Deployment Strategy](#deployment-strategy)

## Project Structure

The project follows a modular structure with clear separation of concerns:

```
daors-flow-motion/
├── src/
│   ├── assets/                 # Static assets (images, videos, etc.)
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components (buttons, inputs, etc.)
│   │   ├── layout/             # Layout components (Sidebar, Navbar, etc.)
│   │   ├── charts/             # Chart components
│   │   ├── maps/               # Map components
│   │   ├── forms/              # Form components
│   │   ├── tables/             # Table components
│   │   ├── modals/             # Modal components
│   │   └── widgets/            # Dashboard widgets
│   ├── context/                # React Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions and services
│   │   ├── api/                # API client and services
│   │   ├── utils/              # Utility functions
│   │   └── validators/         # Form validators
│   ├── pages/                  # Page components
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── auth/               # Authentication pages
│   │   ├── portal/             # Customer portal pages
│   │   ├── admin/              # Admin pages
│   │   ├── manager/            # Manager pages
│   │   ├── driver/             # Driver pages
│   │   ├── orders/             # Order management pages
│   │   ├── shipments/          # Shipment tracking pages
│   │   ├── vehicles/           # Vehicle tracking pages
│   │   ├── invoices/           # Invoice generation pages
│   │   ├── payments/           # Payment processing pages
│   │   ├── documents/          # Document management pages
│   │   ├── reports/            # Report generation pages
│   │   └── chatbot/            # Chatbot pages
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Main App component
│   └── main.tsx                # Entry point
└── logi-core/                  # Backend services
    ├── services/               # Microservices
    │   ├── user-service/       # User management service
    │   ├── order-service/      # Order management service
    │   ├── inventory-service/  # Inventory management service
    │   ├── routing-service/    # Route optimization service
    │   ├── geolocation-service/# Geolocation tracking service
    │   ├── notification-service/# Notification service
    │   ├── payment-service/    # Payment processing service
    │   ├── document-service/   # Document management service
    │   ├── report-service/     # Report generation service
    │   └── chatbot-service/    # AI chatbot service
    └── db/                     # Database migrations and schemas
```

## Frontend Architecture

### Core Pages Implementation

#### 1. Main Dashboard (/)

```typescript
// src/pages/dashboard/MainDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMetricData, getShipmentData, getRevenueData } from '@/lib/api';
import { MetricCard, ShipmentStatusChart, RevenueChart, ActivityFeed } from '@/components/widgets';
import { DashboardLayout } from '@/components/layout';

const MainDashboard: React.FC = () => {
  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: getMetricData
  });
  
  const { data: shipmentData } = useQuery({
    queryKey: ['shipmentData'],
    queryFn: getShipmentData
  });
  
  const { data: revenueData } = useQuery({
    queryKey: ['revenueData'],
    queryFn: getRevenueData
  });

  return (
    <DashboardLayout title="Main Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Active Shipments" 
          value={metrics?.activeShipments.value} 
          change={metrics?.activeShipments.change}
          changeType={metrics?.activeShipments.changeType}
          icon="package"
        />
        <MetricCard 
          title="Total Revenue" 
          value={metrics?.totalRevenue.value} 
          change={metrics?.totalRevenue.change}
          changeType={metrics?.totalRevenue.changeType}
          icon="dollar-sign"
          formatter={(val) => `$${val.toLocaleString()}`}
        />
        <MetricCard 
          title="On-Time Delivery" 
          value={metrics?.onTimeDelivery.value} 
          change={metrics?.onTimeDelivery.change}
          changeType={metrics?.onTimeDelivery.changeType}
          icon="clock"
          formatter={(val) => `${val}%`}
        />
        <MetricCard 
          title="Border Crossings" 
          value={metrics?.borderCrossings.value} 
          change={metrics?.borderCrossings.change}
          changeType={metrics?.borderCrossings.changeType}
          icon="globe"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ShipmentStatusChart data={shipmentData || []} />
        <RevenueChart data={revenueData || []} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentShipmentsTable />
        </div>
        <ActivityFeed />
      </div>
    </DashboardLayout>
  );
};

export default MainDashboard;
```

#### 2. Enhanced Dashboard (/enhanced-dashboard)

```typescript
// src/pages/dashboard/EnhancedDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { WidgetGrid } from '@/components/widgets/WidgetGrid';
import { WidgetSelector } from '@/components/widgets/WidgetSelector';
import { getAllWidgetData } from '@/lib/api/dashboard';

const EnhancedDashboard: React.FC = () => {
  const [activeWidgets, setActiveWidgets] = useState<string[]>([
    'shipment-status', 'revenue-trend', 'route-efficiency', 
    'vehicle-status', 'delivery-performance', 'anomaly-alerts'
  ]);
  
  const { data: widgetData } = useQuery({
    queryKey: ['widgetData', activeWidgets],
    queryFn: () => getAllWidgetData(activeWidgets)
  });

  const handleAddWidget = (widgetId: string) => {
    setActiveWidgets(prev => [...prev, widgetId]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setActiveWidgets(prev => prev.filter(id => id !== widgetId));
  };

  return (
    <DashboardLayout title="Enhanced Dashboard">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Advanced Analytics Dashboard</h1>
        <WidgetSelector 
          onAddWidget={handleAddWidget} 
          activeWidgets={activeWidgets} 
        />
      </div>
      
      <WidgetGrid 
        widgets={activeWidgets} 
        data={widgetData || {}} 
        onRemoveWidget={handleRemoveWidget}
      />
    </DashboardLayout>
  );
};

export default EnhancedDashboard;
```

#### 3. Customer Portal (/portal)

```typescript
// src/pages/portal/CustomerPortal.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomerPortalLayout } from '@/components/layout';
import { ShipmentTracker, OrderHistory, InvoiceList } from '@/components/portal';
import { getCustomerShipments, getCustomerOrders, getCustomerInvoices } from '@/lib/api/customer';
import { useAuth } from '@/context/AuthContext';

const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  
  const { data: shipments } = useQuery({
    queryKey: ['customerShipments', user?.id],
    queryFn: () => getCustomerShipments(user?.id),
    enabled: !!user?.id
  });
  
  const { data: orders } = useQuery({
    queryKey: ['customerOrders', user?.id],
    queryFn: () => getCustomerOrders(user?.id),
    enabled: !!user?.id
  });
  
  const { data: invoices } = useQuery({
    queryKey: ['customerInvoices', user?.id],
    queryFn: () => getCustomerInvoices(user?.id),
    enabled: !!user?.id
  });

  return (
    <CustomerPortalLayout>
      <div className="grid grid-cols-1 gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Active Shipments</h2>
          <ShipmentTracker shipments={shipments || []} />
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <OrderHistory orders={orders || []} />
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Invoices</h2>
          <InvoiceList invoices={invoices || []} />
        </section>
      </div>
    </CustomerPortalLayout>
  );
};

export default CustomerPortal;
```

#### 4. Driver Dashboard (/driver-dashboard)

```typescript
// src/pages/driver/DriverDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverLayout } from '@/components/layout';
import { ActiveDeliveryCard, RouteMap, DeliveryList, VehicleStatus } from '@/components/driver';
import { getDriverAssignments, getDriverVehicle } from '@/lib/api/driver';
import { useAuth } from '@/context/AuthContext';

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const { data: assignments } = useQuery({
    queryKey: ['driverAssignments', user?.id],
    queryFn: () => getDriverAssignments(user?.id),
    enabled: !!user?.id
  });
  
  const { data: vehicle } = useQuery({
    queryKey: ['driverVehicle', user?.id],
    queryFn: () => getDriverVehicle(user?.id),
    enabled: !!user?.id
  });
  
  const activeDelivery = assignments?.find(a => a.status === 'in-progress');

  return (
    <DriverLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeDelivery ? (
            <ActiveDeliveryCard delivery={activeDelivery} />
          ) : (
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">No Active Deliveries</h2>
              <p className="text-muted-foreground">Check your upcoming assignments below.</p>
            </div>
          )}
          
          <div className="mt-6">
            <RouteMap 
              activeDelivery={activeDelivery} 
              vehiclePosition={vehicle?.currentPosition}
            />
          </div>
        </div>
        
        <div>
          <VehicleStatus vehicle={vehicle} />
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Deliveries</h2>
            <DeliveryList 
              deliveries={assignments?.filter(a => a.status === 'scheduled') || []} 
            />
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverDashboard;
```

#### 5. Manager Dashboard (/manager-dashboard)

```typescript
// src/pages/manager/ManagerDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ManagerLayout } from '@/components/layout';
import { FleetOverview, OrderSummary, DriverPerformance, AlertsPanel } from '@/components/manager';
import { getFleetStatus, getOrderSummary, getDriverPerformance, getAlerts } from '@/lib/api/manager';

const ManagerDashboard: React.FC = () => {
  const { data: fleetStatus } = useQuery({
    queryKey: ['fleetStatus'],
    queryFn: getFleetStatus
  });
  
  const { data: orderSummary } = useQuery({
    queryKey: ['orderSummary'],
    queryFn: getOrderSummary
  });
  
  const { data: driverPerformance } = useQuery({
    queryKey: ['driverPerformance'],
    queryFn: getDriverPerformance
  });
  
  const { data: alerts } = useQuery({
    queryKey: ['managerAlerts'],
    queryFn: getAlerts
  });

  return (
    <ManagerLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FleetOverview fleetStatus={fleetStatus} />
          
          <div className="mt-6">
            <OrderSummary orderSummary={orderSummary} />
          </div>
        </div>
        
        <div>
          <AlertsPanel alerts={alerts || []} />
          
          <div className="mt-6">
            <DriverPerformance performance={driverPerformance || []} />
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
```

#### 6. Admin Dashboard (/admin-dashboard)

```typescript
// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout';
import { SystemStatus, UserManagement, ServiceHealth, AuditLogs } from '@/components/admin';
import { getSystemStatus, getUsers, getServiceHealth, getAuditLogs } from '@/lib/api/admin';

const AdminDashboard: React.FC = () => {
  const { data: systemStatus } = useQuery({
    queryKey: ['systemStatus'],
    queryFn: getSystemStatus
  });
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  });
  
  const { data: serviceHealth } = useQuery({
    queryKey: ['serviceHealth'],
    queryFn: getServiceHealth
  });
  
  const { data: auditLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: getAuditLogs
  });

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemStatus status={systemStatus} />
        <ServiceHealth health={serviceHealth} />
      </div>
      
      <div className="mt-6">
        <UserManagement users={users || []} />
      </div>
      
      <div className="mt-6">
        <AuditLogs logs={auditLogs || []} />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
```

### Feature-Specific Pages

#### 7. Order Management (/order-management)

```typescript
// src/pages/orders/OrderManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { OrderTable, OrderFilters, OrderDetails, CreateOrderModal } from '@/components/orders';
import { getOrders, createOrder, updateOrder } from '@/lib/api/orders';

const OrderManagement: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: null,
    customer: '',
  });
  
  const queryClient = useQueryClient();
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters)
  });
  
  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateModalOpen(false);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
  
  const selectedOrder = orders?.find(order => order.id === selectedOrderId);

  return (
    <DashboardLayout title="Order Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Order
        </button>
      </div>
      
      <OrderFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <OrderTable 
            orders={orders || []} 
            isLoading={isLoading}
            onSelectOrder={setSelectedOrderId}
            selectedOrderId={selectedOrderId}
          />
        </div>
        
        {selectedOrderId && (
          <div>
            <OrderDetails 
              order={selectedOrder} 
              onUpdateOrder={(data) => updateMutation.mutate({ id: selectedOrderId, ...data })}
            />
          </div>
        )}
      </div>
      
      <CreateOrderModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateOrder={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default OrderManagement;
```

#### 8. Shipment Tracking (/shipment-tracking)

```typescript
// src/pages/shipments/ShipmentTracking.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { ShipmentTable, ShipmentMap, ShipmentDetails, ShipmentFilters } from '@/components/shipments';
import { getShipments } from '@/lib/api/shipments';

const ShipmentTracking: React.FC = () => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: null,
    customer: '',
  });
  
  const { data: shipments, isLoading } = useQuery({
    queryKey: ['shipments', filters],
    queryFn: () => getShipments(filters)
  });
  
  const selectedShipment = shipments?.find(shipment => shipment.id === selectedShipmentId);

  return (
    <DashboardLayout title="Shipment Tracking">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Real-Time Shipment Tracking</h1>
        <p className="text-muted-foreground">Track and manage all shipments in real-time</p>
      </div>
      
      <ShipmentFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <ShipmentTable 
            shipments={shipments || []} 
            isLoading={isLoading}
            onSelectShipment={setSelectedShipmentId}
            selectedShipmentId={selectedShipmentId}
          />
          
          <div className="mt-6">
            <ShipmentMap 
              shipments={shipments || []} 
              selectedShipmentId={selectedShipmentId}
              onSelectShipment={setSelectedShipmentId}
            />
          </div>
        </div>
        
        <div>
          {selectedShipmentId ? (
            <ShipmentDetails shipment={selectedShipment} />
          ) : (
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">No Shipment Selected</h2>
              <p className="text-muted-foreground">Select a shipment from the table or map to view details.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ShipmentTracking;
```

#### 9. Vehicle Tracking (/vehicle-tracking)

```typescript
// src/pages/vehicles/VehicleTracking.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { VehicleMap, VehicleList, VehicleDetails, VehicleFilters } from '@/components/vehicles';
import { getVehicles, getVehicleHistory } from '@/lib/api/vehicles';

const VehicleTracking: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    driver: '',
  });
  
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => getVehicles(filters)
  });
  
  const { data: vehicleHistory } = useQuery({
    queryKey: ['vehicleHistory', selectedVehicleId],
    queryFn: () => getVehicleHistory(selectedVehicleId!),
    enabled: !!selectedVehicleId
  });
  
  const selectedVehicle = vehicles?.find(vehicle => vehicle.id === selectedVehicleId);

  return (
    <DashboardLayout title="Vehicle Tracking">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Live GPS Vehicle Tracking</h1>
        <p className="text-muted-foreground">Monitor your fleet in real-time with GPS tracking</p>
      </div>
      
      <VehicleFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <VehicleMap 
            vehicles={vehicles || []} 
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
          />
        </div>
        
        <div>
          <VehicleList 
            vehicles={vehicles || []} 
            isLoading={isLoading}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
          />
          
          {selectedVehicleId && (
            <div className="mt-6">
              <VehicleDetails 
                vehicle={selectedVehicle} 
                history={vehicleHistory || []}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VehicleTracking;
```

#### 10. Invoice Generation (/invoice-generation)

```typescript
// src/pages/invoices/InvoiceGeneration.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { InvoiceTable, InvoicePreview, InvoiceForm, InvoiceFilters } from '@/components/invoices';
import { getInvoices, createInvoice, generatePdf } from '@/lib/api/invoices';

const InvoiceGeneration: React.FC = () => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: null,
    customer: '',
  });
  
  const queryClient = useQueryClient();
  
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => getInvoices(filters)
  });
  
  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreating(false);
    }
  });
  
  const generatePdfMutation = useMutation({
    mutationFn: generatePdf
  });
  
  const selectedInvoice = invoices?.find(invoice => invoice.id === selectedInvoiceId);

  return (
    <DashboardLayout title="Invoice Generation">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Automated Invoice Generation</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsCreating(true)}
        >
          Create New Invoice
        </button>
      </div>
      
      {!isCreating ? (
        <>
          <InvoiceFilters 
            filters={filters} 
            onFilterChange={setFilters} 
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <InvoiceTable 
                invoices={invoices || []} 
                isLoading={isLoading}
                onSelectInvoice={setSelectedInvoiceId}
                selectedInvoiceId={selectedInvoiceId}
              />
            </div>
            
            <div>
              {selectedInvoiceId ? (
                <InvoicePreview 
                  invoice={selectedInvoice} 
                  onGeneratePdf={() => generatePdfMutation.mutate(selectedInvoiceId)}
                  isGenerating={generatePdfMutation.isPending}
                />
              ) : (
                <div className="bg-card p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold">No Invoice Selected</h2>
                  <p className="text-muted-foreground">Select an invoice from the table to preview or download.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <InvoiceForm 
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
};

export default InvoiceGeneration;
```

#### 11. Payment Processing (/payment-processing)

```typescript
// src/pages/payments/PaymentProcessing.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { PaymentTable, PaymentDetails, ProcessPaymentModal, PaymentFilters } from '@/components/payments';
import { getPayments, processPayment } from '@/lib/api/payments';

const PaymentProcessing: React.FC = () => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: null,
    customer: '',
  });
  
  const queryClient = useQueryClient();
  
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => getPayments(filters)
  });
  
  const processMutation = useMutation({
    mutationFn: processPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsProcessModalOpen(false);
    }
  });
  
  const selectedPayment = payments?.find(payment => payment.id === selectedPaymentId);

  return (
    <DashboardLayout title="Payment Processing">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Secure Payment Processing</h1>
        <p className="text-muted-foreground">Process and manage payments securely</p>
      </div>
      
      <PaymentFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <PaymentTable 
            payments={payments || []} 
            isLoading={isLoading}
            onSelectPayment={setSelectedPaymentId}
            selectedPaymentId={selectedPaymentId}
            onProcessPayment={() => setIsProcessModalOpen(true)}
          />
        </div>
        
        <div>
          {selectedPaymentId ? (
            <PaymentDetails payment={selectedPayment} />
          ) : (
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">No Payment Selected</h2>
              <p className="text-muted-foreground">Select a payment from the table to view details.</p>
            </div>
          )}
        </div>
      </div>
      
      <ProcessPaymentModal 
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        payment={selectedPayment}
        onProcessPayment={(data) => processMutation.mutate({ id: selectedPaymentId, ...data })}
        isProcessing={processMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default PaymentProcessing;
```

#### 12. Document Management (/document-management)

```typescript
// src/pages/documents/DocumentManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { DocumentTable, DocumentViewer, UploadDocumentModal, DocumentFilters } from '@/components/documents';
import { getDocuments, uploadDocument, deleteDocument } from '@/lib/api/documents';

const DocumentManagement: React.FC = () => {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: null,
    search: '',
  });
  
  const queryClient = useQueryClient();
  
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => getDocuments(filters)
  });
  
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadModalOpen(false);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (selectedDocumentId === deleteMutation.variables) {
        setSelectedDocumentId(null);
      }
    }
  });
  
  const selectedDocument = documents?.find(doc => doc.id === selectedDocumentId);

  return (
    <DashboardLayout title="Document Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Document Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload Document
        </button>
      </div>
      
      <DocumentFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <DocumentTable 
            documents={documents || []} 
            isLoading={isLoading}
            onSelectDocument={setSelectedDocumentId}
            selectedDocumentId={selectedDocumentId}
            onDeleteDocument={(id) => deleteMutation.mutate(id)}
            isDeletingDocument={deleteMutation.isPending}
          />
        </div>
        
        <div>
          {selectedDocumentId ? (
            <DocumentViewer document={selectedDocument} />
          ) : (
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">No Document Selected</h2>
              <p className="text-muted-foreground">Select a document from the table to view or download.</p>
            </div>
          )}
        </div>
      </div>
      
      <UploadDocumentModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadDocument={(data) => uploadMutation.mutate(data)}
        isUploading={uploadMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default DocumentManagement;
```

#### 13. Report Generation (/report-generation)

```typescript
// src/pages/reports/ReportGeneration.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { ReportBuilder, ReportPreview, SavedReports, ReportFilters } from '@/components/reports';
import { getReportTemplates, generateReport, getSavedReports } from '@/lib/api/reports';

const ReportGeneration: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [reportConfig, setReportConfig] = useState({});
  const [previewData, setPreviewData] = useState(null);
  
  const { data: templates } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: getReportTemplates
  });
  
  const { data: savedReports } = useQuery({
    queryKey: ['savedReports'],
    queryFn: getSavedReports
  });
  
  const generateMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: (data) => {
      setPreviewData(data);
    }
  });
  
  const selectedTemplate = templates?.find(template => template.id === selectedTemplateId);

  return (
    <DashboardLayout title="Report Generation">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customizable Report Generation</h1>
        <p className="text-muted-foreground">Create, customize, and export reports</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
          <div className="bg-card p-6 rounded-lg shadow">
            {templates?.map(template => (
              <div 
                key={template.id}
                className={`p-3 mb-2 rounded cursor-pointer ${
                  selectedTemplateId === template.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Saved Reports</h2>
            <SavedReports reports={savedReports || []} />
          </div>
        </div>
        
        <div>
          {selectedTemplateId ? (
            <ReportBuilder 
              template={selectedTemplate}
              config={reportConfig}
              onConfigChange={setReportConfig}
              onGeneratePreview={() => generateMutation.mutate({ templateId: selectedTemplateId, config: reportConfig })}
              isGenerating={generateMutation.isPending}
            />
          ) : (
            <div className="bg-card p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">No Template Selected</h2>
              <p className="text-muted-foreground">Select a report template to get started.</p>
            </div>
          )}
        </div>
        
        <div>
          <ReportPreview data={previewData} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportGeneration;
```

#### 14. Chatbot (/chatbot)

```typescript
// src/pages/chatbot/Chatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout';
import { ChatMessage, ChatInput, ChatHeader } from '@/components/chatbot';
import { sendChatMessage } from '@/lib/api/chatbot';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI logistics assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const sendMessageMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (response) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          content: response.message,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    },
  });
  
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    sendMessageMutation.mutate({ message: content });
  };
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <DashboardLayout title="AI Chatbot">
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <ChatHeader />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <ChatMessage 
              key={message.id}
              message={message}
            />
          ))}
          <div ref={chatEndRef} />
        </div>
        
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default Chatbot;
```

## Backend Architecture

### API Endpoints

Here are the key API endpoints needed for the logistics platform:

#### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/me
```

#### User Management Endpoints

```
GET /api/users
GET /api/users/:id
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

#### Order Management Endpoints

```
GET /api/orders
GET /api/orders/:id
POST /api/orders
PUT /api/orders/:id
DELETE /api/orders/:id
GET /api/orders/:id/history
```

#### Shipment Tracking Endpoints

```
GET /api/shipments
GET /api/shipments/:id
POST /api/shipments
PUT /api/shipments/:id
DELETE /api/shipments/:id
GET /api/shipments/:id/history
GET /api/shipments/:id/location
```

#### Vehicle Tracking Endpoints

```
GET /api/vehicles
GET /api/vehicles/:id
POST /api/vehicles
PUT /api/vehicles/:id
DELETE /api/vehicles/:id
GET /api/vehicles/:id/location
GET /api/vehicles/:id/history
```

#### Invoice Generation Endpoints

```
GET /api/invoices
GET /api/invoices/:id
POST /api/invoices
PUT /api/invoices/:id
DELETE /api/invoices/:id
GET /api/invoices/:id/pdf
```

#### Payment Processing Endpoints

```
GET /api/payments
GET /api/payments/:id
POST /api/payments
PUT /api/payments/:id
GET /api/payments/methods
POST /api/payments/process
```

#### Document Management Endpoints

```
GET /api/documents
GET /api/documents/:id
POST /api/documents
DELETE /api/documents/:id
GET /api/documents/:id/download
```

#### Report Generation Endpoints

```
GET /api/reports/templates
GET /api/reports/saved
POST /api/reports/generate
GET /api/reports/:id
DELETE /api/reports/:id
```

#### Chatbot Endpoints

```
POST /api/chatbot/message
GET /api/chatbot/history
```

#### Dashboard Endpoints

```
GET /api/dashboard/metrics
GET /api/dashboard/shipment-status
GET /api/dashboard/revenue
GET /api/dashboard/routes
GET /api/dashboard/alerts
```

### Database Models

Here are the key database models for the logistics platform:

```typescript
// User Model
interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Hashed
  role: 'ADMIN' | 'MANAGER' | 'DRIVER' | 'CLIENT' | 'GUEST';
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Model
interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

// OrderItem Model
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Shipment Model
interface Shipment {
  id: string;
  orderId: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  origin: Address;
  destination: Address;
  currentLocation?: GeoLocation;
  history: ShipmentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// ShipmentHistory Model
interface ShipmentHistory {
  id: string;
  shipmentId: string;
  status: string;
  location?: GeoLocation;
  timestamp: Date;
  notes?: string;
}

// Vehicle Model
interface Vehicle {
  id: string;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: 'available' | 'in_transit' | 'maintenance' | 'out_of_service';
  currentLocation?: GeoLocation;
  currentDriverId?: string;
  fuelLevel: number;
  lastMaintenance: Date;
  createdAt: Date;
  updatedAt: Date;
}

// VehicleHistory Model
interface VehicleHistory {
  id: string;
  vehicleId: string;
  location: GeoLocation;
  speed: number;
  fuelLevel: number;
  timestamp: Date;
}

// Invoice Model
interface Invoice {
  id: string;
  customerId: string;
  orderId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// InvoiceItem Model
interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Payment Model
interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  currency: string;
  method: 'credit_card' | 'bank_transfer' | 'paypal' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Document Model
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  relatedId?: string; // Can be orderId, shipmentId, etc.
  relatedType?: string; // 'order', 'shipment', etc.
  uploadedBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
}

// Report Model
interface Report {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  createdBy: string; // userId
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ChatMessage Model
interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response?: string;
  timestamp: Date;
}

// Address Model
interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// GeoLocation Model
interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
}
```

## Third-Party Integrations

The logistics platform requires several third-party integrations:

1. **Mapping and Geolocation**
   - Leaflet.js for interactive maps (already in dependencies)
   - OpenStreetMap for map tiles
   - OSRM (Open Source Routing Machine) for route calculation

2. **Payment Processing**
   - Stripe for credit card processing
   - PayPal for alternative payment methods
   - Plaid for bank account verification

3. **Document Management**
   - AWS S3 or Azure Blob Storage for document storage
   - PDF.js for document viewing
   - jsPDF for PDF generation (already in dependencies)

4. **Chatbot AI**
   - OpenAI API for natural language processing
   - Dialogflow for intent recognition
   - Custom ML models for logistics-specific queries

5. **Analytics and Reporting**
   - Recharts for data visualization (already in dependencies)
   - PapaParse for CSV export (already in dependencies)
   - jsPDF-AutoTable for tabular PDF reports (already in dependencies)

## State Management

The application uses a combination of state management approaches:

1. **React Query** for server state management
   - Handles data fetching, caching, and synchronization
   - Provides loading, error, and success states
   - Manages data refetching and invalidation

2. **React Context** for global application state
   - Authentication state
   - Theme preferences
   - Language settings
   - Global notifications

3. **Local Component State** for UI state
   - Form inputs
   - Modal visibility
   - Pagination state
   - Filter selections

## Authentication & Authorization

The application uses Supabase for authentication and authorization:

1. **Authentication**
   - Email/password authentication
   - Social login (Google, GitHub)
   - Magic link authentication
   - JWT token management

2. **Authorization**
   - Role-based access control (ADMIN, MANAGER, DRIVER, CLIENT, GUEST)
   - Protected routes with role requirements
   - Feature-level permissions

## Deployment Strategy

The application can be deployed using the following strategy:

1. **Frontend**
   - Build with Vite
   - Deploy to Vercel, Netlify, or AWS S3 + CloudFront
   - Configure CI/CD pipeline for automated deployments

2. **Backend**
   - Deploy microservices to Kubernetes cluster
   - Use Docker containers for each service
   - Implement API Gateway for routing

3. **Database**
   - Use Supabase for PostgreSQL database
   - Implement database migrations for schema changes
   - Set up regular backups

4. **Monitoring**
   - Implement logging with ELK stack
   - Set up performance monitoring with New Relic or Datadog
   - Configure alerts for critical issues

## Conclusion

This architecture provides a comprehensive foundation for the DaorsForge AI Logistics platform. The modular structure ensures maintainability and scalability, while the use of modern technologies like React Query, TypeScript, and Supabase provides a robust development experience.

The implementation follows best practices for state management, authentication, and API design, ensuring a secure and performant application. The use of third-party integrations for specialized functionality like mapping, payments, and AI chatbot capabilities allows for rapid development without sacrificing quality.