"use client";

import { useEffect, useRef } from "react";

type Strand = {
  ax: number;
  ay: number;
  cx: number;
  cy: number;
  bx: number;
  by: number;
  phase: number;
  speed: number;
  width: number;
};

/** Filaments and a soft core, in the champagne of the mark. Decorative only. */
export function EnergyFlow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.closest<HTMLElement>(".hero");
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !hero || !context) return;
    const ctx = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = window.matchMedia("(max-width: 700px)").matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const light = narrow || saveData;
    const count = light ? 12 : 36;
    const contours = light ? 5 : 11;
    const core = { x: narrow ? 0.5 : 0.76, y: narrow ? 0.74 : 0.48 };

    const strands: Strand[] = Array.from({ length: count }, (_, index) => {
      const turn = (index / count) * Math.PI * 2;
      const edge = index % 3;
      const along = (index * 0.173) % 1;
      const ax = edge === 0 ? 0.62 + along * 0.34 : edge === 1 ? 0.98 : 0.64 + along * 0.32;
      const ay = edge === 0 ? 0.02 : edge === 1 ? 0.06 + along * 0.88 : 0.98;
      return {
        ax,
        ay,
        cx: core.x + Math.cos(turn) * 0.22,
        cy: core.y + Math.sin(turn) * 0.16,
        bx: core.x + Math.cos(turn) * 0.035,
        by: core.y + Math.sin(turn) * 0.03,
        phase: (index * 0.137) % 1,
        speed: 0.72 + (index % 5) * 0.08,
        width: index % 6 === 0 ? 1.35 : 0.65,
      };
    });

    let width = 1;
    let height = 1;
    let frame = 0;
    let running = false;

    const curve = (a: number, c: number, b: number, t: number) => {
      const u = 1 - t;
      return u * u * a + 2 * u * t * c + t * t * b;
    };

    const resize = () => {
      const box = hero.getBoundingClientRect();
      const dpr = Math.min(light ? 1 : 1.25, window.devicePixelRatio || 1);
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const cx = core.x * width;
      const cy = core.y * height;
      const reach = Math.min(width, height);

      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, reach * 0.46);
      glow.addColorStop(0, "rgba(246, 231, 196, 0.34)");
      glow.addColorStop(0.16, "rgba(218, 187, 118, 0.14)");
      glow.addColorStop(0.42, "rgba(41, 72, 112, 0.08)");
      glow.addColorStop(1, "rgba(11, 21, 36, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 1;
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.strokeStyle = ring === 0 ? "rgba(246, 231, 196, 0.45)" : "rgba(218, 187, 118, 0.22)";
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          54 + ring * 38,
          18 + ring * 14,
          time * 0.00012 + ring * 1.1,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.restore();

      ctx.lineWidth = 0.8;
      const floor = width * (narrow ? 0.04 : 0.5);
      for (let line = 0; line < contours; line += 1) {
        ctx.beginPath();
        const radius = 36 + line * (reach * 0.045);
        let open = false;
        for (let angle = 0; angle <= Math.PI * 2.05; angle += 0.07) {
          const noise =
            Math.sin(angle * 3 + line + time * 0.00028) * 10 +
            Math.sin(angle * 6 + line * 1.4) * 5;
          const x = cx + Math.cos(angle) * (radius + noise) * 1.45;
          const y = cy + Math.sin(angle) * (radius + noise) * 0.78;
          if (x < floor) {
            open = false;
            continue;
          }
          if (!open) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          open = true;
        }
        ctx.strokeStyle = line % 3 === 0 ? "rgba(120, 156, 186, 0.16)" : "rgba(218, 187, 118, 0.12)";
        ctx.stroke();
      }

      for (const strand of strands) {
        ctx.beginPath();
        const steps = 22;
        for (let step = 0; step <= steps; step += 1) {
          const t = step / steps;
          const drift = Math.sin(time * 0.00035 + strand.phase * 8 + t * 5) * 8;
          const x = curve(strand.ax * width, strand.cx * width, strand.bx * width, t);
          const y = curve(strand.ay * height, strand.cy * height + drift, strand.by * height, t);
          if (step === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(230, 201, 144, 0.34)";
        ctx.lineWidth = strand.width;
        ctx.stroke();

        for (let bead = 0; bead < 3; bead += 1) {
          const t = (strand.phase + bead * 0.28 + (time / 9000) * strand.speed) % 1;
          const drift = Math.sin(time * 0.00035 + strand.phase * 8 + t * 5) * 8;
          const x = curve(strand.ax * width, strand.cx * width, strand.bx * width, t);
          const y = curve(strand.ay * height, strand.cy * height + drift, strand.by * height, t);
          ctx.beginPath();
          ctx.fillStyle = bead === 0 ? "rgba(255, 244, 214, 0.95)" : "rgba(218, 187, 118, 0.75)";
          ctx.arc(x, y, strand.width + (bead === 0 ? 1.3 : 0.7), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (time: number) => {
      draw(time);
      if (running) frame = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduce || running || document.hidden) return;
      running = true;
      frame = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };

    resize();
    draw(0);
    start();

    const seen = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start();
      else stop();
    });
    seen.observe(hero);

    const onHide = () => {
      if (document.hidden) stop();
      else start();
    };
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      stop();
      seen.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return <canvas ref={ref} className="energy-flow" aria-hidden="true" />;
}
