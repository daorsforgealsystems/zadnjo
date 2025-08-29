// React Query hooks for OrdersAPI (gateway)
// - Minimal, typed hooks
// - Keys are stable and scoped

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrdersAPI, type OrderDto } from '@/lib/api/gateway';

// Query Keys
const qk = {
  list: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
};

// List orders
export function useOrders() {
  return useQuery({
    queryKey: qk.list,
    queryFn: async () => {
      const res = await OrdersAPI.list();
      return res.data; // unwrap { success, data }
    },
    staleTime: 60_000, // 1 minute
  });
}

// Get single order
export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.detail(id) : ['orders', 'disabled'],
    queryFn: async () => {
      if (!id) throw new Error('order id is required');
      const res = await OrdersAPI.get(id);
      return res.data; // unwrap
    },
    enabled: Boolean(id),
  });
}

// Create order
export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<OrderDto>) => OrdersAPI.create(payload).then(r => r.data),
    onSuccess: (created) => {
      // Invalidate list and set detail cache
      qc.invalidateQueries({ queryKey: qk.list });
      if (created?.id) qc.setQueryData(qk.detail(created.id), created);
    },
  });
}

// Update order status
export function useUpdateOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => OrdersAPI.updateStatus(id, status).then(r => r.data),
    onSuccess: (updated) => {
      // Refresh list and detail
      qc.invalidateQueries({ queryKey: qk.list });
      if (updated?.id) qc.setQueryData(qk.detail(updated.id), updated);
    },
  });
}