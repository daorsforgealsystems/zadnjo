import React, { useRef, useEffect, useState } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackClass?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoSrc,
  fallbackClass = "bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Check if the video source exists before attempting to play
      const checkVideoExists = async () => {
        try {
          const response = await fetch(videoSrc, { method: 'HEAD' });
          if (!response.ok) {
            console.warn(`Video not found: ${videoSrc}`);
            setVideoError(true);
            return;
          }
        } catch (err) {
          console.warn(`Error checking video: ${videoSrc}`, err);
          setVideoError(true);
          return;
        }
      };
      
      checkVideoExists();
      
      video.onended = () => {
        video.play();
      };
      
      video.oncanplaythrough = () => {
        setVideoLoaded(true);
      };
      
      video.onerror = () => {
        console.warn(`Error loading video: ${videoSrc}`);
        setVideoError(true);
      };
      
      video.onloadstart = () => {
        setVideoError(false);
        setVideoLoaded(false);
      };
    }
  }, [videoSrc]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {!videoError ? (
        <video
          ref={videoRef}
          className={`w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      ) : null}
      
      {/* Animated background fallback when video fails to load */}
      <div className={`absolute inset-0 ${fallbackClass} ${
        videoError || !videoLoaded ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-1000`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.1)_100%)]" />
        {/* Subtle animated elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-secondary/5 rounded-full blur-2xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-accent/5 rounded-full blur-xl animate-pulse animation-delay-2000" />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/60 to-background/80 transition-opacity duration-700" />
    </div>
  );
};

export default VideoBackground;
