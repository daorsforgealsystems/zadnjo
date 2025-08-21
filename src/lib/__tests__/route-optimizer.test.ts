import { describe, it, expect } from 'vitest';
import { generateRouteOptions, RouteInfo } from '../route-optimizer';

// Mock OSRM route data
const mockOSRMRoute = {
  distance: 100000, // 100km
  duration: 7200,   // 2 hours
  geometry: {
    coordinates: [
      [20.4633, 44.8176], // Belgrade (lng, lat)
      [21.0000, 45.0000], // Intermediate point
      [11.5820, 48.1351], // Munich (lng, lat)
    ],
  },
  legs: [
    {
      distance: 50000,
      duration: 3600,
      steps: [
        {
          distance: 25000,
          duration: 1800,
          name: 'Highway A1',
          maneuver: {
            location: [20.4633, 44.8176],
            type: 'depart',
          },
        },
      ],
    },
  ],
};

describe('Route Optimizer', () => {
  describe('generateRouteOptions', () => {
    let routeOptions: RouteInfo[];

    beforeEach(() => {
      routeOptions = generateRouteOptions(mockOSRMRoute);
    });

    describe('Happy path - route generation', () => {
      it('should generate exactly 4 route options', () => {
        expect(routeOptions).toHaveLength(4);
      });

      it('should generate routes with correct names', () => {
        const routeNames = routeOptions.map(route => route.name);
        expect(routeNames).toEqual([
          'Fastest',
          'Most Economical', 
          'Eco-Friendly',
          'Balanced'
        ]);
      });

      it('should convert OSRM coordinates to leaflet format correctly', () => {
        const fastestRoute = routeOptions[0];
        expect(fastestRoute.geometry).toEqual([
          [44.8176, 20.4633], // Converted to [lat, lng]
          [45.0000, 21.0000],
          [48.1351, 11.5820],
        ]);
      });

      it('should preserve original route data for fastest option', () => {
        const fastestRoute = routeOptions[0];
        expect(fastestRoute.distance).toBe(100000);
        expect(fastestRoute.duration).toBe(7200);
      });
    });

    describe('Route characteristics validation', () => {
      it('should have fastest route with shortest duration', () => {
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        const otherRoutes = routeOptions.filter(r => r.name !== 'Fastest');
        
        otherRoutes.forEach(route => {
          expect(fastestRoute.duration).toBeLessThanOrEqual(route.duration);
        });
      });

      it('should have economical route with lowest cost', () => {
        const economicalRoute = routeOptions.find(r => r.name === 'Most Economical')!;
        const otherRoutes = routeOptions.filter(r => r.name !== 'Most Economical');
        
        otherRoutes.forEach(route => {
          expect(economicalRoute.cost).toBeLessThan(route.cost);
        });
      });

      it('should have eco-friendly route with lowest carbon emissions', () => {
        const ecoRoute = routeOptions.find(r => r.name === 'Eco-Friendly')!;
        const otherRoutes = routeOptions.filter(r => r.name !== 'Eco-Friendly');
        
        otherRoutes.forEach(route => {
          expect(ecoRoute.carbonEmissions).toBeLessThan(route.carbonEmissions);
        });
      });

      it('should have economical route with lowest tolls', () => {
        const economicalRoute = routeOptions.find(r => r.name === 'Most Economical')!;
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        
        expect(economicalRoute.tolls).toBeLessThan(fastestRoute.tolls);
      });
    });

    describe('Route data validation', () => {
      it('should have all routes with positive distance', () => {
        routeOptions.forEach(route => {
          expect(route.distance).toBeGreaterThan(0);
        });
      });

      it('should have all routes with positive duration', () => {
        routeOptions.forEach(route => {
          expect(route.duration).toBeGreaterThan(0);
        });
      });

      it('should have all routes with non-negative costs', () => {
        routeOptions.forEach(route => {
          expect(route.cost).toBeGreaterThanOrEqual(0);
        });
      });

      it('should have all routes with non-negative carbon emissions', () => {
        routeOptions.forEach(route => {
          expect(route.carbonEmissions).toBeGreaterThanOrEqual(0);
        });
      });

      it('should have all routes with non-negative tolls', () => {
        routeOptions.forEach(route => {
          expect(route.tolls).toBeGreaterThanOrEqual(0);
        });
      });

      it('should have all routes with valid difficulty levels', () => {
        const validDifficulties = ['easy', 'moderate', 'challenging'];
        routeOptions.forEach(route => {
          expect(validDifficulties).toContain(route.difficulty);
        });
      });
    });

    describe('Route-specific characteristics', () => {
      it('should have fastest route with highway road types', () => {
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        expect(fastestRoute.roadTypes).toContain('Highway');
        expect(fastestRoute.roadTypes).toContain('Expressway');
        expect(fastestRoute.difficulty).toBe('easy');
      });

      it('should have economical route with local roads', () => {
        const economicalRoute = routeOptions.find(r => r.name === 'Most Economical')!;
        expect(economicalRoute.roadTypes).toContain('Local Roads');
        expect(economicalRoute.roadTypes).toContain('Secondary Highways');
        expect(economicalRoute.difficulty).toBe('moderate');
      });

      it('should have eco-friendly route with scenic elements', () => {
        const ecoRoute = routeOptions.find(r => r.name === 'Eco-Friendly')!;
        expect(ecoRoute.roadTypes).toContain('Highway');
        expect(ecoRoute.roadTypes).toContain('Scenic Routes');
        expect(ecoRoute.difficulty).toBe('easy');
      });

      it('should have balanced route with mixed road types', () => {
        const balancedRoute = routeOptions.find(r => r.name === 'Balanced')!;
        expect(balancedRoute.roadTypes).toContain('Highway');
        expect(balancedRoute.roadTypes).toContain('Primary Roads');
        expect(balancedRoute.difficulty).toBe('moderate');
      });
    });

    describe('Infrastructure calculations', () => {
      it('should calculate rest stops based on distance', () => {
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        const expectedRestStops = Math.floor(100000 / 200000); // One stop every 200km
        expect(fastestRoute.restStops).toBe(expectedRestStops);
      });

      it('should calculate fuel stations based on distance', () => {
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        const expectedFuelStations = Math.floor(100000 / 100000); // One station every 100km
        expect(fastestRoute.fuelStations).toBe(expectedFuelStations);
      });

      it('should have more infrastructure points on longer routes', () => {
        const economicalRoute = routeOptions.find(r => r.name === 'Most Economical')!;
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        
        expect(economicalRoute.restStops).toBeGreaterThanOrEqual(fastestRoute.restStops);
        expect(economicalRoute.fuelStations).toBeGreaterThanOrEqual(fastestRoute.fuelStations);
      });
    });

    describe('Route descriptions', () => {
      it('should have meaningful descriptions for each route type', () => {
        routeOptions.forEach(route => {
          expect(route.description).toBeTruthy();
          expect(route.description.length).toBeGreaterThan(20);
          expect(typeof route.description).toBe('string');
        });
      });

      it('should have route-specific keywords in descriptions', () => {
        const fastestRoute = routeOptions.find(r => r.name === 'Fastest')!;
        expect(fastestRoute.description.toLowerCase()).toContain('speed');
        
        const economicalRoute = routeOptions.find(r => r.name === 'Most Economical')!;
        expect(economicalRoute.description.toLowerCase()).toContain('cost');
        
        const ecoRoute = routeOptions.find(r => r.name === 'Eco-Friendly')!;
        expect(ecoRoute.description.toLowerCase()).toContain('environmental');
        
        const balancedRoute = routeOptions.find(r => r.name === 'Balanced')!;
        expect(balancedRoute.description.toLowerCase()).toContain('balanced');
      });
    });
  });

  describe('Edge cases and input validation', () => {
    it('should handle minimum distance route', () => {
      const minRoute = {
        ...mockOSRMRoute,
        distance: 1000, // 1km
        duration: 60,   // 1 minute
      };
      
      const options = generateRouteOptions(minRoute);
      expect(options).toHaveLength(4);
      
      options.forEach(option => {
        expect(option.distance).toBeGreaterThan(0);
        expect(option.duration).toBeGreaterThan(0);
        expect(option.cost).toBeGreaterThan(0);
        expect(option.restStops).toBeGreaterThanOrEqual(0);
        expect(option.fuelStations).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle very long distance route', () => {
      const longRoute = {
        ...mockOSRMRoute,
        distance: 1000000, // 1000km
        duration: 36000,   // 10 hours
      };
      
      const options = generateRouteOptions(longRoute);
      expect(options).toHaveLength(4);
      
      const fastestRoute = options.find(r => r.name === 'Fastest')!;
      expect(fastestRoute.restStops).toBe(5); // 1000km / 200km = 5 stops
      expect(fastestRoute.fuelStations).toBe(10); // 1000km / 100km = 10 stations
    });

    it('should handle route with minimal coordinates', () => {
      const minimalRoute = {
        ...mockOSRMRoute,
        geometry: {
          coordinates: [
            [20.4633, 44.8176], // Start
            [11.5820, 48.1351], // End
          ],
        },
      };
      
      const options = generateRouteOptions(minimalRoute);
      expect(options).toHaveLength(4);
      
      options.forEach(option => {
        expect(option.geometry).toHaveLength(2);
        expect(option.geometry[0]).toEqual([44.8176, 20.4633]);
        expect(option.geometry[1]).toEqual([48.1351, 11.5820]);
      });
    });

    it('should handle route with many coordinates', () => {
      const coordinates = [];
      for (let i = 0; i < 100; i++) {
        coordinates.push([20 + i * 0.1, 44 + i * 0.05]);
      }
      
      const complexRoute = {
        ...mockOSRMRoute,
        geometry: { coordinates },
      };
      
      const options = generateRouteOptions(complexRoute);
      expect(options).toHaveLength(4);
      
      options.forEach(option => {
        expect(option.geometry).toHaveLength(100);
      });
    });

    it('should ensure economical route is actually longer than fastest', () => {
      const options = generateRouteOptions(mockOSRMRoute);
      const fastestRoute = options.find(r => r.name === 'Fastest')!;
      const economicalRoute = options.find(r => r.name === 'Most Economical')!;
      
      expect(economicalRoute.distance).toBeGreaterThan(fastestRoute.distance);
      expect(economicalRoute.duration).toBeGreaterThan(fastestRoute.duration);
    });

    it('should ensure route modifications stay within reasonable bounds', () => {
      const options = generateRouteOptions(mockOSRMRoute);
      const originalDistance = mockOSRMRoute.distance;
      const originalDuration = mockOSRMRoute.duration;
      
      options.forEach(option => {
        // Distance shouldn't increase by more than 30%
        expect(option.distance).toBeLessThanOrEqual(originalDistance * 1.3);
        // Duration shouldn't increase by more than 50% 
        expect(option.duration).toBeLessThanOrEqual(originalDuration * 1.5);
        // Should never be less than original
        expect(option.distance).toBeGreaterThanOrEqual(originalDistance * 0.95);
        expect(option.duration).toBeGreaterThanOrEqual(originalDuration * 0.95);
      });
    });

    it('should handle zero-distance edge case gracefully', () => {
      const zeroRoute = {
        ...mockOSRMRoute,
        distance: 0,
        duration: 0,
      };
      
      const options = generateRouteOptions(zeroRoute);
      expect(options).toHaveLength(4);
      
      options.forEach(option => {
        expect(option.cost).toBeGreaterThanOrEqual(0);
        expect(option.carbonEmissions).toBeGreaterThanOrEqual(0);
        expect(option.tolls).toBeGreaterThanOrEqual(0);
        expect(option.restStops).toBe(0);
        expect(option.fuelStations).toBe(0);
      });
    });
  });

  describe('Cost calculation validation', () => {
    it('should have reasonable cost ranges', () => {
      const options = generateRouteOptions(mockOSRMRoute);
      const distanceInKm = 100; // 100km route
      
      options.forEach(option => {
        // For 100km route, cost should be between reasonable bounds
        expect(option.cost).toBeGreaterThan(50);  // Minimum reasonable cost
        expect(option.cost).toBeLessThan(500);    // Maximum reasonable cost
      });
    });

    it('should calculate carbon emissions appropriately', () => {
      const options = generateRouteOptions(mockOSRMRoute);
      const distanceInKm = 100;
      
      options.forEach(option => {
        // Carbon emissions should be reasonable for truck transport
        expect(option.carbonEmissions).toBeGreaterThan(15); // Minimum ~0.15 kg/km * 100km
        expect(option.carbonEmissions).toBeLessThan(35);    // Maximum ~0.35 kg/km * 100km
      });
    });
  });
});