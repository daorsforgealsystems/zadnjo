import { LiveRoute, Anomaly, AnomalyType } from "./types";
import { v4 as uuidv4 } from 'uuid';

const UNSCHEDULED_STOP_THRESHOLD = 15 * 60 * 1000; // 15 minutes
const SPEED_LIMIT = 120; // km/h
const ROUTE_DEVIATION_THRESHOLD = 2000; // 2 kilometers in meters

// Helper function to calculate distance between two lat/lng points in meters
const haversineDistance = (
    coords1: { lat: number; lng: number },
    coords2: { lat: number; lng: number }
): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};


export const detectAnomalies = (route: LiveRoute): Anomaly | null => {
    // Check for unscheduled stop
    const timeSinceLastMove = Date.now() - new Date(route.lastMoved).getTime();
    if (timeSinceLastMove > UNSCHEDULED_STOP_THRESHOLD) {
        const existingAnomaly = route.anomalies.find(a => a.type === "UNSCHEDULED_STOP");
        if (!existingAnomaly) {
            return {
                id: uuidv4(),
                type: "UNSCHEDULED_STOP",
                timestamp: new Date().toISOString(),
                severity: "medium",
                description: `Vehicle has been stationary for over ${Math.round(timeSinceLastMove / 60000)} minutes.`,
                vehicleId: route.id,
            };
        }
    }

    // Check for speeding
    if (route.speed > SPEED_LIMIT) {
        const existingAnomaly = route.anomalies.find(a => a.type === "SPEED_ANOMALY");
        if (!existingAnomaly) {
            return {
                id: uuidv4(),
                type: "SPEED_ANOMALY",
                timestamp: new Date().toISOString(),
                severity: "low",
                description: `Vehicle is traveling at ${route.speed} km/h, exceeding the limit of ${SPEED_LIMIT} km/h.`,
                vehicleId: route.id,
            };
        }
    }

    // Check for route deviation
    if (route.plannedRoute && route.plannedRoute.length > 0) {
        // For simplicity, we check the distance to the nearest point on the planned route.
        // A more robust solution would check the distance to the route line segment.
        const nearestPointDistance = Math.min(
            ...route.plannedRoute.map(point => haversineDistance(route.currentPosition, point))
        );

        if (nearestPointDistance > ROUTE_DEVIATION_THRESHOLD) {
            const existingAnomaly = route.anomalies.find(a => a.type === "ROUTE_DEVIATION");
            if (!existingAnomaly) {
                return {
                    id: uuidv4(),
                    type: "ROUTE_DEVIATION",
                    timestamp: new Date().toISOString(),
                    severity: "high",
                    description: `Vehicle has deviated ${(nearestPointDistance / 1000).toFixed(1)} km from the planned route.`,
                    vehicleId: route.id,
                };
            }
        }
    }

    return null;
};
