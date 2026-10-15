import React, { useEffect, useRef } from 'react';
import { PTD, makeDemo, updateDemo, renderMap } from '../engine';

interface GameCanvasProps {
  screen: 'title' | 'map' | 'game';
  game: any;
  onPause: () => void;
  onToggleMute: () => void;
  onEnd: (result: any) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  screen,
  game,
  onPause,
  onToggleMute,
  onEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<any>(null);
  const demoTRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Connect PTD.Screens interface for in-canvas HUD buttons
  useEffect(() => {
    PTD.Screens = PTD.Screens || {};
    PTD.Screens.pause = onPause;
    PTD.Screens.toggleMute = onToggleMute;
  }, [onPause, onToggleMute]);

  // Hook game end event
  useEffect(() => {
    if (!game) return;

    const handleEnd = (r: any) => {
      setTimeout(() => {
        onEnd(r);
      }, r.win ? 900 : 700);
    };

    game.on('end', handleEnd);
  }, [game, onEnd]);

  // Resize canvas to match display aspect ratio and pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / PTD.W, vh / PTD.H);
      const w = Math.floor(PTD.W * scale);
      const h = Math.floor(PTD.H * scale);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      PTD.Art.setRes(Math.max(1, scale * dpr));
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main rendering & animation loop
  useEffect(() => {
    let animId: number;

    const frame = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      ctx.setTransform(canvas.width / PTD.W, 0, 0, canvas.height / PTD.H, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      try {
        if (screen === 'game' && game) {
          game.update(dt);
          game.render(ctx);
          game.renderHUD(ctx);
        } else if (screen === 'title') {
          if (!demoRef.current) {
            demoRef.current = makeDemo();
            demoTRef.current = 0;
          }
          demoTRef.current += dt;
          updateDemo(demoRef.current, dt, demoTRef.current);
          demoRef.current.render(ctx);
        } else if (screen === 'map') {
          renderMap(ctx);
        }
      } catch (err) {
        console.error(err);
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [screen, game]);

  // Pointer & keyboard event routing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toLogical = (ev: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((ev.clientX - r.left) / r.width) * PTD.W,
        y: ((ev.clientY - r.top) / r.height) * PTD.H,
      };
    };

    const handlePointerMove = (ev: PointerEvent) => {
      if (screen !== 'game' || !game) return;
      const p = toLogical(ev);
      canvas.style.cursor = game.pointerMove(p.x, p.y) || 'default';
    };

    const handlePointerDown = (ev: PointerEvent) => {
      PTD.Audio.init();
      if (screen !== 'game' || !game) return;
      const p = toLogical(ev);
      game.pointerMove(p.x, p.y);
      game.pointerDown(p.x, p.y, ev.pointerType === 'touch');
      ev.preventDefault();
    };

    const handleContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
      if (game) {
        game.closeMenu();
        game.ui.selected = null;
      }
    };

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (screen !== 'game' || !game) return;
      if (ev.key === ' ') {
        onPause();
        ev.preventDefault();
        return;
      }
      if (ev.key === 'm' || ev.key === 'M') {
        onToggleMute();
        return;
      }
      if (game.paused) {
        return;
      }
      game.keyDown(ev.key);
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [screen, game, onPause, onToggleMute]);

  return <canvas id="game" ref={canvasRef} />;
};
