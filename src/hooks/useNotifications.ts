// React Query hooks for NotifyAPI (gateway)
// - List and create notifications

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotifyAPI, type NotificationDto } from '@/lib/api/gateway';

const qk = {
  list: ['notifications'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: qk.list,
    queryFn: async () => {
      const res = await NotifyAPI.list();
      return res.data as NotificationDto[];
    },
    staleTime: 30_000,
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<NotificationDto>) => NotifyAPI.create(payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.list });
    },
  });
}