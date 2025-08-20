import React from 'react';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DOMPurify from 'dompurify';

const reportSchema = z
  .object({
    reportType: z.enum(['kpi', 'finance', 'routes'], { required_error: 'Select a report type' }),
    format: z.enum(['pdf', 'csv', 'xlsx'], { required_error: 'Select a format' }),
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
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportSchema),
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
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Report Type</Label>
                  <Controller
                    name="reportType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kpi">KPI Summary</SelectItem>
                          <SelectItem value="finance">Financial</SelectItem>
                          <SelectItem value="routes">Routes</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.reportType && (
                    <p className="text-xs text-red-500" role="alert">{errors.reportType.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Format</Label>
                  <Controller
                    name="format"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="PDF" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.format && (
                    <p className="text-xs text-red-500" role="alert">{errors.format.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground" htmlFor="filter">Filter (optional)</Label>
                  <Input id="filter" placeholder="Search term, tag…" {...register('filter')} />
                  {errors.filter && <p className="text-xs text-red-500" role="alert">{errors.filter.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground" htmlFor="fromDate">From</Label>
                  <Input id="fromDate" type="date" {...register('fromDate')} aria-invalid={!!errors.fromDate} />
                  {errors.fromDate && <p className="text-xs text-red-500" role="alert">{errors.fromDate.message as string}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground" htmlFor="toDate">To</Label>
                  <Input id="toDate" type="date" {...register('toDate')} aria-invalid={!!errors.toDate} />
                  {errors.toDate && <p className="text-xs text-red-500" role="alert">{errors.toDate.message as string}</p>}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Generating…' : 'Generate'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default ReportGeneration;