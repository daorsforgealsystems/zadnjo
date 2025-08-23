import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DOMPurify from 'dompurify';

// Zod schema for client-side validation
const documentSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  // Ensure description is always a string in the parsed output
  description: z.string().trim().max(1000, 'Description is too long').optional().default(''),
  // Use instanceof File so the parsed output has type File
  file: z
    .instanceof(File)
    .refine(
      (f: File) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type),
      'Only PDF, DOCX, or TXT files are allowed'
    )
    .refine((f: File) => f.size <= 5 * 1024 * 1024, 'File must be 5MB or less'),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const DocumentManagement: React.FC = () => {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema) as any,
    defaultValues: { title: '', description: '' },
  });

  // Submit handler: sanitize free-text before using/sending
  const onSubmit = (values: DocumentFormValues) => {
    const sanitizedDescription = DOMPurify.sanitize(values.description || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    // Example: create a FormData payload to send to API
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('description', sanitizedDescription);
    formData.append('file', values.file);

    // TODO: replace with real API call
    console.log('Uploading document payload', { title: values.title, description: sanitizedDescription, file: values.file });
  };

  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Document Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Proof of Delivery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Short description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) field.onChange(f);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 items-center">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Uploading…' : 'Upload'}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="text-sm text-muted-foreground">Recent documents will appear here.</div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default DocumentManagement;