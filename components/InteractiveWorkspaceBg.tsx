"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function InteractiveWorkspaceBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const isDark = theme === "dark";

    const ripples: { x: number; y: number; radius: number; maxRadius: number; alpha: number; colorIndex: number }[] = [];
    const mouseWaves: { x: number; y: number; radius: number; life: number }[] = [];
    let mouseX = w / 2;
    let mouseY = h / 2;
    let targetMouseX = w / 2;
    let targetMouseY = h / 2;
    let lastWaveX = w / 2;
    let lastWaveY = h / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      
      const dist = Math.hypot(e.clientX - lastWaveX, e.clientY - lastWaveY);
      
      // Spawn a water wave if mouse moved enough distance
      if (dist > 30) {
        mouseWaves.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          life: 1,
        });
        lastWaveX = e.clientX;
        lastWaveY = e.clientY;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleMouseDown = (e: MouseEvent) => {
      // Spawn a massive, bold ripple that expands and fades when clicking anywhere
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          ripples.push({
            x: e.clientX,
            y: e.clientY,
            radius: 0,
            maxRadius: 500,
            alpha: 1.0 - (i * 0.3),
            colorIndex: i, 
          });
        }, i * 200);
      }
    };
    window.addEventListener("mousedown", handleMouseDown, true); // Use capture to ensure Monaco doesn't block it

    const handleKeyDown = (e: KeyboardEvent) => {
      // Spawn 3 concentric ripples at a random location
      const rx = Math.random() * (w * 0.8) + (w * 0.1);
      const ry = Math.random() * (h * 0.8) + (h * 0.1);
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          ripples.push({
            x: rx,
            y: ry,
            radius: 0,
            maxRadius: Math.random() * 80 + 150 + i * 40,
            alpha: 0.8 - (i * 0.2),
            colorIndex: i, // 0, 1, 2 for different shades
          });
        }, i * 150);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, w, h);

      // Base background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, w, h);
      if (isDark) {
        bgGradient.addColorStop(0, "#0f172a"); // Very dark slate
        bgGradient.addColorStop(1, "#1e293b"); // Slate
      } else {
        bgGradient.addColorStop(0, "#f9a8d4"); // Pink-300
        bgGradient.addColorStop(1, "#fbcfe8"); // Pink-200
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // Slowly moving milky blobs for ambient waves
      const numBlobs = 3;
      for (let i = 0; i < numBlobs; i++) {
        const bx = w / 2 + Math.sin(time + i * 2) * (w / 3);
        const by = h / 2 + Math.cos(time * 0.8 + i * 3) * (h / 3);
        const blobGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 600);
        
        if (isDark) {
          blobGrad.addColorStop(0, i === 0 ? "rgba(168, 85, 247, 0.15)" : "rgba(59, 130, 246, 0.1)");
          blobGrad.addColorStop(1, "transparent");
        } else {
          blobGrad.addColorStop(0, i === 0 ? "rgba(219, 39, 119, 0.35)" : "rgba(250, 204, 21, 0.25)");
          blobGrad.addColorStop(1, "transparent");
        }
        ctx.fillStyle = blobGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Mouse water waves
      for (let i = mouseWaves.length - 1; i >= 0; i--) {
        const mw = mouseWaves[i];
        mw.radius += 2.5; // Expand faster for more splash feel
        mw.life -= 0.02; // Fade a bit faster
        if (mw.life <= 0) {
          mouseWaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(mw.x, mw.y, mw.radius, 0, Math.PI * 2);
        if (isDark) {
          ctx.strokeStyle = `rgba(147, 51, 234, ${mw.life * 0.85})`; // Deep saturated purple
        } else {
          ctx.strokeStyle = `rgba(190, 24, 93, ${Math.min(1, mw.life * 1.2)})`; // Pink-700, much darker and more opaque
        }
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // Draw Ripples (Keystrokes)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 5;
        r.alpha -= 0.015;
        if (r.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        
        let colorStr = "";
        if (isDark) {
          const colors = [`rgba(168, 85, 247, ${r.alpha})`, `rgba(59, 130, 246, ${r.alpha})`, `rgba(236, 72, 153, ${r.alpha})`];
          colorStr = colors[r.colorIndex % 3];
        } else {
          // Darker, highly saturated pinks/reds to contrast with the pink background
          const colors = [`rgba(190, 24, 93, ${r.alpha})`, `rgba(157, 23, 77, ${r.alpha})`, `rgba(225, 29, 72, ${r.alpha})`];
          colorStr = colors[r.colorIndex % 3];
        }
        
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = 3 + (2 - (r.colorIndex % 3)); // Vary thickness
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
