import { Vehicle } from '@/components/MapView';

export interface Route {
  id: string;
  path: [number, number][];
  driver: string;
}

interface VehicleWithSimulationState extends Vehicle {
  _route: [number, number][];
  _pathIndex: number;
  _step: number;
}

// Define some mock routes across the Balkans
const routes: Route[] = [
  {
    id: 'ROUTE-01',
    driver: 'Miloš P.',
    path: [
      [44.7866, 20.4489], // Belgrade
      [45.1094, 19.1122], // Batrovci Border
      [45.2671, 19.8335], // Novi Sad
      [44.8184, 16.8836], // Banja Luka
      [43.8563, 18.4131], // Sarajevo
    ],
  },
  {
    id: 'ROUTE-02',
    driver: 'Ana K.',
    path: [
      [45.8150, 15.9819], // Zagreb
      [46.0569, 14.5058], // Ljubljana
      [45.5462, 13.7295], // Koper
    ],
  },
  {
    id: 'ROUTE-03',
    driver: 'Stefan V.',
    path: [
      [41.9981, 21.4254], // Skopje
      [41.3275, 19.8187], // Tirana
      [40.7128, 19.5615], // Durres
    ],
  },
];

// Initialize vehicles based on routes
let vehicles: VehicleWithSimulationState[] = routes.map(route => ({
  id: route.id,
  position: route.path[0],
  driver: route.driver,
  status: 'On Time',
  // Internal simulation state
  _route: route.path,
  _pathIndex: 0,
  _step: 0,
}));

const SIMULATION_SPEED = 0.05; // Controls how fast vehicles move along the path

// Function to update vehicle positions
const updateVehiclePositions = () => {
  vehicles = vehicles.map(v => {
    const { _route, _pathIndex, _step } = v;

    if (_pathIndex >= _route.length - 1) {
      // Vehicle has reached the end of its route
      return { ...v, status: 'Finished' };
    }

    const startPoint = _route[_pathIndex];
    const endPoint = _route[_pathIndex + 1];

    const latDiff = endPoint[0] - startPoint[0];
    const lngDiff = endPoint[1] - startPoint[1];

    const newStep = _step + SIMULATION_SPEED;

    if (newStep >= 1) {
      // Move to the next segment of the route
      return {
        ...v,
        position: endPoint,
        _pathIndex: _pathIndex + 1,
        _step: 0,
      };
    } else {
      // Interpolate position along the current segment
      const newLat = startPoint[0] + latDiff * newStep;
      const newLng = startPoint[1] + lngDiff * newStep;
      return {
        ...v,
        position: [newLat, newLng],
        _step: newStep,
      };
    }
  });
};

let simulationInterval: NodeJS.Timeout | null = null;

export const startGpsSimulation = (callback: (vehicles: Vehicle[]) => void) => {
  if (simulationInterval) return;
  simulationInterval = setInterval(() => {
    updateVehiclePositions();
    callback(getVehicles());
  }, 1000); // Update every second
};

export const stopGpsSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};

export const getVehicles = (): Vehicle[] => {
  // Return a clean version of the vehicle objects without internal state
  return vehicles.map(({ _route, _pathIndex, _step, ...rest }) => rest);
};

export const getRoutes = (): { id: string; path: [number, number][] }[] => {
  return routes.map(({ id, path }) => ({ id, path }));
};
