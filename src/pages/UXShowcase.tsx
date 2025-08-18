import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Star, 
  Copy, 
  Download, 
  Share2, 
  Plus,
  Settings,
  Bell,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Wifi,
  Server
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Import our new UX components
import { 
  EnhancedSkeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonChart, 
  SkeletonList,
  SkeletonDashboard 
} from '@/components/ui/enhanced-skeleton';
import { 
  EnhancedError, 
  createErrorInfo,
  type ErrorInfo 
} from '@/components/ui/enhanced-error';
import {
  FloatingFeedback,
  RippleEffect,
  MagneticButton,
  MorphingIconButton,
  ElasticScale,
  StaggeredList,
  AnimatedProgress,
  CopyButton,
  LikeButton,
  FloatingActionButton
} from '@/components/ui/microinteractions';
import {
  LoadingSpinner,
  InlineLoading,
  FullPageLoading,
  CardLoading,
  TableLoading,
  ListLoading,
  ChartLoading,
  ButtonLoading,
  SearchLoading,
  FormLoading,
  ShipmentLoading,
  RouteLoading,
  DeliveryStatusLoading
} from '@/components/ui/loading-states';

const UXShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('skeletons');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  const [isToggled, setIsToggled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullPageLoading, setShowFullPageLoading] = useState(false);
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + Math.random() * 10;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const showError = (type: keyof typeof createErrorInfo) => {
    const errorInfo = createErrorInfo[type]();
    errorInfo.timestamp = new Date();
    setCurrentError(errorInfo);
  };

  const demoItems = [
    'Real-time shipment tracking',
    'Route optimization algorithms',
    'Inventory management system',
    'Customer portal integration',
    'Analytics dashboard',
    'Mobile fleet management'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            UX Enhancement Showcase
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our enhanced user experience components including skeleton screens, 
            improved error handling, and delightful microinteractions.
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skeletons">Skeleton Screens</TabsTrigger>
            <TabsTrigger value="errors">Error Handling</TabsTrigger>
            <TabsTrigger value="microinteractions">Microinteractions</TabsTrigger>
            <TabsTrigger value="loading">Loading States</TabsTrigger>
          </TabsList>

          {/* Skeleton Screens Tab */}
          <TabsContent value="skeletons" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Skeleton Screens</CardTitle>
                <CardDescription>
                  Beautiful loading placeholders with shimmer, wave, and pulse effects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Basic Skeletons */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Skeleton Variants</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Badge variant="outline">Shimmer</Badge>
                      <EnhancedSkeleton className="h-4 w-full" variant="shimmer" />
                      <EnhancedSkeleton className="h-4 w-3/4" variant="shimmer" />
                      <EnhancedSkeleton className="h-4 w-1/2" variant="shimmer" />
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">Wave</Badge>
                      <EnhancedSkeleton className="h-4 w-full" variant="wave" />
                      <EnhancedSkeleton className="h-4 w-3/4" variant="wave" />
                      <EnhancedSkeleton className="h-4 w-1/2" variant="wave" />
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">Pulse</Badge>
                      <EnhancedSkeleton className="h-4 w-full" variant="pulse" />
                      <EnhancedSkeleton className="h-4 w-3/4" variant="pulse" />
                      <EnhancedSkeleton className="h-4 w-1/2" variant="pulse" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Complex Skeletons */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Complex Layout Skeletons</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Badge variant="outline">Card Skeleton</Badge>
                      <SkeletonCard showHeader showFooter lines={3} />
                    </div>
                    <div className="space-y-4">
                      <Badge variant="outline">List Skeleton</Badge>
                      <SkeletonList items={4} showAvatar />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Data Skeletons */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Visualization Skeletons</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Badge variant="outline">Table Skeleton</Badge>
                      <SkeletonTable rows={4} columns={3} />
                    </div>
                    <div className="space-y-4">
                      <Badge variant="outline">Chart Skeleton</Badge>
                      <SkeletonChart type="bar" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dashboard Skeleton */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Complete Dashboard Skeleton</h3>
                  <SkeletonDashboard />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Handling Tab */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Error Handling</CardTitle>
                <CardDescription>
                  User-friendly error messages with helpful suggestions and recovery options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Type Buttons */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Try Different Error Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => showError('network')}
                      className="flex items-center gap-2"
                    >
                      <Wifi className="w-4 h-4" />
                      Network
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => showError('server')}
                      className="flex items-center gap-2"
                    >
                      <Server className="w-4 h-4" />
                      Server
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => showError('timeout')}
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Timeout
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => showError('permission')}
                      className="flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Permission
                    </Button>
                  </div>
                </div>

                {/* Error Display */}
                {currentError && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Error Preview</h3>
                    <EnhancedError
                      error={currentError}
                      onRetry={() => {
                        console.log('Retrying...');
                        setCurrentError(null);
                      }}
                      onGoHome={() => {
                        console.log('Going home...');
                        setCurrentError(null);
                      }}
                      onContactSupport={() => {
                        console.log('Contacting support...');
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Microinteractions Tab */}
          <TabsContent value="microinteractions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feedback Animations */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Animations</CardTitle>
                  <CardDescription>
                    Delightful feedback for user actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Floating Feedback</h4>
                    <div className="flex flex-wrap gap-3">
                      <FloatingFeedback feedback="success">
                        <Button variant="outline">Success</Button>
                      </FloatingFeedback>
                      <FloatingFeedback feedback="like">
                        <Button variant="outline">Like</Button>
                      </FloatingFeedback>
                      <FloatingFeedback feedback="star">
                        <Button variant="outline">Star</Button>
                      </FloatingFeedback>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Interactive Buttons</h4>
                    <div className="flex flex-wrap gap-3">
                      <LikeButton
                        isLiked={isLiked}
                        onToggle={handleLikeToggle}
                        count={likeCount}
                      />
                      <CopyButton text="Hello, World!">
                        Copy Text
                      </CopyButton>
                      <MorphingIconButton
                        icon1={Settings}
                        icon2={Bell}
                        isToggled={isToggled}
                        onToggle={() => setIsToggled(!isToggled)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Progress Animation</h4>
                    <AnimatedProgress value={progress} showValue />
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Effects */}
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Effects</CardTitle>
                  <CardDescription>
                    Hover and click effects for better engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Ripple Effect</h4>
                    <RippleEffect className="inline-block">
                      <Button>Click for Ripple</Button>
                    </RippleEffect>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Magnetic Button</h4>
                    <MagneticButton strength={0.2}>
                      <Button variant="outline">Hover Me</Button>
                    </MagneticButton>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Elastic Scale</h4>
                    <div className="flex gap-3">
                      <ElasticScale>
                        <Card className="p-4 cursor-pointer">
                          <p className="text-sm">Hover to scale</p>
                        </Card>
                      </ElasticScale>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Staggered Animation</h4>
                    <StaggeredList className="space-y-2">
                      {demoItems.map((item, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{item}</p>
                        </div>
                      ))}
                    </StaggeredList>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Loading States Tab */}
          <TabsContent value="loading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Loading */}
              <Card>
                <CardHeader>
                  <CardTitle>Loading Spinners</CardTitle>
                  <CardDescription>
                    Various loading indicators for different contexts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Spinner Variants</h4>
                    <div className="flex items-center gap-6">
                      <div className="text-center space-y-2">
                        <LoadingSpinner variant="default" />
                        <p className="text-xs text-muted-foreground">Default</p>
                      </div>
                      <div className="text-center space-y-2">
                        <LoadingSpinner variant="dots" />
                        <p className="text-xs text-muted-foreground">Dots</p>
                      </div>
                      <div className="text-center space-y-2">
                        <LoadingSpinner variant="pulse" />
                        <p className="text-xs text-muted-foreground">Pulse</p>
                      </div>
                      <div className="text-center space-y-2">
                        <LoadingSpinner variant="truck" />
                        <p className="text-xs text-muted-foreground">Truck</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Inline Loading</h4>
                    <div className="space-y-3">
                      <InlineLoading text="Loading data..." />
                      <InlineLoading text="Processing..." variant="dots" />
                      <InlineLoading text="Optimizing route..." variant="truck" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Button Loading</h4>
                    <div className="flex gap-3">
                      <ButtonLoading
                        loading={isLoading}
                        loadingText="Processing..."
                        onClick={simulateLoading}
                      >
                        Start Process
                      </ButtonLoading>
                      <Button 
                        variant="outline"
                        onClick={() => setShowFullPageLoading(true)}
                      >
                        Show Full Page Loading
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Component Loading States */}
              <Card>
                <CardHeader>
                  <CardTitle>Component Loading States</CardTitle>
                  <CardDescription>
                    Loading states for specific UI components
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Search Loading</h4>
                    <SearchLoading />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Logistics Loading</h4>
                    <div className="space-y-4">
                      <ShipmentLoading />
                      <RouteLoading />
                      <DeliveryStatusLoading />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={Plus}
          label="Add New Item"
          onClick={() => console.log('FAB clicked')}
          position="bottom-right"
        />

        {/* Full Page Loading Modal */}
        {showFullPageLoading && (
          <div className="fixed inset-0 z-50">
            <FullPageLoading
              title="Processing Your Request"
              subtitle="This may take a few moments..."
              progress={progress}
              steps={[
                'Validating data',
                'Processing request',
                'Updating database',
                'Sending notifications'
              ]}
              currentStep={Math.floor(progress / 25)}
            />
            <Button
              className="absolute top-4 right-4 z-10"
              variant="outline"
              onClick={() => setShowFullPageLoading(false)}
            >
              Close Demo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UXShowcase;