// Helper to map Supabase / PostgREST errors to actionable guidance
export const isSupabaseTableMissingError = (err: any): { missingTable?: string } | null => {
  if (!err) return null;

  // PostgREST returns a code like 'PGRST205' when a table is missing from the schema cache
  if (err.code === 'PGRST205') {
    // Try to parse table name from message
    const msg = (err.message || err.error || '').toString();
    const m = msg.match(/table '(?:public\.)?([a-z0-9_]+)'/i);
    return { missingTable: m ? m[1] : undefined };
  }

  // Some network/404 responses may be shaped differently
  const message = (err?.message || err?.error || '').toString();
  if (/Could not find the table/i.test(message) || /schema cache/i.test(message)) {
    const m = message.match(/table '(?:public\.)?([a-z0-9_]+)'/i);
    return { missingTable: m ? m[1] : undefined };
  }

  return null;
};

export const MIGRATION_HINTS: Record<string, string> = {
  orders: 'Run `database/add-orders-table.sql` or apply `database/logicore-schema.sql` in your Supabase SQL editor',
  delivery_routes: 'Apply `database/logicore-schema.sql` (defines delivery_routes, vehicles, route_stops)',
  anomalies: 'Apply `database/add-frontend-tables-to-logicore.sql` (defines anomalies, items, notifications)',
};
