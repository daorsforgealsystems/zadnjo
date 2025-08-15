import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DocumentManagement: React.FC = () => {
  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Document Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input type="file" />
              <Button>Upload</Button>
            </div>
            <div className="text-sm text-muted-foreground">Recent documents will appear here.</div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default DocumentManagement;