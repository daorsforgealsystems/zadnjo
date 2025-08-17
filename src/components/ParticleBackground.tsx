import { useEffect, useRef } from "react";

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number | null = null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // keep local copies for inner closures to avoid nullable canvas access
      canvasW = canvas.width;
      canvasH = canvas.height;
    };

    // local width/height used inside Particle to avoid referencing nullable `canvas` directly
    let canvasW = canvas.width;
    let canvasH = canvas.height;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Respect reduced motion preference
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;

      constructor() {
    this.x = Math.random() * canvasW;
    this.y = Math.random() * canvasH;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.15;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

    if (this.x < 0) this.x = canvasW;
    if (this.x > canvasW) this.x = 0;
    if (this.y < 0) this.y = canvasH;
    if (this.y > canvasH) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D, primaryHsl: string | null) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        if (primaryHsl) {
          ctx.fillStyle = `hsla(${primaryHsl}, ${this.opacity})`;
        } else {
          ctx.fillStyle = `hsla(210, 90%, 48%, ${this.opacity})`;
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Lower particle count for mobile and when reduced motion is set
    const baseCount = prefersReduced ? 8 : Math.max(8, Math.min(28, Math.floor(window.innerWidth / 60)));

    const particles: Particle[] = [];
    for (let i = 0; i < baseCount; i++) particles.push(new Particle());

    // Read CSS variable once per frame
    const getPrimaryToken = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary');
      return raw ? raw.trim() : null;
    };

    // Pause animation when page is not visible
    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        // kick off animation again
        loop();
      } else if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    const loop = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const primaryHsl = getPrimaryToken();

      // Draw connecting lines with subtle opacity
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.save();
            ctx.globalAlpha = ((100 - dist) / 100) * 0.06;
            ctx.strokeStyle = primaryHsl ? `hsl(${primaryHsl})` : 'hsl(210,90%,48%)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw(ctx, getPrimaryToken());
      });

      if (!prefersReduced) {
        animationId = requestAnimationFrame(loop);
      }
    };

    // Start animation only if not reduced motion
    if (!prefersReduced) loop();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
};

export default ParticleBackground;