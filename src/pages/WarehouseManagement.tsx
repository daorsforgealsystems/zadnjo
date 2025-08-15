import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Package,
  Warehouse as WarehouseIcon,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MapPin,
  Clock,
  Users,
  Boxes,
  ArrowUpDown,
  ChevronRight,
  Scan,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import { WarehouseService, InventoryService } from '@/lib/api/logicore-service';
import type { Warehouse, InventoryLevel, StockMovement } from '@/lib/api/logicore-types';

const WarehouseManagement: React.FC = () => {
  const { t } = useTranslation();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // New warehouse form state
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    address: '',
    totalCapacity: 0,
    phone: '',
    email: '',
    manager: ''
  });

  // Stock adjustment form state
  const [stockAdjustment, setStockAdjustment] = useState({
    itemId: '',
    warehouseId: '',
    adjustmentType: 'inbound',
    quantity: 0,
    notes: ''
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseData(selectedWarehouse.id);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    setLoading(true);
    const response = await WarehouseService.getWarehouses();
    if (response.success && response.data) {
      setWarehouses(response.data);
      if (response.data.length > 0) {
        setSelectedWarehouse(response.data[0]);
      }
    } else {
      toast.error('Failed to load warehouses');
    }
    setLoading(false);
  };

  const fetchWarehouseData = async (warehouseId: string) => {
    const [levelsResponse, lowStockResponse] = await Promise.all([
      InventoryService.getInventoryLevels(warehouseId),
      InventoryService.getLowStockItems(warehouseId)
    ]);

    if (levelsResponse.success && levelsResponse.data) {
      setInventoryLevels(levelsResponse.data);
    }

    if (lowStockResponse.success && lowStockResponse.data) {
      setLowStockItems(lowStockResponse.data);
    }
  };

  const handleAddWarehouse = async () => {
    const response = await WarehouseService.createWarehouse({
      name: newWarehouse.name,
      code: newWarehouse.code,
      address: newWarehouse.address,
      capacity: {
        total_sqft: newWarehouse.totalCapacity,
        used_sqft: 0,
        zones: []
      },
      contactInfo: {
        phone: newWarehouse.phone,
        email: newWarehouse.email,
        manager: newWarehouse.manager
      },
      location: {
        lat: 0, // Would get from geocoding
        lng: 0
      },
      isActive: true
    });

    if (response.success) {
      toast.success('Warehouse added successfully');
      setShowAddWarehouse(false);
      fetchWarehouses();
      setNewWarehouse({
        name: '',
        code: '',
        address: '',
        totalCapacity: 0,
        phone: '',
        email: '',
        manager: ''
      });
    } else {
      toast.error(response.error || 'Failed to add warehouse');
    }
  };

  const handleStockAdjustment = async () => {
    const response = await InventoryService.recordStockMovement({
      itemId: stockAdjustment.itemId,
      warehouseId: stockAdjustment.warehouseId || selectedWarehouse?.id,
      movementType: stockAdjustment.adjustmentType as any,
      quantity: stockAdjustment.quantity,
      referenceType: 'adjustment',
      notes: stockAdjustment.notes
    });

    if (response.success) {
      toast.success('Stock adjustment recorded');
      setShowStockAdjustment(false);
      if (selectedWarehouse) {
        fetchWarehouseData(selectedWarehouse.id);
      }
      setStockAdjustment({
        itemId: '',
        warehouseId: '',
        adjustmentType: 'inbound',
        quantity: 0,
        notes: ''
      });
    } else {
      toast.error(response.error || 'Failed to adjust stock');
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    const response = await InventoryService.scanBarcode(barcode);
    if (response.success && response.data) {
      toast.success(`Item found: ${response.data.name}`);
      // Open item details or perform action
    } else {
      toast.error('Item not found');
    }
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredInventory = inventoryLevels.filter(level =>
    level.item?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.item?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage inventory, track stock levels, and optimize warehouse operations
            </p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Barcode Scanner</DialogTitle>
                  <DialogDescription>
                    Scan or enter barcode to find item
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <Input
                      placeholder="Enter or scan barcode"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeScan((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Warehouse</DialogTitle>
                  <DialogDescription>
                    Enter warehouse details to add a new location
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Warehouse Name</Label>
                      <Input
                        id="name"
                        value={newWarehouse.name}
                        onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                        placeholder="Main Distribution Center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Warehouse Code</Label>
                      <Input
                        id="code"
                        value={newWarehouse.code}
                        onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                        placeholder="WH-001"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newWarehouse.address}
                      onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                      placeholder="123 Logistics Way, City, State 12345"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Total Capacity (sq ft)</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newWarehouse.totalCapacity}
                        onChange={(e) => setNewWarehouse({ ...newWarehouse, totalCapacity: parseInt(e.target.value) })}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager">Warehouse Manager</Label>
                      <Input
                        id="manager"
                        value={newWarehouse.manager}
                        onChange={(e) => setNewWarehouse({ ...newWarehouse, manager: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Phone</Label>
                      <Input
                        id="phone"
                        value={newWarehouse.phone}
                        onChange={(e) => setNewWarehouse({ ...newWarehouse, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newWarehouse.email}
                        onChange={(e) => setNewWarehouse({ ...newWarehouse, email: e.target.value })}
                        placeholder="warehouse@company.com"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddWarehouse(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddWarehouse}>Add Warehouse</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Warehouse Selector */}
      <div className="mb-6">
        <Select value={selectedWarehouse?.id} onValueChange={(value) => {
          const warehouse = warehouses.find(w => w.id === value);
          setSelectedWarehouse(warehouse || null);
        }}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="h-4 w-4" />
                  {warehouse.name} ({warehouse.code})
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedWarehouse && (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventoryLevels.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active SKUs in warehouse
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Capacity Used</CardTitle>
                  <Boxes className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((selectedWarehouse.capacity.used_sqft / selectedWarehouse.capacity.total_sqft) * 100)}%
                  </div>
                  <Progress
                    value={(selectedWarehouse.capacity.used_sqft / selectedWarehouse.capacity.total_sqft) * 100}
                    className={`mt-2 h-2`}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedWarehouse.capacity.used_sqft.toLocaleString()} / {selectedWarehouse.capacity.total_sqft.toLocaleString()} sq ft
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Items below reorder point
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">142</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock movements today
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-[600px] grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="movements">Movements</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Warehouse Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Information</CardTitle>
                  <CardDescription>Details about {selectedWarehouse.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                      <p className="text-sm">{selectedWarehouse.address}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Operating Hours
                      </div>
                      <p className="text-sm">Mon-Fri: 8:00 AM - 6:00 PM</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Manager
                      </div>
                      <p className="text-sm">{selectedWarehouse.contactInfo?.manager || 'Not assigned'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              {lowStockItems.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{lowStockItems.length} items</strong> are running low on stock and need to be reordered.
                    <Button variant="link" className="px-2" onClick={() => setActiveTab('inventory')}>
                      View Items <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Zone Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle>Zone Utilization</CardTitle>
                  <CardDescription>Capacity usage by warehouse zone</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Receiving', 'Storage', 'Picking', 'Packing', 'Shipping'].map((zone, index) => {
                      const usage = Math.random() * 100; // Would come from actual data
                      return (
                        <div key={zone} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{zone}</span>
                            <span className="text-muted-foreground">{Math.round(usage)}%</span>
                          </div>
                          <Progress value={usage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Inventory Items</CardTitle>
                      <CardDescription>Manage stock levels and locations</CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-[300px]"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                      <Dialog open={showStockAdjustment} onOpenChange={setShowStockAdjustment}>
                        <DialogTrigger asChild>
                          <Button>
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            Adjust Stock
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Stock Adjustment</DialogTitle>
                            <DialogDescription>
                              Record stock movements and adjustments
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Item</Label>
                              <Select
                                value={stockAdjustment.itemId}
                                onValueChange={(value) => setStockAdjustment({ ...stockAdjustment, itemId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryLevels.map((level) => (
                                    <SelectItem key={level.itemId} value={level.itemId}>
                                      {level.item?.name} ({level.item?.sku})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Adjustment Type</Label>
                              <Select
                                value={stockAdjustment.adjustmentType}
                                onValueChange={(value) => setStockAdjustment({ ...stockAdjustment, adjustmentType: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inbound">Inbound</SelectItem>
                                  <SelectItem value="outbound">Outbound</SelectItem>
                                  <SelectItem value="adjustment">Adjustment</SelectItem>
                                  <SelectItem value="return">Return</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                value={stockAdjustment.quantity}
                                onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea
                                value={stockAdjustment.notes}
                                onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                                placeholder="Reason for adjustment..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowStockAdjustment(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleStockAdjustment}>Record Adjustment</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">On Hand</TableHead>
                        <TableHead className="text-right">Reserved</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((level) => (
                        <TableRow key={level.id}>
                          <TableCell className="font-mono text-sm">{level.item?.sku}</TableCell>
                          <TableCell className="font-medium">{level.item?.name}</TableCell>
                          <TableCell className="font-mono text-sm">{level.locationCode || '-'}</TableCell>
                          <TableCell className="text-right">{level.quantity}</TableCell>
                          <TableCell className="text-right">{level.reservedQuantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {level.availableQuantity}
                          </TableCell>
                          <TableCell>
                            {level.quantity <= (level.reorderPoint || 0) ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : level.quantity > (level.reorderPoint || 0) * 2 ? (
                              <Badge variant="default" className="bg-green-500">In Stock</Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movements" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Stock Movements</CardTitle>
                      <CardDescription>Recent inventory transactions</CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Sample movements - would come from API */}
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">
                            {new Date().toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={i % 2 === 0 ? 'default' : 'secondary'}>
                              {i % 2 === 0 ? 'Inbound' : 'Outbound'}
                            </Badge>
                          </TableCell>
                          <TableCell>Product {i}</TableCell>
                          <TableCell>A01-R02-S03</TableCell>
                          <TableCell>B05-R01-S02</TableCell>
                          <TableCell className="text-right">
                            {i % 2 === 0 ? '+' : '-'}{Math.floor(Math.random() * 100)}
                          </TableCell>
                          <TableCell>John Doe</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {i % 2 === 0 ? 'Received from supplier' : 'Order fulfillment'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Levels Trend</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12" />
                      <span className="ml-2">Chart visualization here</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Moving Items</CardTitle>
                    <CardDescription>This month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Product {i}</p>
                            <p className="text-sm text-muted-foreground">SKU-00{i}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{Math.floor(Math.random() * 1000)}</p>
                            <p className="text-sm text-muted-foreground">units</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Turnover</CardTitle>
                    <CardDescription>By category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Electronics', 'Clothing', 'Food', 'Furniture'].map((category) => {
                        const turnover = Math.random() * 20;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{category}</span>
                              <span className="font-medium">{turnover.toFixed(1)}x</span>
                            </div>
                            <Progress value={turnover * 5} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Picking Efficiency</CardTitle>
                    <CardDescription>Average time per order</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold">12.5</p>
                        <p className="text-sm text-muted-foreground">minutes per order</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Target</span>
                          <span className="text-green-600">10 min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Best</span>
                          <span>8.2 min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Worst</span>
                          <span>18.7 min</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default WarehouseManagement;