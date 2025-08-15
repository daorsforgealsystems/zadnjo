import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

// Temporary stub to fix build: original file had a duplicated block appended
// TODO: Restore full RealTimeTracker implementation once duplication is resolved
const RealTimeTracker: React.FC = () => {
  return (
    <div className="w-full h-[600px] flex items-center justify-center">
      <Card className="max-w-xl w-full m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Real-time Tracking
            <Badge variant="outline" className="ml-2">Temporarily Unavailable</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This feature is temporarily disabled while we fix a build issue caused by a duplicated component definition.
          </p>
          <p className="text-sm text-muted-foreground">
            You can continue to preview the rest of the application. We will restore live tracking shortly.
          </p>
          <div className="pt-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeTracker;