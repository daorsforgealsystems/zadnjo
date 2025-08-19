import React from 'react';
import { useAnimationContext } from '@/hooks/useAnimationContext';
import { AnimationIntensity } from '@/types/animations';

// Settings component for controlling animation preferences
export const AnimationSettings: React.FC = () => {
  const { intensity, setIntensity, reducedMotion, toggleReducedMotion } = useAnimationContext();

  return (
    <div className="animation-settings space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Animation Intensity</label>
        <div className="flex space-x-2">
          {(['low', 'medium', 'high'] as AnimationIntensity[]).map((level) => (
            <button
              key={level}
              onClick={() => setIntensity(level)}
              className={`px-3 py-1 rounded text-sm capitalize transition-colors ${
                intensity === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Reduced Motion</label>
        <button
          onClick={toggleReducedMotion}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            reducedMotion ? 'bg-primary' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              reducedMotion ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        System preference: {window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Reduced' : 'No preference'}
      </p>
    </div>
  );
};