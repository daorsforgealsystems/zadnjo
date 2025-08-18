import React, { useRef } from 'react';
import { exportToCSV, exportToJSON, DataExporter } from '@/lib/export-utils';

interface ExportUploadButtonsProps {
  data: unknown[];
  columns?: string[];
}

export const ExportUploadButtons: React.FC<ExportUploadButtonsProps> = ({ data, columns }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    exportToCSV(data, 'exported-data', columns);
  };

  const handleExportJSON = () => {
    exportToJSON(data, 'exported-data');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed;
        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV to array of objects (assumes first row is header)
          const [header, ...rows] = text.split('\n').map(r => r.trim()).filter(Boolean);
          const keys = header.split(',');
          parsed = rows.map(row => {
            const values = row.split(',');
            return Object.fromEntries(keys.map((k, i) => [k, values[i]]));
          });
        } else {
          throw new Error('Unsupported file type');
        }
        // You can now use `parsed` as uploaded data
        alert('File uploaded and parsed! Rows: ' + parsed.length);
      } catch (err) {
        alert('Failed to parse file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2">
      <button className="btn btn-primary" onClick={handleExportCSV}>Export CSV</button>
      <button className="btn btn-secondary" onClick={handleExportJSON}>Export JSON</button>
      <input
        type="file"
        accept=".csv,.json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <button className="btn btn-accent" onClick={() => fileInputRef.current?.click()}>Upload File</button>
    </div>
  );
};
