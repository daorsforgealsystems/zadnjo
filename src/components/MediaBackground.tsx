import React, { useRef, useEffect, useState } from 'react';

interface MediaBackgroundProps {
  mediaSrc: string;
  /** overlay opacity between 0 (transparent) and 1 (opaque) */
  overlayOpacity?: number;
  type?: 'video' | 'image';
}

const MediaBackground: React.FC<MediaBackgroundProps> = ({ 
  mediaSrc, 
  overlayOpacity = 0.4,
  type = 'image' /* default to image for hero backgrounds to avoid heavy video loads */
}) => {
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    if (type === 'video' && mediaRef.current && 'onended' in mediaRef.current) {
      const video = mediaRef.current as HTMLVideoElement;
      video.onended = () => {
        video.play();
      };
    }
  }, [type]);

  const handleMediaError = () => {
    setMediaError(true);
  };

  const overlayStyle: React.CSSProperties = { backgroundColor: `rgba(0,0,0,${overlayOpacity})` };

  if (mediaError) {
    // Fallback to a gradient background if media fails to load
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900" />
        {/* configurable overlay so callers can tune darkness */}
        <div className="absolute inset-0" style={overlayStyle} />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          className="w-full h-full object-cover"
          src={mediaSrc}
          autoPlay
          muted
          playsInline
          onError={handleMediaError}
        />
        {/* configurable overlay for videos */}
        <div className="absolute inset-0" style={overlayStyle} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Use native lazy loading and a descriptive alt for accessibility */}
      <img
        ref={mediaRef as React.RefObject<HTMLImageElement>}
        className="w-full h-full object-cover block"
        src={mediaSrc}
        alt="Logistics hero background showing transport vehicles and routes"
        loading="lazy"
        decoding="async"
        onError={handleMediaError}
      />
      <div className="absolute inset-0" style={overlayStyle} />
    </div>
  );
};

export default MediaBackground;
