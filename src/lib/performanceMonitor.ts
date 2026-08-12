/**
 * FPS performance monitor hook.
 * Tracks rolling FPS and suggests quality downgrade/upgrade.
 */
import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { DeviceTier } from '@/lib/deviceDetect';

const SAMPLE_COUNT = 60;
const LOW_FPS_THRESHOLD = 45;
const HIGH_FPS_THRESHOLD = 58;
const DOWNGRADE_SECONDS = 3;
const UPGRADE_SECONDS = 5;

export function useFPSMonitor(
  currentTier: DeviceTier,
  onTierChange: (tier: DeviceTier) => void
) {
  const frameTimes = useRef<number[]>([]);
  const lastFrameTime = useRef<number>(performance.now());
  const lowFPSStart = useRef<number | null>(null);
  const highFPSStart = useRef<number | null>(null);

  const getAvgFPS = useCallback(() => {
    const times = frameTimes.current;
    if (times.length < 2) return 60;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return avg > 0 ? 1000 / avg : 60;
  }, []);

  useFrame(() => {
    const now = performance.now();
    const delta = now - lastFrameTime.current;
    lastFrameTime.current = now;

    frameTimes.current.push(delta);
    if (frameTimes.current.length > SAMPLE_COUNT) {
      frameTimes.current.shift();
    }

    if (frameTimes.current.length < 30) return; // warmup

    const fps = getAvgFPS();

    // Downgrade check
    if (fps < LOW_FPS_THRESHOLD) {
      if (lowFPSStart.current === null) lowFPSStart.current = now;
      else if (now - lowFPSStart.current > DOWNGRADE_SECONDS * 1000) {
        lowFPSStart.current = null;
        if (currentTier === 'high') onTierChange('mid');
        else if (currentTier === 'mid') onTierChange('low');
      }
    } else {
      lowFPSStart.current = null;
    }

    // Upgrade check
    if (fps > HIGH_FPS_THRESHOLD) {
      if (highFPSStart.current === null) highFPSStart.current = now;
      else if (now - highFPSStart.current > UPGRADE_SECONDS * 1000) {
        highFPSStart.current = null;
        if (currentTier === 'low') onTierChange('mid');
        else if (currentTier === 'mid') onTierChange('high');
      }
    } else {
      highFPSStart.current = null;
    }
  });

  return { getAvgFPS };
}
