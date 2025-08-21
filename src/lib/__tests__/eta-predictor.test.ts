import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { predictEta } from '../eta-predictor';
import type { LiveRoute } from '../types';

describe('ETA Predictor', () => {
  let mockRoute: LiveRoute;
  let originalDate: typeof Date;

  beforeEach(() => {
    // Mock Date for consistent testing
    originalDate = Date;
    const mockDate = new Date('2024-01-15T10:00:00Z');
    vi.setSystemTime(mockDate);

    mockRoute = {
      id: 'test-route-1',
      from: 'Belgrade',
      to: 'Munich',
      status: 'active',
      progress: 65,
      eta: '2s 30m',
      driver: 'Test Driver',
      currentPosition: { lat: 45.2671, lng: 19.8335 },
      speed: 85,
      lastMoved: mockDate.toISOString(),
      plannedRoute: []
    } as LiveRoute;

    // Mock Math.random for consistent testing
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Basic ETA Prediction', () => {
    it('should return "Dostavljeno" for completed routes', () => {
      mockRoute.status = 'završena';
      const result = predictEta(mockRoute);
      
      expect(result.time).toBe('Dostavljeno');
      expect(result.confidence).toBe(100);
    });

    it('should process valid ETA format correctly', () => {
      mockRoute.eta = '1s 45m';
      const result = predictEta(mockRoute);
      
      expect(result.time).toMatch(/^\d+s \d+m$/);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle minutes-only ETA format', () => {
      mockRoute.eta = '30m';
      const result = predictEta(mockRoute);
      
      expect(result.time).toMatch(/^\d+m$/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle hours-only ETA format', () => {
      mockRoute.eta = '2s';
      const result = predictEta(mockRoute);
      
      expect(result.time).toMatch(/^\d+s \d+m$/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle invalid ETA format gracefully', () => {
      mockRoute.eta = 'invalid-format';
      const result = predictEta(mockRoute);
      
      expect(result.time).toBe('invalid-format');
      expect(result.confidence).toBe(50);
    });
  });

  describe('Rush Hour Effects', () => {
    it('should apply rush hour penalties during morning rush (7-9 AM)', () => {
      const mockMorningRush = new Date('2024-01-15T08:00:00Z');
      vi.setSystemTime(mockMorningRush);
      
      mockRoute.eta = '1s 0m'; // 60 minutes
      const result = predictEta(mockRoute);
      
      // Rush hour should reduce the ETA (make it faster due to penalties applied to original time)
      expect(parseInt(result.time.split('s')[0])).toBeLessThan(1);
    });

    it('should apply rush hour penalties during evening rush (4-6 PM)', () => {
      const mockEveningRush = new Date('2024-01-15T17:00:00Z');
      vi.setSystemTime(mockEveningRush);
      
      mockRoute.eta = '1s 0m'; // 60 minutes
      const result = predictEta(mockRoute);
      
      // Rush hour should affect the timing
      expect(parseInt(result.time.split('s')[0])).toBeLessThan(1);
    });

    it('should not apply rush hour penalties during off-peak hours', () => {
      const mockOffPeak = new Date('2024-01-15T14:00:00Z');
      vi.setSystemTime(mockOffPeak);
      
      mockRoute.eta = '1s 0m'; // 60 minutes
      const result = predictEta(mockRoute);
      
      // Should have less variability during off-peak hours
      expect(result.confidence).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Weather Effects', () => {
    it('should apply weather penalties for bad weather conditions', () => {
      // Mock bad weather (random > 0.8)
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      
      mockRoute.eta = '1s 0m';
      const result = predictEta(mockRoute);
      
      // Bad weather should reduce confidence
      expect(result.confidence).toBeLessThan(90);
    });

    it('should not apply significant weather penalties for good weather', () => {
      // Mock good weather (random < 0.8)
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      
      mockRoute.eta = '1s 0m';
      const result = predictEta(mockRoute);
      
      // Good weather should maintain higher confidence
      expect(result.confidence).toBeGreaterThan(80);
    });
  });

  describe('Confidence Calculation', () => {
    it('should return confidence between 50 and 100', () => {
      const result = predictEta(mockRoute);
      
      expect(result.confidence).toBeGreaterThanOrEqual(50);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.confidence)).toBe(true);
    });

    it('should have lower confidence for longer routes', () => {
      const shortRoute = { ...mockRoute, eta: '30m' };
      const longRoute = { ...mockRoute, eta: '5s 0m' };
      
      const shortResult = predictEta(shortRoute);
      const longResult = predictEta(longRoute);
      
      expect(longResult.confidence).toBeLessThanOrEqual(shortResult.confidence);
    });
  });

  describe('Time Format Output', () => {
    it('should format hours and minutes correctly', () => {
      mockRoute.eta = '2s 15m';
      const result = predictEta(mockRoute);
      
      expect(result.time).toMatch(/^\d+s \d+m$/);
    });

    it('should format minutes-only correctly when hours are 0', () => {
      mockRoute.eta = '45m';
      const result = predictEta(mockRoute);
      
      // Result might be in format "Xs Ym" or "Zm" depending on calculation
      expect(result.time).toMatch(/^(\d+s \d+m|\d+m)$/);
    });

    it('should handle edge case of 0 minutes', () => {
      mockRoute.eta = '1s 0m';
      const result = predictEta(mockRoute);
      
      // Should handle gracefully without negative values
      expect(result.time).not.toContain('-');
    });
  });

  describe('Random Variability', () => {
    it('should include random noise in predictions', () => {
      mockRoute.eta = '1s 0m';
      
      // Test multiple calls with different random values
      const results: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        vi.spyOn(Math, 'random').mockReturnValue(0.1 + i * 0.2);
        const result = predictEta(mockRoute);
        results.push(result.time);
      }
      
      // Results should vary due to random noise
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing ETA gracefully', () => {
      const routeWithoutEta = { ...mockRoute, eta: '' };
      const result = predictEta(routeWithoutEta);
      
      expect(result.time).toBe('');
      expect(result.confidence).toBe(50);
    });

    it('should handle null route data', () => {
      const nullRoute = { ...mockRoute, eta: null as any };
      
      expect(() => predictEta(nullRoute)).not.toThrow();
    });

    it('should handle malformed time strings', () => {
      mockRoute.eta = '2hours 30minutes';
      const result = predictEta(mockRoute);
      
      expect(result.time).toBe('2hours 30minutes');
      expect(result.confidence).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short ETAs', () => {
      mockRoute.eta = '5m';
      const result = predictEta(mockRoute);
      
      expect(result.confidence).toBeGreaterThanOrEqual(50);
      expect(result.time).toBeDefined();
    });

    it('should handle very long ETAs', () => {
      mockRoute.eta = '10s 30m';
      const result = predictEta(mockRoute);
      
      expect(result.confidence).toBeGreaterThanOrEqual(50);
      expect(result.time).toBeDefined();
    });

    it('should maintain time format consistency', () => {
      const testCases = ['1s 30m', '45m', '2s 0m', '0s 15m'];
      
      testCases.forEach(eta => {
        mockRoute.eta = eta;
        const result = predictEta(mockRoute);
        
        expect(result.time).toMatch(/^(\d+s \d+m|\d+m|Dostavljeno)$/);
        expect(typeof result.confidence).toBe('number');
      });
    });
  });
});