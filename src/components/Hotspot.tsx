'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, HotspotId } from '@/store/useStore';
import { gsap } from 'gsap';

interface HotspotProps {
  id: HotspotId;
  label: string;
  position: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  children: React.ReactNode;
  isFullscreenAction?: boolean;
}

export default function Hotspot({ id, label, position, cameraTarget, cameraPosition, children, isFullscreenAction }: HotspotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { activeHotspot, setActiveHotspot, hasEntered, setViewMode, deviceTier } = useStore();

  const isActive = activeHotspot === id;
  const isAnyActive = activeHotspot !== null;
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

  useEffect(() => {
    document.body.style.cursor = hovered && !isAnyActive ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered, isAnyActive]);

  // Hover lift — skip on touch devices (no hover state)
  useEffect(() => {
    if (!groupRef.current || isTouchDevice) return;
    gsap.to(groupRef.current.position, {
      y: hovered && !isAnyActive ? 0.3 : 0,
      duration: 0.4,
      ease: 'power2.out'
    });
  }, [hovered, isAnyActive, isTouchDevice]);

  const handleClick = (e: any) => {
    if (!hasEntered) return;
    e.stopPropagation();

    if (!isActive) {
      setActiveHotspot(id);

      if (isFullscreenAction) {
        setViewMode('transitioning');
        setTimeout(() => setViewMode('fullscreen-monitor'), 1100);
      }

      window.dispatchEvent(new CustomEvent('camera-move', {
        detail: {
          target: cameraTarget,
          position: cameraPosition,
          duration: 1.2,
          ease: 'power3.inOut',
          fov: isFullscreenAction ? 52 : undefined
        }
      }));
    }
  };

  // Hide labels on mobile by default. Show only when clicked (isActive).
  // On desktop, show on hover.
  const labelOpacity = isTouchDevice
    ? (isActive ? 'opacity-100' : 'opacity-0')
    : (hovered ? 'opacity-100' : 'opacity-0');

  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={handleClick}
    >
      <group ref={groupRef} position={[0, 0, 0]}>
        {children}
      </group>

      {/* Floating Label */}
      {hasEntered && (
        <Html position={[0, 1.5, 0]} center className={`pointer-events-none transition-opacity duration-300 ${labelOpacity}`}>
          <div className={`flex flex-col items-center gap-2 ${hovered || isActive ? 'scale-100' : 'scale-90'} transition-transform duration-300`}>
            <div className={`glass-panel px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap ${isFullscreenAction ? 'text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-[#d4af37]/40' : 'text-neon-green shadow-[0_0_15px_rgba(57,255,136,0.2)]'}`}>
              {label}
            </div>
            {/* Pulsing dot */}
            <div className="w-4 h-4 relative flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full animate-ping ${isFullscreenAction ? 'bg-[#d4af37]/40' : 'bg-neon-green/40'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isFullscreenAction ? 'bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,1)]' : 'bg-neon-green shadow-[0_0_10px_rgba(57,255,136,1)]'}`} />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
