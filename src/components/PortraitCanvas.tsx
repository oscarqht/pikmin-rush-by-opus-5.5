import React, { useEffect, useRef } from 'react';
import { PTD } from '../engine';

interface PortraitCanvasProps {
  por: string;
  size?: number;
  gray?: boolean;
  className?: string;
}

/** Draws one of the engine's procedural round portraits (e.g. 'cre:anode', 'borb:emperor') */
export const PortraitCanvas: React.FC<PortraitCanvasProps> = ({ por, size = 64, gray = false, className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const sprite = PTD.Art.portrait(por, size, { gray });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(sprite.c, 0, 0, cv.width, cv.height);
  }, [sprite]);

  return <canvas ref={ref} className={className} width={sprite.c.width} height={sprite.c.height} />;
};
