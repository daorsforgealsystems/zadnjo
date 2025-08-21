import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRouteOptions, type RouteInfo } from '../route-optimizer';

describe('Route Optimizer', () => {
  let mockOSRMRoute: any;

  beforeEach(() => {
    mockOSRMRoute = {
      distance: 500000, // 500km
      duration: 18000, // 5 hours
      geometry: {
        coordinates: [
          [20.4633, 44.8176], // Belgrade
          [19.8335, 45.2671], // Novi Sad  
          [11.5820, 48.1351], // Munich
        ]
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Route Generation', () => {
    it('should generate exactly 4 route options', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      expect(routes).toHaveLength(4);
      expect(routes[0].name).toBe('Fastest');
      expect(routes[1].name).toBe('Most Economical');
      expect(routes[2].name).toBe('Eco-Friendly');
      expect(routes[3].name).toBe('Balanced');
    });

    it('should preserve original distance and duration for fastest route', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const fastestRoute = routes[0];
      
      expect(fastestRoute.distance).toBe(500000);
      expect(fastestRoute.duration).toBe(18000);
    });

    it('should increase distance and duration for alternative routes', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const [fastest, economical, eco, balanced] = routes;
      
      // Most Economical should be longer
      expect(economical.distance).toBeGreaterThan(fastest.distance);
      expect(economical.duration).toBeGreaterThan(fastest.duration);
      
      // Eco-Friendly should be slightly longer
      expect(eco.distance).toBeGreaterThan(fastest.distance);
      expect(eco.duration).toBeGreaterThan(fastest.duration);
      
      // Balanced should be between fastest and most economical
      expect(balanced.distance).toBeGreaterThan(fastest.distance);
      expect(balanced.duration).toBeGreaterThan(fastest.duration);
      expect(balanced.distance).toBeLessThan(economical.distance);
    });

    it('should convert coordinates from [lng, lat] to [lat, lng]', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const geometry = routes[0].geometry;
      
      // First coordinate should be Belgrade [lat, lng]
      expect(geometry[0]).toEqual([44.8176, 20.4633]);
      // Last coordinate should be Munich [lat, lng]
      expect(geometry[geometry.length - 1]).toEqual([48.1351, 11.5820]);
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate different costs for different route types', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const [fastest, economical, eco, balanced] = routes;
      
      // Most Economical should have lowest cost despite longer duration
      expect(economical.cost).toBeLessThan(fastest.cost);
      
      // Costs should be positive numbers
      routes.forEach(route => {
        expect(route.cost).toBeGreaterThan(0);
        expect(typeof route.cost).toBe('number');
      });
    });

    it('should include fuel, driver, vehicle, and toll costs', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      // All routes should have reasonable cost values (not zero)
      routes.forEach(route => {
        expect(route.cost).toBeGreaterThan(100); // Should be substantial for 500km
        expect(route.cost).toBeLessThan(5000); // Should be reasonable
      });
    });

    it('should have highest tolls for fastest route', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const [fastest, economical] = routes;
      
      expect(fastest.tolls).toBeGreaterThan(economical.tolls);
    });
  });

  describe('Carbon Emissions', () => {
    it('should calculate carbon emissions for all routes', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        expect(route.carbonEmissions).toBeGreaterThan(0);
        expect(typeof route.carbonEmissions).toBe('number');
      });
    });

    it('should have lowest emissions for eco-friendly route', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const [fastest, , eco] = routes;
      
      expect(eco.carbonEmissions).toBeLessThan(fastest.carbonEmissions);
    });

    it('should have reasonable emission values per kilometer', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        const emissionsPerKm = route.carbonEmissions / (route.distance / 1000);
        expect(emissionsPerKm).toBeGreaterThan(0.1); // At least 0.1 kg/km
        expect(emissionsPerKm).toBeLessThan(0.5); // Less than 0.5 kg/km
      });
    });
  });

  describe('Route Characteristics', () => {
    it('should assign appropriate difficulty levels', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      expect(routes[0].difficulty).toBe('easy'); // Fastest
      expect(routes[1].difficulty).toBe('moderate'); // Most Economical
      expect(routes[2].difficulty).toBe('easy'); // Eco-Friendly
      expect(routes[3].difficulty).toBe('moderate'); // Balanced
    });

    it('should assign appropriate road types', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      expect(routes[0].roadTypes).toContain('Highway');
      expect(routes[1].roadTypes).toContain('Local Roads');
      expect(routes[2].roadTypes).toContain('Scenic Routes');
      expect(routes[3].roadTypes).toContain('Primary Roads');
    });

    it('should calculate rest stops based on distance', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        const expectedStops = Math.floor(route.distance / 200000); // Base expectation
        expect(route.restStops).toBeGreaterThanOrEqual(0);
        expect(typeof route.restStops).toBe('number');
      });
    });

    it('should calculate fuel stations based on distance', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        expect(route.fuelStations).toBeGreaterThanOrEqual(0);
        expect(typeof route.fuelStations).toBe('number');
        expect(route.fuelStations).toBeGreaterThanOrEqual(route.restStops);
      });
    });
  });

  describe('Route Descriptions', () => {
    it('should provide meaningful descriptions for each route', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        expect(route.description).toBeDefined();
        expect(route.description.length).toBeGreaterThan(20);
        expect(typeof route.description).toBe('string');
      });
    });

    it('should have unique descriptions for each route type', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      const descriptions = routes.map(r => r.description);
      const uniqueDescriptions = new Set(descriptions);
      
      expect(uniqueDescriptions.size).toBe(4);
    });
  });

  describe('Border Crossings', () => {
    it('should set appropriate border crossings for different routes', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        expect(route.borderCrossings).toBeGreaterThanOrEqual(1);
        expect(route.borderCrossings).toBeLessThanOrEqual(3);
        expect(Number.isInteger(route.borderCrossings)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short distances', () => {
      const shortRoute = {
        ...mockOSRMRoute,
        distance: 10000, // 10km
        duration: 600 // 10 minutes
      };
      
      const routes = generateRouteOptions(shortRoute);
      
      expect(routes).toHaveLength(4);
      routes.forEach(route => {
        expect(route.cost).toBeGreaterThan(0);
        expect(route.carbonEmissions).toBeGreaterThan(0);
        expect(route.restStops).toBeGreaterThanOrEqual(0);
        expect(route.fuelStations).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle very long distances', () => {
      const longRoute = {
        ...mockOSRMRoute,
        distance: 2000000, // 2000km
        duration: 72000 // 20 hours
      };
      
      const routes = generateRouteOptions(longRoute);
      
      expect(routes).toHaveLength(4);
      routes.forEach(route => {
        expect(route.restStops).toBeGreaterThan(5);
        expect(route.fuelStations).toBeGreaterThan(10);
        expect(route.cost).toBeGreaterThan(1000);
      });
    });

    it('should handle empty geometry', () => {
      const emptyGeometryRoute = {
        ...mockOSRMRoute,
        geometry: { coordinates: [] }
      };
      
      expect(() => generateRouteOptions(emptyGeometryRoute)).not.toThrow();
    });

    it('should handle single point geometry', () => {
      const singlePointRoute = {
        ...mockOSRMRoute,
        geometry: { coordinates: [[20.4633, 44.8176]] }
      };
      
      const routes = generateRouteOptions(singlePointRoute);
      expect(routes[0].geometry).toEqual([[44.8176, 20.4633]]);
    });
  });

  describe('Route Option Ordering', () => {
    it('should return routes in consistent order', () => {
      const routes1 = generateRouteOptions(mockOSRMRoute);
      const routes2 = generateRouteOptions(mockOSRMRoute);
      
      expect(routes1[0].name).toBe(routes2[0].name);
      expect(routes1[1].name).toBe(routes2[1].name);
      expect(routes1[2].name).toBe(routes2[2].name);
      expect(routes1[3].name).toBe(routes2[3].name);
    });
  });

  describe('Data Integrity', () => {
    it('should ensure all route options have required properties', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        expect(route).toHaveProperty('name');
        expect(route).toHaveProperty('distance');
        expect(route).toHaveProperty('duration');
        expect(route).toHaveProperty('geometry');
        expect(route).toHaveProperty('cost');
        expect(route).toHaveProperty('carbonEmissions');
        expect(route).toHaveProperty('tolls');
        expect(route).toHaveProperty('roadTypes');
        expect(route).toHaveProperty('difficulty');
        expect(route).toHaveProperty('borderCrossings');
        expect(route).toHaveProperty('restStops');
        expect(route).toHaveProperty('fuelStations');
        expect(route).toHaveProperty('description');
      });
    });

    it('should maintain proper data types', () => {
      const routes = generateRouteOptions(mockOSRMRoute);
      
      routes.forEach(route => {
        expect(typeof route.name).toBe('string');
        expect(typeof route.distance).toBe('number');
        expect(typeof route.duration).toBe('number');
        expect(Array.isArray(route.geometry)).toBe(true);
        expect(typeof route.cost).toBe('number');
        expect(typeof route.carbonEmissions).toBe('number');
        expect(typeof route.tolls).toBe('number');
        expect(Array.isArray(route.roadTypes)).toBe(true);
        expect(['easy', 'moderate', 'challenging']).toContain(route.difficulty);
        expect(typeof route.borderCrossings).toBe('number');
        expect(typeof route.restStops).toBe('number');
        expect(typeof route.fuelStations).toBe('number');
        expect(typeof route.description).toBe('string');
      });
    });
  });
});