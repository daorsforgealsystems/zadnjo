import { toast } from '@/lib/toast';

export type ExportFormat = 'csv' | 'json' | 'xlsx';

interface ExportOptions {
  filename?: string;
  format: ExportFormat;
  data: unknown[];
  columns?: string[];
}

export class DataExporter {
  static async exportData({ filename, format, data, columns }: ExportOptions): Promise<void> {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const defaultFilename = `export_${new Date().toISOString().split('T')[0]}`;
    const finalFilename = filename || defaultFilename;

    try {
      switch (format) {
        case 'csv':
          await this.exportCSV(data, finalFilename, columns);
          break;
        case 'json':
          await this.exportJSON(data, finalFilename);
          break;
        case 'xlsx':
          toast.error('XLSX export requires additional library installation');
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      toast.success(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  }

  private static async exportCSV(data: unknown[], filename: string, columns?: string[]): Promise<void> {
    const csvContent = this.convertToCSV(data, columns);
    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }

  private static async exportJSON(data: unknown[], filename: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }

  private static convertToCSV(data: unknown[], columns?: string[]): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const firstItem = data[0] as Record<string, unknown>;
    const headers = columns || Object.keys(firstItem);
    
    // Create CSV header
    const csvHeaders = headers.join(',');
    
    // Create CSV rows
    const csvRows = data.map(item => {
      const row = item as Record<string, unknown>;
      return headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value?.toString() || '';
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  // Utility method to prepare data for export
  static prepareDataForExport<T extends Record<string, unknown>>(
    data: T[],
    fieldMappings?: Record<keyof T, string>
  ): Record<string, unknown>[] {
    return data.map(item => {
      const exportItem: Record<string, unknown> = {};
      
      Object.keys(item).forEach(key => {
        const mappedKey = fieldMappings?.[key as keyof T] || key;
        let value = item[key];
        
        // Format dates
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0];
        }
        
        // Format objects/arrays
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        exportItem[mappedKey] = value;
      });
      
      return exportItem;
    });
  }
}

// Quick export functions
export const exportToCSV = (data: unknown[], filename?: string, columns?: string[]) => {
  return DataExporter.exportData({ data, format: 'csv', filename, columns });
};

export const exportToJSON = (data: unknown[], filename?: string) => {
  return DataExporter.exportData({ data, format: 'json', filename });
};