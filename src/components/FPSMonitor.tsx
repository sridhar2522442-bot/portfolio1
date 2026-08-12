'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

// Dev-only FPS overlay — zero impact on production bundle
export default function FPSMonitor() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <FPSMonitorInner />;
}

function FPSMonitorInner() {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const frames = useRef<number[]>([]);
  const last = useRef(performance.now());

  useFrame((state) => {
    const now = performance.now();
    const dt = now - last.current;
    last.current = now;

    frames.current.push(dt);
    if (frames.current.length > 30) frames.current.shift();

    if (frames.current.length >= 10) {
      const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
      setFps(Math.round(1000 / avg));
      setFrameTime(parseFloat(avg.toFixed(1)));
    }
  });

  const color = fps >= 55 ? '#39ff88' : fps >= 40 ? '#ffb347' : '#ff4444';

  return (
    <div
      style={{ position: 'fixed', bottom: 80, right: 12, zIndex: 9999, fontFamily: 'monospace', fontSize: 10, color, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4, pointerEvents: 'none', lineHeight: 1.6 }}
    >
      <div>{fps} FPS</div>
      <div>{frameTime}ms</div>
    </div>
  );
}
