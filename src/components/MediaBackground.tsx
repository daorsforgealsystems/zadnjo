import React, { useRef, useEffect, useState } from 'react';

interface MediaBackgroundProps {
  mediaSrc: string;
  type?: 'video' | 'image';
}

const MediaBackground: React.FC<MediaBackgroundProps> = ({ 
  mediaSrc, 
  type = 'video' 
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

  if (mediaError) {
    // Fallback to a gradient background if media fails to load
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900" />
        <div className="absolute inset-0 bg-background/70" />
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
        <div className="absolute inset-0 bg-background/70" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        ref={mediaRef as React.RefObject<HTMLImageElement>}
        className="w-full h-full object-cover"
        src={mediaSrc}
        alt="Background"
        onError={handleMediaError}
      />
      <div className="absolute inset-0 bg-background/70" />
    </div>
  );
};

export default MediaBackground;
