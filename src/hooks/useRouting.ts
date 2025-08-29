// React Query hooks for RoutingAPI (gateway)
// - Minimal, typed mutation for route optimization

import { useMutation } from '@tanstack/react-query';
import { RoutingAPI, type OptimizeRequest, type OptimizeResponse } from '@/lib/api/gateway';

export function useOptimizeRoute() {
  return useMutation<OptimizeResponse, Error, OptimizeRequest>({
    mutationFn: (payload) => RoutingAPI.optimize(payload).then(r => r.data),
  });
}