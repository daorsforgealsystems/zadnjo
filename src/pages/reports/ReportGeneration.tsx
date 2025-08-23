import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DOMPurify from 'dompurify';

const reportSchema = z
  .object({
    reportType: z.enum(['kpi', 'finance', 'routes'] as const),
    format: z.enum(['pdf', 'csv', 'xlsx'] as const),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    filter: z.string().max(200, 'Filter is too long').optional().transform((v) => (v == null ? '' : v.trim())),
  })
  .refine((v) => new Date(v.fromDate) <= new Date(v.toDate), {
    path: ['toDate'],
    message: 'To date must be after From date',
  });

type ReportFormValues = z.infer<typeof reportSchema>;

const ReportGeneration: React.FC = () => {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: { reportType: 'kpi', format: 'pdf', fromDate: '', toDate: '', filter: '' },
  });

  const onSubmit: SubmitHandler<ReportFormValues> = (values) => {
    const safeFilter = DOMPurify.sanitize(values.filter || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    // TODO: Replace with real generation call
    console.log('Generate report', { ...values, filter: safeFilter });
  };

  return (
    <ResponsiveLayout>
      <div className="p-6 space-y-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Report Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kpi">KPI Summary</SelectItem>
                            <SelectItem value="finance">Financial</SelectItem>
                            <SelectItem value="routes">Routes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="PDF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="xlsx">Excel</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Filter (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Search term, tag…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Generating…' : 'Generate'}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default ReportGeneration;