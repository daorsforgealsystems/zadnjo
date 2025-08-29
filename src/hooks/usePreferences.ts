// React Query hooks for PreferencesAPI
// - Minimal, typed hooks
// - Keys are stable and scoped per user

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PreferencesAPI, type LayoutPreferences } from '@/lib/api/preferences-api';

// Query Keys
const qk = {
  layout: (userId: string) => ['preferences', 'layout', userId] as const,
};

// Fetch layout preferences
export function useLayoutPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? qk.layout(userId) : ['preferences', 'layout', 'disabled'],
    queryFn: () => {
      if (!userId) throw new Error('userId is required');
      return PreferencesAPI.getLayoutPreferences(userId);
    },
    enabled: Boolean(userId),
  });
}

// Update layout preferences
export function useUpdateLayoutPreferences(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<LayoutPreferences>) => {
      if (!userId) throw new Error('userId is required');
      return PreferencesAPI.updateLayoutPreferences(userId, patch);
    },
    onSuccess: (data) => {
      if (!userId) return;
      // Optimistically set cache to updated value
      qc.setQueryData(qk.layout(userId), data);
      // Ensure refetch for freshness
      qc.invalidateQueries({ queryKey: qk.layout(userId) });
    },
  });
}