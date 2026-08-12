'use client';

import BootScreen from '@/components/BootScreen';
import ContentPanel from '@/components/ContentPanel';
import Scene from '@/components/Scene';
import { Map, MousePointer2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AboutPanel from '@/components/panels/AboutPanel';

export default function Home() {
  const { hasEntered, activeHotspot, viewMode, setViewMode, setActiveHotspot } = useStore();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (hasEntered && !activeHotspot) {
      const timer = setTimeout(() => setShowHint(true), 1500);
      const hideTimer = setTimeout(() => setShowHint(false), 8000);
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    } else {
      setShowHint(false);
    }
  }, [hasEntered, activeHotspot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewMode === 'fullscreen-monitor') {
        setViewMode('room');
        setActiveHotspot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, setViewMode, setActiveHotspot]);

  return (
    <main className="w-full h-full relative bg-bg-void text-text-primary overflow-hidden">
      <BootScreen />
      
      {/* 3D Canvas wrapper */}
      <div className={`w-full h-full transition-opacity duration-1000 ${hasEntered ? 'opacity-100' : 'opacity-0'}`}>
        <Scene />
      </div>

      <ContentPanel />

      {/* Fullscreen Monitor UI */}
      <AnimatePresence>
        {viewMode === 'fullscreen-monitor' && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 bg-[#07070a]/95 backdrop-blur-lg flex items-center justify-center pointer-events-auto"
            onClick={() => {
              setViewMode('room');
              setActiveHotspot(null);
            }}
          >
            {/* Scanline texture */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0" />
            
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-0" />

            {/* Exit Button */}
            <button 
              className="absolute top-6 right-6 z-50 glass-panel px-4 py-2 rounded-full text-white/70 hover:text-white transition-colors text-sm font-mono flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('room');
                setActiveHotspot(null);
              }}
            >
              <span>⤢</span> Exit
            </button>

            {/* Content wrapper */}
            <div 
              className="relative z-10 w-full max-w-2xl px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <AboutPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlays */}
      <AnimatePresence>
        {hasEntered && viewMode !== 'fullscreen-monitor' && (
          <>
            {/* SRI OS Wordmark */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              className="absolute top-6 left-6 font-mono text-sm tracking-[0.3em] text-white pointer-events-none z-30"
            >
              SRI OS // v1.0
            </motion.div>

            {/* Room Map Toggle */}
            <motion.button 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute top-6 right-6 p-3 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-colors z-30 backdrop-blur-md"
              aria-label="Room Map"
            >
              <Map className="w-5 h-5 text-neon-green" />
            </motion.button>

            {/* Hint */}
            <AnimatePresence>
              {showHint && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md pointer-events-none z-30"
                >
                  <MousePointer2 className="w-4 h-4 text-neon-green animate-bounce" />
                  <span className="font-mono text-xs text-text-muted">Click objects to explore</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
