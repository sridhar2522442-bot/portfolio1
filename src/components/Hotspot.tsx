'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
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


    </group>
  );
}
