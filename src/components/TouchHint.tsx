'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TouchHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on touch devices
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (!isTouch) return;

    // Only show once per session
    if (sessionStorage.getItem('touch-hint-seen')) return;

    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('touch-hint-seen', '1');
  };

  useEffect(() => {
    if (!visible) return;
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(dismiss, 4000);
    // Dismiss on first touch
    window.addEventListener('touchstart', dismiss, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('touchstart', dismiss);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-40 flex justify-center pointer-events-none px-6"
        >
          <div className="glass-panel rounded-2xl px-6 py-5 flex flex-col items-center gap-4 max-w-xs w-full border border-white/10">
            <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase">Controls</p>
            <div className="flex gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-xl">☝️</span>
                </div>
                <span className="text-[9px] text-white/50 font-mono text-center">Drag<br/>Rotate</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-xl">🤏</span>
                </div>
                <span className="text-[9px] text-white/50 font-mono text-center">Pinch<br/>Zoom</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                  <span className="text-xl">👆</span>
                </div>
                <span className="text-[9px] text-white/50 font-mono text-center">Tap<br/>Explore</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
