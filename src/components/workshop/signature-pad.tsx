"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

export type SignaturePadHandle = { clear: () => void; getDataUrl: () => string | null };

/** Canvas signature pad — works with mouse and touch (pointer events). */
export const SignaturePad = forwardRef<SignaturePadHandle, { color?: string }>(function SignaturePad({ color = "#1e40af" }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawn = useRef(false);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width) * ratio;
    canvas.height = 150 * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, 150);

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => { e.preventDefault(); drawing.current = true; drawn.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); try { canvas.setPointerCapture(e.pointerId); } catch {} };
    const move = (e: PointerEvent) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const up = () => { drawing.current = false; };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointerleave", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", up);
    };
  }, [color]);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const ratio = window.devicePixelRatio || 1;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      drawn.current = false;
    },
    getDataUrl() {
      return drawn.current && canvasRef.current ? canvasRef.current.toDataURL("image/png") : null;
    },
  }));

  return <canvas ref={canvasRef} className="w-full touch-none rounded-lg border border-slate-200 bg-white dark:border-white/10" style={{ height: 150 }} />;
});
