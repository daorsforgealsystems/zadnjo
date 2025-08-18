import React from 'react';
import '@/styles/fallback-background.css';

interface FallbackBackgroundProps {
  visible: boolean;
}

const FallbackBackground: React.FC<FallbackBackgroundProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div 
      className="absolute top-0 left-0 w-full h-full z-0"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease-in-out'
      }}
    >
      {/* Optional: Add some animated elements for visual interest */}
      <div className="absolute w-full h-full overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FallbackBackground;