import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const initialInventoryItems = [
  {
    id: "ITEM-001",
    name: "Laptop Pro 15\"",
    stockLevel: 120,
    warehouseLocation: "A-12",
    status: "In Stock",
  },
  {
    id: "ITEM-002",
    name: "Wireless Mouse",
    stockLevel: 340,
    warehouseLocation: "C-05",
    status: "In Stock",
  },
  {
    id: "ITEM-003",
    name: "Mechanical Keyboard",
    stockLevel: 0,
    warehouseLocation: "B-01",
    status: "Out of Stock",
  },
  {
    id: "ITEM-004",
    name: "USB-C Hub",
    stockLevel: 50,
    warehouseLocation: "A-15",
    status: "Low Stock",
  },
  {
    id: "ITEM-005",
    name: "4K Monitor 27\"",
    stockLevel: 75,
    warehouseLocation: "D-02",
    status: "In Stock",
  },
];

const Inventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems);
  const [open, setOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [updatedRows, setUpdatedRows] = useState<string[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    stockLevel: "",
    warehouseLocation: "",
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLive) {
      interval = setInterval(() => {
        const updatedIds: string[] = [];
        setInventoryItems((prevItems) =>
          prevItems.map((item) => {
            const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
            if (change === 0) return item;

            const newStockLevel = Math.max(0, item.stockLevel + change);
            let status = "In Stock";
            if (newStockLevel === 0) {
              status = "Out of Stock";
            } else if (newStockLevel < 50) {
              status = "Low Stock";
            }
            updatedIds.push(item.id);
            return { ...item, stockLevel: newStockLevel, status };
          })
        );
        setUpdatedRows(updatedIds);
        setTimeout(() => setUpdatedRows([]), 1000);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewItem((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddItem = () => {
    const newId = `ITEM-${String(inventoryItems.length + 1).padStart(3, '0')}`;
    const stockLevel = parseInt(newItem.stockLevel, 10);
    let status = "In Stock";
    if (stockLevel === 0) {
      status = "Out of Stock";
    } else if (stockLevel < 50) {
      status = "Low Stock";
    }

    setInventoryItems((prev) => [
      ...prev,
      {
        id: newId,
        name: newItem.name,
        stockLevel: stockLevel,
        warehouseLocation: newItem.warehouseLocation,
        status,
      },
    ]);
    setNewItem({ name: "", stockLevel: "", warehouseLocation: "" });
    setOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="mt-2 text-muted-foreground">
            Track stock levels, manage warehouse locations, and handle inbound/outbound logistics.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="live-updates" checked={isLive} onCheckedChange={setIsLive} />
            <Label htmlFor="live-updates">Live Updates</Label>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input id="name" value={newItem.name} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stockLevel" className="text-right">
                    Stock Level
                  </Label>
                  <Input id="stockLevel" type="number" value={newItem.stockLevel} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="warehouseLocation" className="text-right">
                    Warehouse Location
                  </Label>
                  <Input id="warehouseLocation" value={newItem.warehouseLocation} onChange={handleInputChange} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Stock Level</TableHead>
            <TableHead>Warehouse Location</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItems.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                updatedRows.includes(item.id) ? "bg-green-100 dark:bg-green-900" : ""
              )}
            >
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.stockLevel}</TableCell>
              <TableCell>{item.warehouseLocation}</TableCell>
              <TableCell>{item.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Inventory;
