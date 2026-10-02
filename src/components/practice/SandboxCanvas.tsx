"use client";

import { useEffect, useRef, useState } from "react";

export default function SandboxCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Setup canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#171717"; // ink color
    ctx.lineWidth = 2;
    setContext(ctx);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;
    const { offsetX, offsetY } = getCoordinates(e);
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top,
      };
    }
    return {
      offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
      offsetY: (e as React.MouseEvent).nativeEvent.offsetY,
    };
  };

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-hover px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Sandbox / Scratchpad</span>
        <button 
          onClick={clearCanvas}
          className="rounded px-2 py-1 text-[11px] font-semibold text-muted hover:bg-line hover:text-ink transition-colors"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-48 cursor-crosshair touch-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      />
    </div>
  );
}
