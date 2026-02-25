import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

const NEON_COLORS = [
  "#00FFFF",
  "#FF00FF",
  "#00FF88",
  "#FF0088",
  "#00FFFF",
  "#FF00FF",
];

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Many more particles
    const particleCount = Math.min(120, Math.floor((canvas.width * canvas.height) / 10000));
    const particles: Particle[] = [];
    
    // Check if neon mode is active
    const isNeon = document.documentElement.classList.contains("neon");
    const colorPalette = isNeon ? NEON_COLORS : COLORS;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2.5 + 1.5,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      });
    }

    particlesRef.current = particles;
    return { canvas, ctx, particles };
  }, []);

  const respawnParticle = useCallback((p: Particle, canvas: HTMLCanvasElement, awayFromMouse = false) => {
    const mouse = mouseRef.current;
    let attempts = 0;
    
    do {
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0:
          p.x = Math.random() * canvas.width;
          p.y = 0;
          p.vy = Math.random() * 2 + 1;
          p.vx = (Math.random() - 0.5) * 2;
          break;
        case 1:
          p.x = Math.random() * canvas.width;
          p.y = canvas.height;
          p.vy = -(Math.random() * 2 + 1);
          p.vx = (Math.random() - 0.5) * 2;
          break;
        case 2:
          p.x = 0;
          p.y = Math.random() * canvas.height;
          p.vx = Math.random() * 2 + 1;
          p.vy = (Math.random() - 0.5) * 2;
          break;
        case 3:
          p.x = canvas.width;
          p.y = Math.random() * canvas.height;
          p.vx = -(Math.random() * 2 + 1);
          p.vy = (Math.random() - 0.5) * 2;
          break;
      }
      attempts++;
    } while (
      awayFromMouse && 
      mouse.active && 
      Math.abs(p.x - mouse.x) < 200 && 
      Math.abs(p.y - mouse.y) < 200 && 
      attempts < 3
    );
  }, []);

  useEffect(() => {
    const result = initCanvas();
    if (!result) return;

    const { canvas, ctx } = result;
    const maxDistance = 80;
    const maxDistanceSq = maxDistance * maxDistance;
    const mouseRadius = 100;
    const mouseRadiusSq = mouseRadius * mouseRadius;
    const pushStrength = 12;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const len = particles.length;
      const mouse = mouseRef.current;

      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // Mouse interaction - push particles away fast
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (mouseRadius - dist) / mouseRadius;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * pushStrength;
            p.vy += Math.sin(angle) * force * pushStrength;
          }
        }

        // Apply friction
        p.vx *= 0.97;
        p.vy *= 0.97;

        // Ensure minimum movement
        const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (vel < 0.8) {
          p.vx += (Math.random() - 0.5) * 0.5;
          p.vy += (Math.random() - 0.5) * 0.5;
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Instant respawn when off screen
        if (p.x < -2 || p.x > canvas.width + 2 || p.y < -2 || p.y > canvas.height + 2) {
          respawnParticle(p, canvas, true);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw connections (optimized - check fewer)
        for (let j = i + 1; j < len; j++) {
          const p2 = particles[j];
          const cdx = p2.x - p.x;
          const cdy = p2.y - p.y;
          const cDistSq = cdx * cdx + cdy * cdy;

          if (cDistSq < maxDistanceSq) {
            const opacity = 1 - Math.sqrt(cDistSq) / maxDistance;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(150, 150, 150, ${opacity * 0.25})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY, 
          active: true 
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", handleResize);
    };
  }, [initCanvas, respawnParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
