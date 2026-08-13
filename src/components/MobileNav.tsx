'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore, type HotspotId } from '@/store/useStore';

const NAV_ITEMS: { id: HotspotId; label: string; icon: string; cameraTarget: [number,number,number]; cameraPosition: [number,number,number]; isFullscreen?: boolean }[] = [
  { id: 'about',     label: 'About',     icon: '🖥️', cameraTarget: [0, 3.2, -2.5],      cameraPosition: [0, 3.2, -1.8],    isFullscreen: true },
  { id: 'skills',    label: 'Skills',    icon: '⌨️', cameraTarget: [-0.5, 2.65, -1.2],  cameraPosition: [-0.5, 4, 0.5] },
  { id: 'projects',  label: 'Projects',  icon: '🖱️', cameraTarget: [1.5, 2.65, -1.2],   cameraPosition: [1.5, 4, 0.5] },
  { id: 'contact',   label: 'Contact',   icon: '📱', cameraTarget: [-2.5, 2.65, -1.2],  cameraPosition: [-2.5, 3.5, 0] },
];

export default function MobileNav() {
  const { hasEntered, activeHotspot, setActiveHotspot, setViewMode, viewMode } = useStore();

  if (!hasEntered || viewMode === 'fullscreen-monitor') return null;

  const handleNav = (item: typeof NAV_ITEMS[0]) => {
    // Close if already active
    if (activeHotspot === item.id) {
      setActiveHotspot(null);
      setViewMode('room');
      return;
    }

    setActiveHotspot(item.id);

    if (item.isFullscreen) {
      setViewMode('transitioning');
      setTimeout(() => setViewMode('fullscreen-monitor'), 1100);
    }

    window.dispatchEvent(new CustomEvent('camera-move', {
      detail: {
        target: item.cameraTarget,
        position: item.cameraPosition,
        duration: 1.2,
        ease: 'power3.inOut',
        fov: item.isFullscreen ? 52 : undefined,
      }
    }));
  };

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
        aria-label="Mobile navigation"
      >
        {/* Gradient fade at top */}
        <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        <div className="glass-panel border-t border-white/10 px-2 py-2 pb-safe">
          <div className="flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => {
              const isActive = activeHotspot === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item)}
                  className={`
                    flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] min-h-[44px] justify-center
                    transition-all duration-200 active:scale-95 select-none
                    ${isActive
                      ? 'bg-[#39ff88]/15 border border-[#39ff88]/40'
                      : 'border border-transparent hover:bg-white/5'
                    }
                  `}
                  aria-label={item.label}
                  aria-pressed={isActive}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className={`text-[9px] font-mono tracking-wider uppercase leading-none ${isActive ? 'text-[#39ff88]' : 'text-white/50'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
