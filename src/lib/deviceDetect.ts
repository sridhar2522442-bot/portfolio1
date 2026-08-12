/**
 * Device tier detection utility.
 * Runs once on the client and returns 'high' | 'mid' | 'low'.
 */

export type DeviceTier = 'high' | 'mid' | 'low';

function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as any).deviceMemory ?? 4;
  const dpr = window.devicePixelRatio ?? 1;
  const mobile = isMobileUA();
  const screenArea = window.screen.width * window.screen.height;

  if (memory <= 1) return 'low';
  if (cores <= 2 && mobile) return 'low';
  if (mobile && screenArea < 360 * 640) return 'low';

  if (!mobile && cores >= 8 && memory >= 8) return 'high';
  if (!mobile && cores >= 4 && dpr <= 1) return 'high';

  if (mobile && cores >= 6 && memory >= 4) return 'mid';
  if (mobile && cores >= 4) return 'mid';
  if (mobile) return 'low';

  return 'high';
}
