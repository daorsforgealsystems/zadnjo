import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DOMPurify from 'dompurify';

// Zod schema for client-side validation
const documentSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description is too long')
    .optional()
    .transform((val) => (val == null ? '' : val)),
  file: z
    .
    any()
    .refine((f) => f instanceof File, 'A file is required')
    .refine(
      (f: File) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(f.type),
      'Only PDF, DOCX, or TXT files are allowed'
    )
    .refine((f: File) => f.size <= 5 * 1024 * 1024, 'File must be 5MB or less'),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const DocumentManagement: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
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
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...register('title')} placeholder="e.g., Proof of Delivery" aria-invalid={!!errors.title} />
                {errors.title && <p className="text-xs text-red-500" role="alert">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input id="description" {...register('description')} placeholder="Short description" aria-invalid={!!errors.description} />
                {errors.description && <p className="text-xs text-red-500" role="alert">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setValue('file', f, { shouldValidate: true });
                  }}
                  aria-invalid={!!errors.file}
                />
                {errors.file && <p className="text-xs text-red-500" role="alert">{errors.file.message as string}</p>}
              </div>

              <div className="flex gap-2 items-center">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
            </form>

            <div className="text-sm text-muted-foreground">Recent documents will appear here.</div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default DocumentManagement;