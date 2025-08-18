import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Filter, Download, Package, Clock, ArrowRight } from 'lucide-react';

// Mock data for shipment history
const mockShipments = [
  {
    id: 'SH-1234',
    trackingNumber: 'TRK-7823-4921',
    origin: 'London',
    destination: 'Manchester',
    status: 'delivered',
    customer: 'Acme Corp',
    date: '2023-10-15',
    deliveryTime: '14:35',
  },
  {
    id: 'SH-1235',
    trackingNumber: 'TRK-6392-1047',
    origin: 'Birmingham',
    destination: 'London',
    status: 'delivered',
    customer: 'TechSolutions Ltd',
    date: '2023-10-12',
    deliveryTime: '09:22',
  },
  {
    id: 'SH-1236',
    trackingNumber: 'TRK-9371-5280',
    origin: 'Liverpool',
    destination: 'Leeds',
    status: 'delivered',
    customer: 'Global Logistics',
    date: '2023-10-10',
    deliveryTime: '16:45',
  },
  {
    id: 'SH-1237',
    trackingNumber: 'TRK-5128-7392',
    origin: 'Glasgow',
    destination: 'Edinburgh',
    status: 'delivered',
    customer: 'Northern Supplies',
    date: '2023-10-08',
    deliveryTime: '11:15',
  },
  {
    id: 'SH-1238',
    trackingNumber: 'TRK-2947-1038',
    origin: 'Cardiff',
    destination: 'Bristol',
    status: 'delivered',
    customer: 'Western Distribution',
    date: '2023-10-05',
    deliveryTime: '13:50',
  },
];

// Shipment timeline events
const mockTimelineEvents = [
  { id: 1, shipmentId: 'SH-1234', status: 'order-placed', location: 'Online', timestamp: '2023-10-14 09:15', description: 'Order placed by customer' },
  { id: 2, shipmentId: 'SH-1234', status: 'processing', location: 'London Warehouse', timestamp: '2023-10-14 11:30', description: 'Order processing started' },
  { id: 3, shipmentId: 'SH-1234', status: 'packed', location: 'London Warehouse', timestamp: '2023-10-14 14:45', description: 'Package prepared for shipping' },
  { id: 4, shipmentId: 'SH-1234', status: 'in-transit', location: 'London Distribution Center', timestamp: '2023-10-14 17:20', description: 'Package in transit' },
  { id: 5, shipmentId: 'SH-1234', status: 'out-for-delivery', location: 'Manchester Local Hub', timestamp: '2023-10-15 08:30', description: 'Out for delivery' },
  { id: 6, shipmentId: 'SH-1234', status: 'delivered', location: 'Manchester', timestamp: '2023-10-15 14:35', description: 'Package delivered' },
];

const ShipmentHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'delivered': { color: 'bg-green-500', label: 'Delivered' },
      'in-transit': { color: 'bg-blue-500', label: 'In Transit' },
      'processing': { color: 'bg-amber-500', label: 'Processing' },
      'order-placed': { color: 'bg-purple-500', label: 'Order Placed' },
      'packed': { color: 'bg-indigo-500', label: 'Packed' },
      'out-for-delivery': { color: 'bg-teal-500', label: 'Out for Delivery' },
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-500', label: status };
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredShipments = mockShipments.filter(shipment => {
    const matchesSearch = searchQuery === '' || 
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = !date || shipment.date === format(date, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  const shipmentEvents = mockTimelineEvents.filter(
    event => event.shipmentId === selectedShipment
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipment History</h1>
          <p className="text-muted-foreground">
            View and track past shipments
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Search Shipments</CardTitle>
          <CardDescription>
            Find shipments by tracking number, customer, or location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by tracking #, customer, or location..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={() => setDate(undefined)} title="Clear date filter">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipment Records</CardTitle>
              <CardDescription>
                {filteredShipments.length} shipments found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.length > 0 ? (
                      filteredShipments.map((shipment) => (
                        <TableRow key={shipment.id} className={selectedShipment === shipment.id ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span>{shipment.origin}</span>
                              <ArrowRight className="w-3 h-3 mx-1" />
                              <span>{shipment.destination}</span>
                            </div>
                          </TableCell>
                          <TableCell>{shipment.date}</TableCell>
                          <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                          <TableCell>{shipment.customer}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedShipment(shipment.id)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No shipments found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredShipments.length} of {mockShipments.length} shipments
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Shipment Timeline</CardTitle>
              <CardDescription>
                {selectedShipment ? 'Tracking events for selected shipment' : 'Select a shipment to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedShipment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-primary" />
                    <span className="font-medium">
                      {mockShipments.find(s => s.id === selectedShipment)?.trackingNumber}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border"></div>
                    <div className="space-y-6">
                      {shipmentEvents.map((event) => (
                        <div key={event.id} className="relative pl-10">
                          <div className="absolute left-0 top-1 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{event.description}</h4>
                              {getStatusBadge(event.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.location}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {event.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">No shipment selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a shipment from the table to view its timeline
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShipmentHistory;