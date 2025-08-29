// React Query hooks for GeoAPI (gateway)
// - Vehicles list and per-vehicle positions

import { useQuery } from '@tanstack/react-query';
import { GeoAPI, type VehicleDto } from '@/lib/api/gateway';

// Local type for positions response data
export type VehicleTrackPoint = { lat: number; lng: number; ts: string };
export type VehiclePositions = { vehicleId: string; track: VehicleTrackPoint[] };

const qk = {
  vehicles: ['geo', 'vehicles'] as const,
  positions: (vehicleId: string) => ['geo', 'positions', vehicleId] as const,
};

export function useVehicles() {
  return useQuery({
    queryKey: qk.vehicles,
    queryFn: async () => {
      const res = await GeoAPI.vehicles();
      return res.data as VehicleDto[];
    },
    staleTime: 15_000, // 15s, geodata changes often
  });
}

export function useVehiclePositions(
  vehicleId: string | undefined,
  opts?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: vehicleId ? qk.positions(vehicleId) : ['geo', 'positions', 'disabled'],
    queryFn: async () => {
      if (!vehicleId) throw new Error('vehicleId is required');
      const res = await GeoAPI.positions(vehicleId);
      return res.data as VehiclePositions;
    },
    enabled: Boolean(vehicleId) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}// React Query hooks for GeoAPI (gateway)
// - Vehicles list and per-vehicle positions

import { useQuery } from '@tanstack/react-query';
import { GeoAPI, type VehicleDto } from '@/lib/api/gateway';

// Local type for positions response data
export type VehicleTrackPoint = { lat: number; lng: number; ts: string };
export type VehiclePositions = { vehicleId: string; track: VehicleTrackPoint[] };

const qk = {
  vehicles: ['geo', 'vehicles'] as const,
  positions: (vehicleId: string) => ['geo', 'positions', vehicleId] as const,
};

export function useVehicles() {
  return useQuery({
    queryKey: qk.vehicles,
    queryFn: async () => {
      const res = await GeoAPI.vehicles();
      return res.data as VehicleDto[];
    },
    staleTime: 15_000, // 15s, geodata changes often
  });
}

export function useVehiclePositions(
  vehicleId: string | undefined,
  opts?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: vehicleId ? qk.positions(vehicleId) : ['geo', 'positions', 'disabled'],
    queryFn: async () => {
      if (!vehicleId) throw new Error('vehicleId is required');
      const res = await GeoAPI.positions(vehicleId);
      return res.data as VehiclePositions;
    },
    enabled: Boolean(vehicleId) && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval,
  });
}