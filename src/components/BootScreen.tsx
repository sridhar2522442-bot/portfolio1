'use client';

import { useEffect, useState, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';
import { useStore } from '@/store/useStore';

const BOOT_MESSAGES = [
  "INITIALIZING SRI OS v1.0",
  "CONNECTING TO CORE...",
  "LOADING PERSONAL ENVIRONMENT...",
  "LOADING PROJECTS...",
  "INITIALIZING 3D ENGINE...",
  "CALIBRATING INTERFACE...",
  "VERIFYING SYSTEM...",
  "SYSTEM READY"
];

const PROGRESS_STEPS = [0, 18, 37, 54, 73, 89, 100];

export default function BootScreen() {
  const { progress: actualProgress, total } = useProgress();
  const hasEntered = useStore((state) => state.hasEntered);
  const setHasEntered = useStore((state) => state.setHasEntered);
  
  const [bootPhase, setBootPhase] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [systemReady, setSystemReady] = useState(false);
  const [showEnter, setShowEnter] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Typing effect logic
  useEffect(() => {
    if (bootPhase >= BOOT_MESSAGES.length) return;

    const currentMessage = BOOT_MESSAGES[bootPhase];
    let charIndex = 0;
    
    // Typing effect for each line
    const typeInterval = setInterval(() => {
      setDisplayedText((prev) => currentMessage.substring(0, charIndex + 1));
      charIndex++;
      
      if (charIndex === currentMessage.length) {
        clearInterval(typeInterval);
        
        // Wait a bit, then move to next message
        setTimeout(() => {
          if (bootPhase < BOOT_MESSAGES.length - 1) {
            setBootPhase(p => p + 1);
            setDisplayedText(""); // Clear for next line
          } else {
            // Final message reached
            setBootPhase(p => p + 1); // move beyond array to stop effect
          }
        }, bootPhase === 0 ? 400 : 100); // Wait longer after the first initialization line
      }
    }, 10); // ms per char

    return () => clearInterval(typeInterval);
  }, [bootPhase]);

  // Progress bar logic - decoupled to run naturally
  useEffect(() => {
    let step = 0;
    const progressInterval = setInterval(() => {
      if (step < PROGRESS_STEPS.length) {
        setSimulatedProgress(PROGRESS_STEPS[step]);
        step++;
      } else {
        clearInterval(progressInterval);
      }
    }, 250); // Advance progress step

    return () => clearInterval(progressInterval);
  }, []);

  // Check if fully ready
  useEffect(() => {
    // Ready when typing sequence is done, simulated progress is 100
    if (bootPhase >= BOOT_MESSAGES.length && simulatedProgress === 100) {
      const isLoaded = actualProgress >= 100 || total === 0;
      if (isLoaded && !systemReady) {
        setSystemReady(true);
        setTimeout(() => setShowEnter(true), 200); // Small delay before button appears
      }
    }
  }, [bootPhase, simulatedProgress, actualProgress, total, systemReady]);

  // Fallback in case actualProgress never reaches 100 or total never updates correctly
  useEffect(() => {
    if (bootPhase >= BOOT_MESSAGES.length && simulatedProgress === 100 && !systemReady) {
      const fallbackTimer = setTimeout(() => {
        if (!systemReady) {
          setSystemReady(true);
          setTimeout(() => setShowEnter(true), 200);
        }
      }, 1500); // 1.5 seconds fallback after visual sequence ends
      return () => clearTimeout(fallbackTimer);
    }
  }, [bootPhase, simulatedProgress, systemReady]);

  const handleEnter = () => {
    if (!showEnter || !containerRef.current || !buttonRef.current) return;
    
    // Cinematic Transition
    const tl = gsap.timeline();
    
    // 1. Button briefly glows more
    tl.to(buttonRef.current, {
      boxShadow: '0 0 25px 5px rgba(57,255,136,0.5)',
      backgroundColor: 'rgba(57,255,136,0.15)',
      duration: 0.2
    })
    // 2. Terminal panel fades and zooms
    .to(containerRef.current, {
      scale: 1.05, // Screen slightly zooms forward
      opacity: 0, // Dissolves into darkness
      boxShadow: '0 0 100px rgba(57,255,136,0)',
      duration: 1.0,
      ease: 'power2.inOut'
    }, "+=0.1")
    // 3. Fade out the whole background to pure black
    .to('.boot-screen-bg', {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    }, "-=0.6")
    // 4. Complete and enter 3D room
    .call(() => {
      setHasEntered(true);
    });
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEnter && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEnter]);

  if (hasEntered) return null;

  // Derive system status from simulated progress
  const getStatus = (threshold: number) => {
    if (simulatedProgress >= threshold) return "[ ONLINE ]";
    if (simulatedProgress >= threshold - 20) return "[ READY ]";
    return "[ WAITING ]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black font-mono overflow-hidden">
      
      {/* Background Wrapper for fading out independently */}
      <div className="boot-screen-bg absolute inset-0 pointer-events-none">
        {/* Dark subtle base */}
        <div className="absolute inset-0 bg-[#050505]" />
        {/* Radial green glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,136,0.04)_0%,transparent_60%)]" />
        {/* Animated subtle scanline noise */}
        <div className="absolute inset-0 opacity-20 boot-scanline-bg animate-scanline" />
      </div>
      
      <div 
        ref={containerRef}
        className="backdrop-blur-md bg-black/70 border border-[#39FF88]/20 p-8 sm:p-12 pb-16 rounded-xl max-w-2xl w-11/12 mx-4 relative overflow-hidden shadow-[0_0_30px_rgba(57,255,136,0.06)]"
      >
        <div className="text-neon-green flex flex-col gap-6 text-[11px] sm:text-sm relative z-10 tracking-widest">
          
          {/* Main Boot Sequence Text */}
          <div className="flex gap-3 min-h-[1.5rem]">
            <span>{'>'}</span> 
            <span className={bootPhase === 0 ? "animate-text-glitch" : ""}>
              {bootPhase >= BOOT_MESSAGES.length ? "SYSTEM READY" : displayedText}
              {bootPhase < BOOT_MESSAGES.length && <span className="animate-cursor-blink ml-1">▋</span>}
            </span>
          </div>
          
          {/* Progress Bar Section (Visible after phase 1 begins) */}
          <div className={`flex flex-col gap-3 transition-opacity duration-700 ${bootPhase > 1 || simulatedProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex gap-3">
              <span>{'>'}</span> 
              <span>LOADING RESOURCES</span>
            </div>
            <div className="flex items-center gap-4 pl-5">
              <div className="flex-1 h-[1px] bg-white/10 relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-neon-green shadow-[0_0_10px_rgba(57,255,136,1)] transition-all duration-500 ease-out"
                  style={{ width: `${simulatedProgress}%` }}
                />
              </div>
              <span className="text-neon-green min-w-[4ch] text-right">{simulatedProgress}%</span>
            </div>
            <div className={`flex gap-3 mt-1 transition-opacity duration-300 ${systemReady ? 'opacity-100' : 'opacity-0'}`}>
               <span>{'>'}</span> 
               <span>ALL SYSTEMS ONLINE</span>
            </div>
          </div>

          {/* System Status Section (Visible as progress increases) */}
          <div className={`mt-4 pl-5 transition-opacity duration-700 ${simulatedProgress >= 18 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="mb-3 text-white/40 border-b border-white/10 pb-1 inline-block">SYSTEM STATUS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              <div className="flex justify-between w-48 sm:w-56"><span>CORE</span> <span className={simulatedProgress >= 37 ? 'text-neon-green' : 'text-white/40'}>{getStatus(37)}</span></div>
              <div className="flex justify-between w-48 sm:w-56"><span>NETWORK</span> <span className={simulatedProgress >= 54 ? 'text-neon-green' : 'text-white/40'}>{getStatus(54)}</span></div>
              <div className="flex justify-between w-48 sm:w-56"><span>PROJECTS</span> <span className={simulatedProgress >= 73 ? 'text-neon-green' : 'text-white/40'}>{getStatus(73)}</span></div>
              <div className="flex justify-between w-48 sm:w-56"><span>3D ENGINE</span> <span className={simulatedProgress >= 89 ? 'text-neon-green' : 'text-white/40'}>{getStatus(89)}</span></div>
              <div className="flex justify-between w-48 sm:w-56"><span>PORTFOLIO</span> <span className={simulatedProgress >= 100 ? 'text-neon-green' : 'text-white/40'}>{getStatus(100)}</span></div>
            </div>
          </div>

          {/* Enter Button */}
          <div className="mt-8 flex justify-center min-h-[3rem]">
            <button
              ref={buttonRef}
              onClick={handleEnter}
              disabled={!showEnter}
              className={`px-8 py-3 border border-[#39FF88]/50 text-neon-green bg-transparent hover:bg-[#39FF88]/10 hover:border-[#39FF88] hover:shadow-[0_0_20px_rgba(57,255,136,0.2)] hover:scale-105 transition-all duration-500 tracking-widest font-mono text-xs sm:text-sm uppercase focus:outline-none focus:ring-1 focus:ring-neon-green ${showEnter ? 'opacity-100 cursor-pointer translate-y-0' : 'opacity-0 cursor-default translate-y-4'}`}
            >
              [ ENTER SYSTEM ]
            </button>
          </div>

          {/* Tiny Technical Info */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-8 text-[8px] sm:text-[9px] text-white/20 flex flex-col gap-0.5">
            <span>BUILD: SRI-OS v1.0</span>
            <span>SESSION: PORTFOLIO</span>
            <span>STATUS: {systemReady ? 'READY' : 'BOOTING'}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
