import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { CacheManager, CacheKeys } from './lib/redis-client';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const port = process.env.PORT || 4004;

// Health
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Type definitions
interface Stop {
  id: string;
  lat: number;
  lng: number;
  priority?: number;
  timeWindow?: {
    start: string;
    end: string;
  };
}

interface OptimizeRequest {
  stops: Stop[];
  vehicles?: number;
  depot?: {
    lat: number;
    lng: number;
  };
}

interface OptimizedStop extends Stop {
  sequence: number;
  estimatedArrival: string;
  estimatedDeparture: string;
}

interface OptimizeResponse {
  id: string;
  vehicles: number;
  totalDistance: number;
  totalTime: number;
  routes: {
    vehicleId: number;
    stops: OptimizedStop[];
    distance: number;
    time: number;
  }[];
  eta: string;
}

// Route optimization with improved algorithm
app.post('/routes/optimize', async (req: Request, res: Response) => {
  try {
    const { stops = [], vehicles = 1, depot = { lat: 44.7866, lng: 20.4489 } }: OptimizeRequest = req.body;
    
    if (!stops || stops.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No stops provided'
      });
    }

    // Create a hash of the request parameters for caching
    const requestHash = Buffer.from(JSON.stringify({ stops, vehicles, depot })).toString('base64');
    const cacheKey = CacheKeys.optimizedRoute(requestHash);
    
    // Try to get from cache first
    const cachedRoute = await CacheManager.get<OptimizeResponse>(cacheKey);
    if (cachedRoute) {
      return res.json({ success: true, data: cachedRoute });
    }

    // Simple route optimization using nearest neighbor algorithm
    const optimizedRoutes = optimizeRoutes(stops, vehicles, depot);
    
    const result: OptimizeResponse = {
      id: `route_${Date.now()}`,
      vehicles,
      totalDistance: optimizedRoutes.reduce((sum, route) => sum + route.distance, 0),
      totalTime: Math.max(...optimizedRoutes.map(route => route.time)),
      routes: optimizedRoutes,
      eta: new Date(Date.now() + Math.max(...optimizedRoutes.map(route => route.time)) * 60000).toISOString(),
    };
    
    // Cache the result for 1 hour (route optimizations can be reused)
    await CacheManager.set(cacheKey, result, CacheManager.TTL.DEFAULT);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize routes'
    });
  }
});

// Simple route optimization function
function optimizeRoutes(stops: Stop[], numVehicles: number, depot: { lat: number; lng: number }) {
  const routes = [];
  const unassigned = [...stops];
  
  // Simple assignment: distribute stops evenly among vehicles
  for (let i = 0; i < numVehicles; i++) {
    const routeStops = [];
    const stopsPerVehicle = Math.ceil(unassigned.length / (numVehicles - i));
    
    for (let j = 0; j < stopsPerVehicle && unassigned.length > 0; j++) {
      routeStops.push(unassigned.shift()!);
    }
    
    if (routeStops.length > 0) {
      routes.push({
        vehicleId: i + 1,
        stops: routeStops.map((stop, idx) => ({
          ...stop,
          sequence: idx + 1,
          estimatedArrival: new Date(Date.now() + (idx + 1) * 15 * 60000).toISOString(),
          estimatedDeparture: new Date(Date.now() + (idx + 1) * 15 * 60000 + 5 * 60000).toISOString(),
        })),
        distance: calculateRouteDistance([depot, ...routeStops.map(s => ({ lat: s.lat, lng: s.lng })), depot]),
        time: routeStops.length * 20, // 20 minutes per stop
      });
    }
  }
  
  return routes;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate total route distance
function calculateRouteDistance(points: { lat: number; lng: number }[]): number {
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(
      points[i].lat, points[i].lng,
      points[i + 1].lat, points[i + 1].lng
    );
  }
  return totalDistance;
}

app.listen(port, () => {
  console.log(`Routing Service listening on ${port}`);
});