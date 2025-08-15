import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import GlobalSearch from '@/components/GlobalSearch';
import DocumentManager from '@/components/DocumentManager';
import FormBuilder from '@/components/FormBuilder';
import DynamicForm from '@/components/DynamicForm';
import EnhancedTable from '@/components/EnhancedTable';
import { Item } from '@/lib/types';

const DemoPage = () => {
  const { toast } = useToast();
  const [item, setItem] = useState<Item>({
    id: 'demo-1',
    name: 'Demo Package',
    status: 'in_transit',
    location: 'Belgrade, Serbia',
    coordinates: { lat: 44.7866, lng: 20.4489 },
    history: [
      { status: 'picked_up', timestamp: '2023-05-01T08:00:00Z' },
      { status: 'in_transit', timestamp: '2023-05-01T12:00:00Z' }
    ],
    documents: [],
  });

  const formSchema = [
    {
      id: 'name',
      type: 'text' as const,
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
      validation: { minLength: 2, maxLength: 50 }
    },
    {
      id: 'email',
      type: 'email' as const,
      label: 'Email Address',
      placeholder: 'Enter your email',
      required: true,
      validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
    },
    {
      id: 'phone',
      type: 'phone' as const,
      label: 'Phone Number',
      placeholder: 'Enter your phone number',
      required: false
    },
    {
      id: 'birthdate',
      type: 'date' as const,
      label: 'Birth Date',
      placeholder: 'Select your birth date',
      required: true
    },
    {
      id: 'bio',
      type: 'textarea' as const,
      label: 'Bio',
      placeholder: 'Tell us about yourself',
      required: false
    },
    {
      id: 'role',
      type: 'select' as const,
      label: 'Role',
      placeholder: 'Select your role',
      required: true,
      options: ['Developer', 'Designer', 'Manager', 'Other']
    },
    {
      id: 'newsletter',
      type: 'checkbox' as const,
      label: 'Subscribe to newsletter',
      required: false
    }
  ];

  const handleFormSubmit = (data: Record<string, string | boolean | Date | null>) => {
    console.log('Form submitted:', data);
    toast({
      title: 'Form Submitted',
      description: 'Your form has been submitted successfully!',
    });
  };

  const handleDocumentsChange = (newDocuments: Item['documents']) => {
    setItem(prev => ({ ...prev, documents: newDocuments }));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">UI Components Demo</h1>
        <p className="text-muted-foreground mt-2">
          Showcase of all implemented UI components with anime.js animations
        </p>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="files">File Management</TabsTrigger>
          <TabsTrigger value="builder">Form Builder</TabsTrigger>
          <TabsTrigger value="dynamic">Dynamic Form</TabsTrigger>
          <TabsTrigger value="table">Enhanced Table</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto">
                <GlobalSearch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="default">Default Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="outline">Outline Button</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Management</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentManager 
                item={item} 
                onDocumentsChange={handleDocumentsChange} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <FormBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Form</CardTitle>
            </CardHeader>
            <CardContent>
              <DynamicForm 
                schema={formSchema}
                onSubmit={handleFormSubmit}
                submitLabel="Submit Form"
                cancelLabel="Cancel"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Table</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedTable
                data={[
                  { id: '1', name: 'Package A', status: 'In Transit', location: 'Belgrade', value: 150 },
                  { id: '2', name: 'Package B', status: 'Delivered', location: 'Sarajevo', value: 200 },
                  { id: '3', name: 'Package C', status: 'Pending', location: 'Zagreb', value: 75 },
                  { id: '4', name: 'Package D', status: 'In Transit', location: 'Ljubljana', value: 300 },
                  { id: '5', name: 'Package E', status: 'Delivered', location: 'Podgorica', value: 120 },
                  { id: '6', name: 'Package F', status: 'Pending', location: 'Skopje', value: 90 },
                  { id: '7', name: 'Package G', status: 'In Transit', location: 'Pristina', value: 180 },
                  { id: '8', name: 'Package H', status: 'Delivered', location: 'Tirana', value: 250 },
                  { id: '9', name: 'Package I', status: 'Pending', location: 'Bucharest', value: 110 },
                  { id: '10', name: 'Package J', status: 'In Transit', location: 'Sofia', value: 160 },
                  { id: '11', name: 'Package K', status: 'Delivered', location: 'Athens', value: 220 },
                  { id: '12', name: 'Package L', status: 'Pending', location: 'Ankara', value: 140 },
                ]}
                columns={[
                  { key: 'id', title: 'ID', sortable: true },
                  { key: 'name', title: 'Name', sortable: true },
                  { key: 'status', title: 'Status', sortable: true },
                  { key: 'location', title: 'Location', sortable: true },
                  { key: 'value', title: 'Value ($)', sortable: true },
                ]}
                itemsPerPage={5}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center text-sm text-muted-foreground">
        <p>All components feature smooth animations powered by anime.js</p>
      </div>
    </div>
  );
};

export default DemoPage;
