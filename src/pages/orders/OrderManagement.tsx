import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import EnhancedTable from '@/components/EnhancedTable';

const OrderManagement: React.FC = () => {
  const data = Array.from({ length: 12 }).map((_, i) => ({ id: `ORD-${1000+i}`, status: i%3===0?'Processing': i%3===1?'In Transit':'Delivered', customer: `Customer ${i+1}`, amount: Math.round(100+Math.random()*900) }))
  const columns = [
    { header: 'Order ID', accessorKey: 'id' },
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Amount', accessorKey: 'amount' },
  ];

  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTable data={data as any} columns={columns as any} pagination={{ pageSize: 10 }} />
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default OrderManagement;