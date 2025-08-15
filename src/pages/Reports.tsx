import React, { useState, useEffect } from 'react';
import { Item, LiveRoute } from '@/lib/types';
import { getItems, getLiveRoutes } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autoTable
interface AutoTableOptions {
  head: string[][];
  body: (string | number)[][];
  startY?: number;
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => jsPDF;
}

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('inventory');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [shipments, setShipments] = useState<LiveRoute[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<Item[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<LiveRoute[]>([]);
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');

  useEffect(() => {
    getItems().then(setInventory);
    getLiveRoutes().then(setShipments);
  }, []);

  useEffect(() => {
    let items = inventory;
    if (inventoryStatusFilter !== 'all') {
      items = inventory.filter(item => item.status === inventoryStatusFilter);
    }
    setFilteredInventory(items);
  }, [inventory, inventoryStatusFilter]);

  useEffect(() => {
    let routes = shipments;
    if (shipmentStatusFilter !== 'all') {
      routes = shipments.filter(route => route.status === shipmentStatusFilter);
    }
    setFilteredShipments(routes);
  }, [shipments, shipmentStatusFilter]);

  const inventoryStatuses = ['all', ...Array.from(new Set(inventory.map(item => item.status)))];
  const shipmentStatuses = ['all', ...Array.from(new Set(shipments.map(route => route.status)))];

  const generateCsv = () => {
    if (reportType === 'inventory') {
      const csv = Papa.unparse(filteredInventory);
      downloadFile(csv, 'inventory_report.csv', 'text/csv');
    } else {
      const csv = Papa.unparse(filteredShipments);
      downloadFile(csv, 'shipments_report.csv', 'text/csv');
    }
  };

  const generatePdf = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    if (reportType === 'inventory') {
      doc.text('Inventory Report', 14, 16);
      doc.autoTable({
        head: [['ID', 'Name', 'Status', 'Location']],
        body: filteredInventory.map(item => [item.id, item.name, item.status, item.location]),
        startY: 20,
      });
      doc.save('inventory_report.pdf');
    } else {
      doc.text('Shipments Report', 14, 16);
      doc.autoTable({
        head: [['ID', 'From', 'To', 'Status', 'Driver', 'ETA']],
        body: filteredShipments.map(route => [route.id, route.from, route.to, route.status, route.driver, route.eta]),
        startY: 20,
      });
      doc.save('shipments_report.pdf');
    }
  };

  const downloadFile = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Generate Reports</h1>
      <p className="text-muted-foreground">
        Select a report type, apply filters, and download the data in CSV or PDF format.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="shipments">Shipments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'inventory' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={inventoryStatusFilter} onValueChange={setInventoryStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType === 'shipments' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={shipmentStatusFilter} onValueChange={setShipmentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {shipmentStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button onClick={generateCsv} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Generate CSV
        </Button>
        <Button onClick={generatePdf}>
          <Download className="mr-2 h-4 w-4" />
          Generate PDF
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Preview</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Showing {reportType === 'inventory' ? filteredInventory.length : filteredShipments.length} records.
        </p>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {reportType === 'inventory' ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-4 text-left font-medium">ID</th>
                      <th className="p-4 text-left font-medium">Name</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">{item.id}</td>
                        <td className="p-4">{item.name}</td>
                        <td className="p-4">{item.status}</td>
                        <td className="p-4">{item.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-4 text-left font-medium">ID</th>
                      <th className="p-4 text-left font-medium">From</th>
                      <th className="p-4 text-left font-medium">To</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Driver</th>
                      <th className="p-4 text-left font-medium">ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.slice(0, 10).map((route) => (
                      <tr key={route.id} className="border-b">
                        <td className="p-4">{route.id}</td>
                        <td className="p-4">{route.from}</td>
                        <td className="p-4">{route.to}</td>
                        <td className="p-4">{route.status}</td>
                        <td className="p-4">{route.driver}</td>
                        <td className="p_4">{route.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {((reportType === 'inventory' && filteredInventory.length > 10) ||
              (reportType === 'shipments' && filteredShipments.length > 10)) && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                ...and more.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
