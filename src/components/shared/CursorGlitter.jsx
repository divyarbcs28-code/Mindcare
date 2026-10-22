import { useEffect, useRef } from 'react';

const bubbles = Array.from({ length: 14 }, (_, index) => ({
  '--bubble-size': `${10 + ((index * 17) % 24)}px`,
  '--bubble-x': `${(index * 43 + 7) % 100}%`,
  '--bubble-time': `${18 + ((index * 7) % 16)}s`,
  '--bubble-delay': `${-((index * 5) % 24)}s`,
  '--bubble-drift': `${((index * 31) % 100) - 50}px`,
}));

const sparkles = Array.from({ length: 12 }, (_, index) => ({
  '--sparkle-size': `${2 + (index % 3)}px`,
  '--sparkle-x': `${(index * 61 + 13) % 100}%`,
  '--sparkle-y': `${(index * 37 + 9) % 100}%`,
  '--sparkle-time': `${3 + (index % 5)}s`,
  '--sparkle-delay': `${-((index * 2) % 7)}s`,
}));

export default function CursorGlitter() {
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = layerRef.current;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!layer || !finePointer.matches || reducedMotion.matches) return undefined;

    let frame = 0;
    let point = null;
    const move = (event) => {
      if (event.pointerType !== 'mouse') return;
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        layer.style.setProperty('--cursor-x', `${point.x}px`);
        layer.style.setProperty('--cursor-y', `${point.y}px`);
        layer.classList.add('is-visible');
        frame = 0;
      });
    };
    const leave = () => layer.classList.remove('is-visible');

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={layerRef} className="cursor-glitter" aria-hidden="true">
      {bubbles.map((style, index) => <span key={`bubble-${index}`} className="ambient-bubble" style={style} />)}
      {sparkles.map((style, index) => <span key={`sparkle-${index}`} className="ambient-sparkle" style={style} />)}
    </div>
  );
}
