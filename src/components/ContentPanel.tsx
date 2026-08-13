'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import AboutPanel from './panels/AboutPanel';
import SkillsPanel from './panels/SkillsPanel';
import ProjectsPanel from './panels/ProjectsPanel';
import EducationPanel from './panels/EducationPanel';
import ContactPanel from './panels/ContactPanel';
import InterestsPanel from './panels/InterestsPanel';
import EasterEggPanel from './panels/EasterEggPanel';

export default function ContentPanel() {
  const { activeHotspot, setActiveHotspot } = useStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const closePanel = () => setActiveHotspot(null);

  const getPanelContent = () => {
    switch (activeHotspot) {
      case 'about': return <AboutPanel />;
      case 'skills': return <SkillsPanel />;
      case 'projects': return <ProjectsPanel />;
      case 'education': return <EducationPanel />;
      case 'contact': return <ContactPanel />;
      case 'interests': return <InterestsPanel />;
      case 'easter_egg': return <EasterEggPanel />;
      default: return null;
    }
  };

  const getPanelTitle = () => {
    switch (activeHotspot) {
      case 'about': return 'About Me';
      case 'skills': return 'Skills';
      case 'projects': return 'Projects';
      case 'education': return 'Education';
      case 'contact': return 'Contact';
      case 'interests': return 'Interests';
      case 'easter_egg': return 'Hobbies';
      default: return '';
    }
  };

  const drawerVariants: any = {
    hidden: isMobile 
      ? { y: '100%', opacity: 0 } 
      : { x: '100%', opacity: 0 },
    visible: isMobile 
      ? { y: 0, opacity: 1, transition: { type: 'spring', damping: 24, stiffness: 220 } }
      : { x: 0, opacity: 1, transition: { type: 'spring', damping: 24, stiffness: 220 } },
    exit: isMobile 
      ? { y: '100%', opacity: 0, transition: { duration: 0.3 } }
      : { x: '100%', opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <AnimatePresence>
      {activeHotspot && activeHotspot !== 'about' && (
        <div className="fixed inset-0 z-40 pointer-events-none flex justify-end items-end md:items-start p-0 md:p-6">
          {/* Dim overlay for background focus loss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-[2px]"
            onClick={closePanel}
          />
          
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              glass-panel pointer-events-auto relative z-50 flex flex-col
              w-full md:w-[420px] 
              h-[85vh] md:h-[calc(100vh-3rem)] 
              rounded-t-3xl md:rounded-2xl
              overflow-hidden
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-black/20">
              <h2 className="font-sans text-xl uppercase tracking-wider text-text-primary text-neon-green">
                {getPanelTitle()}
              </h2>
              <button 
                onClick={closePanel}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5 text-text-muted hover:text-white transition-colors" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 relative custom-scrollbar">
              {getPanelContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
