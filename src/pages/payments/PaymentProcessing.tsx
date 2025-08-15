import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PaymentProcessing: React.FC = () => {
  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Payment Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Invoice</label>
                <Input placeholder="Invoice ID" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Amount</label>
                <Input placeholder="Amount" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Method</label>
                <Select defaultValue="card">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button>Process Payment</Button>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default PaymentProcessing;