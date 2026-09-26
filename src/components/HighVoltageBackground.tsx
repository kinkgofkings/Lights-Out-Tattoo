import React, { useEffect, useRef } from 'react';

interface HighVoltageBackgroundProps {
  showStrobeBorders?: boolean;
}

export const HighVoltageBackground: React.FC<HighVoltageBackgroundProps> = ({
  showStrobeBorders = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // High Voltage Sparks & Electrical Nodes
    interface SparkNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      life: number;
      maxLife: number;
    }

    const sparks: SparkNode[] = [];
    const sparkCount = Math.min(24, Math.floor((width * height) / 45000));

    for (let i = 0; i < sparkCount; i++) {
      sparks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? '#00f0ff' : '#0066ff',
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 100
      });
    }

    // Occasional lightning arc discharge
    let lightningTimer = 0;
    let lightningArc: { x1: number; y1: number; x2: number; y2: number; points: { x: number; y: number }[] } | null = null;

    const generateLightningArc = () => {
      const x1 = Math.random() * width;
      const y1 = Math.random() * height * 0.4;
      const x2 = x1 + (Math.random() - 0.5) * 350;
      const y2 = y1 + 100 + Math.random() * 250;

      const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
      const segments = 6 + Math.floor(Math.random() * 4);
      for (let i = 1; i < segments; i++) {
        const ratio = i / segments;
        const curX = x1 + (x2 - x1) * ratio + (Math.random() - 0.5) * 45;
        const curY = y1 + (y2 - y1) * ratio + (Math.random() - 0.5) * 30;
        points.push({ x: curX, y: curY });
      }
      points.push({ x: x2, y: y2 });
      return { x1, y1, x2, y2, points };
    };

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Deep dark graphite/carbon grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw random lightning flashes
      lightningTimer += delta;
      if (lightningTimer > 3.5) {
        lightningArc = generateLightningArc();
        lightningTimer = 0;
      }

      if (lightningArc && lightningTimer < 0.25) {
        const alpha = (0.25 - lightningTimer) / 0.25;
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.75})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(lightningArc.points[0].x, lightningArc.points[0].y);
        for (let i = 1; i < lightningArc.points.length; i++) {
          ctx.lineTo(lightningArc.points[i].x, lightningArc.points[i].y);
        }
        ctx.stroke();

        // Inner white hot core
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      // Update and draw floating voltage sparks
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life += delta * 20;

        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        // Draw spark node
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby sparks with subtle high voltage discharge filaments
        for (let j = i + 1; j < sparks.length; j++) {
          const s2 = sparks[j];
          const dist = Math.hypot(s.x - s2.x, s.y - s2.y);
          if (dist < 130) {
            const opacity = (1 - dist / 130) * 0.18;
            ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            // Slight jitter for electrical effect
            const midX = (s.x + s2.x) / 2 + (Math.random() - 0.5) * 4;
            const midY = (s.y + s2.y) / 2 + (Math.random() - 0.5) * 4;
            ctx.lineTo(midX, midY);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Live wallpaper interactive canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-80"
        aria-hidden="true"
      />

      {/* Double Neon Lines Strobing Around The Edges of the Screen */}
      {showStrobeBorders && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" aria-hidden="true">
          {/* Outer Neon Cyan Line */}
          <div className="absolute inset-0 border-[2px] border-cyan-400/80 animate-strobe-cyan pointer-events-none" />
          {/* Inner Neon Cobalt Blue Line with slight inset */}
          <div className="absolute inset-1.5 border-[1.5px] border-blue-600/80 animate-strobe-blue pointer-events-none" />

          {/* Corner Voltage Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-300 shadow-[0_0_8px_#00f0ff]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-300 shadow-[0_0_8px_#00f0ff]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-300 shadow-[0_0_8px_#00f0ff]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-300 shadow-[0_0_8px_#00f0ff]" />
        </div>
      )}
    </>
  );
};
