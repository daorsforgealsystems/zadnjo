import { LatLngExpression } from 'leaflet';

export interface RouteInfo {
  name: string;
  distance: number; // in meters
  duration: number; // in seconds
  geometry: LatLngExpression[];
  cost: number;
  carbonEmissions: number; // in kg
  tolls: number;
  roadTypes: string[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  borderCrossings: number;
  restStops: number;
  fuelStations: number;
  description: string;
}

interface OSRMRouteStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    location: number[];
    type: string;
  };
}

interface OSRMRouteLeg {
  distance: number;
  duration: number;
  steps: OSRMRouteStep[];
}

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: number[][];
  };
  legs?: OSRMRouteLeg[];
}

// Enhanced route generation with more realistic options
export const generateRouteOptions = (osrmRoute: OSRMRoute): RouteInfo[] => {
  const { distance, duration, geometry } = osrmRoute;
  const coordinates = geometry.coordinates.map((c: number[]) => [c[1], c[0]] as LatLngExpression);

  const options: RouteInfo[] = [];

  // Option 1: Fastest route
  options.push({
    name: 'Fastest',
    distance,
    duration,
    geometry: coordinates,
    cost: calculateCost(distance, duration, 'fastest'),
    carbonEmissions: calculateCarbonEmissions(distance, 'fastest'),
    tolls: calculateTolls(distance, 'highway'),
    roadTypes: ['Highway', 'Expressway'],
    difficulty: 'easy',
    borderCrossings: 1,
    restStops: Math.floor(distance / 200000), // One stop every 200km
    fuelStations: Math.floor(distance / 100000), // One station every 100km
    description: 'Optimized for speed with minimal stops. Uses major highways and expressways.'
  });

  // Option 2: Cheapest route
  const cheapestDistance = distance * 1.15; // Longer route to avoid tolls
  const cheapestDuration = duration * 1.3; // Slower due to local roads
  options.push({
    name: 'Most Economical',
    distance: cheapestDistance,
    duration: cheapestDuration,
    geometry: generateAlternativeRoute(coordinates, 'avoid_tolls'),
    cost: calculateCost(cheapestDistance, cheapestDuration, 'cheapest'),
    carbonEmissions: calculateCarbonEmissions(cheapestDistance, 'cheapest'),
    tolls: calculateTolls(cheapestDistance, 'local'),
    roadTypes: ['Local Roads', 'Secondary Highways'],
    difficulty: 'moderate',
    borderCrossings: 2,
    restStops: Math.floor(cheapestDistance / 150000), // More stops on longer route
    fuelStations: Math.floor(cheapestDistance / 75000), // More stations on local roads
    description: 'Minimizes costs by avoiding tolls and using local roads. Longer travel time.'
  });

  // Option 3: Eco-friendly route
  const ecoDistance = distance * 1.05;
  const ecoDuration = duration * 1.2;
  options.push({
    name: 'Eco-Friendly',
    distance: ecoDistance,
    duration: ecoDuration,
    geometry: generateAlternativeRoute(coordinates, 'eco'),
    cost: calculateCost(ecoDistance, ecoDuration, 'eco'),
    carbonEmissions: calculateCarbonEmissions(ecoDistance, 'eco'),
    tolls: calculateTolls(ecoDistance, 'mixed'),
    roadTypes: ['Highway', 'Scenic Routes'],
    difficulty: 'easy',
    borderCrossings: 1,
    restStops: Math.floor(ecoDistance / 180000),
    fuelStations: Math.floor(ecoDistance / 90000),
    description: 'Reduces environmental impact with optimized speed and efficient routing.'
  });

  // Option 4: Balanced route
  const balancedDistance = distance * 1.08;
  const balancedDuration = duration * 1.15;
  options.push({
    name: 'Balanced',
    distance: balancedDistance,
    duration: balancedDuration,
    geometry: generateAlternativeRoute(coordinates, 'balanced'),
    cost: calculateCost(balancedDistance, balancedDuration, 'balanced'),
    carbonEmissions: calculateCarbonEmissions(balancedDistance, 'balanced'),
    tolls: calculateTolls(balancedDistance, 'mixed'),
    roadTypes: ['Highway', 'Primary Roads'],
    difficulty: 'moderate',
    borderCrossings: 1,
    restStops: Math.floor(balancedDistance / 170000),
    fuelStations: Math.floor(balancedDistance / 85000),
    description: 'Balanced approach considering time, cost, and environmental factors.'
  });

  return options;
};

// Generate alternative routes by slightly modifying the original path
const generateAlternativeRoute = (originalPath: LatLngExpression[], type: string): LatLngExpression[] => {
  // In a real implementation, this would use a routing engine to find actual alternative routes
  // For now, we'll create a variation by slightly offsetting some points
  return originalPath.map((point, index) => {
    if (index % 5 === 0 && index !== 0 && index !== originalPath.length - 1) {
      // Slightly offset every 5th point to create a variation
      const [lat, lng] = point as [number, number];
      const offset = type === 'avoid_tolls' ? 0.02 : type === 'eco' ? 0.01 : 0.015;
      return [lat + (Math.random() - 0.5) * offset, lng + (Math.random() - 0.5) * offset] as LatLngExpression;
    }
    return point;
  });
};

const calculateCost = (distance: number, duration: number, type: 'fastest' | 'cheapest' | 'eco' | 'balanced'): number => {
  // More sophisticated cost calculation
  const distanceInKm = distance / 1000;
  const durationInHours = duration / 3600;

  // Base costs
  let fuelCostPerKm = 0.12; // €0.12 per km
  let driverCostPerHour = 25; // €25 per hour
  const vehicleCostPerHour = 15; // €15 per hour (depreciation, maintenance)
  let tollCostPerKm = 0.05; // €0.05 per km on average

  // Adjust based on route type
  switch (type) {
    case 'fastest':
      fuelCostPerKm *= 1.1; // Higher speed = more fuel consumption
      tollCostPerKm *= 1.2; // More highways = more tolls
      break;
    case 'cheapest':
      fuelCostPerKm *= 0.9; // Slower speeds = less fuel consumption
      tollCostPerKm *= 0.2; // Avoiding tolls
      driverCostPerHour *= 1.2; // Longer time = more driver cost
      break;
    case 'eco':
      fuelCostPerKm *= 0.95; // Optimized speed for efficiency
      tollCostPerKm *= 0.8; // Some tolls for better roads
      break;
    case 'balanced':
      fuelCostPerKm *= 1.02;
      tollCostPerKm *= 0.9;
      break;
  }

  const fuelCost = distanceInKm * fuelCostPerKm;
  const timeCost = durationInHours * (driverCostPerHour + vehicleCostPerHour);
  const tollCost = distanceInKm * tollCostPerKm;

  return fuelCost + timeCost + tollCost;
};

const calculateCarbonEmissions = (distance: number, type: 'fastest' | 'cheapest' | 'eco' | 'balanced'): number => {
  // More detailed carbon emission calculation
  const distanceInKm = distance / 1000;
  let emissionsPerKm = 0.22; // kg of CO2 per km for average truck

  // Adjust based on route type
  switch (type) {
    case 'fastest':
      emissionsPerKm *= 1.15; // Higher speeds = more emissions
      break;
    case 'cheapest':
      emissionsPerKm *= 1.05; // Local roads = slightly more emissions
      break;
    case 'eco':
      emissionsPerKm *= 0.85; // Optimized for efficiency
      break;
    case 'balanced':
      emissionsPerKm *= 1.0;
      break;
  }

  return distanceInKm * emissionsPerKm;
};

const calculateTolls = (distance: number, roadType: 'highway' | 'local' | 'mixed'): number => {
  const distanceInKm = distance / 1000;
  switch (roadType) {
    case 'highway':
      return distanceInKm * 0.15; // €0.15 per km on highways
    case 'local':
      return distanceInKm * 0.02; // €0.02 per km on local roads
    case 'mixed':
      return distanceInKm * 0.08; // €0.08 per km on mixed roads
    default:
      return distanceInKm * 0.08;
  }
};
