'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useStore } from '@/store/useStore';
import * as THREE from 'three';

// Desktop vs mobile default positions
function getDefaults(isMobile: boolean) {
  return {
    pos: isMobile ? [14, 14, 14] : [20, 20, 20],
    target: [0, 1, 0],
    fov: isMobile ? 50 : 45,
  };
}

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

export default function CameraController() {
  const { camera, controls } = useThree();
  const { activeHotspot, viewMode } = useStore();

  useEffect(() => {
    const handleMove = (e: any) => {
      const { target, position, duration, ease, fov } = e.detail;
      const animDuration = duration || 1.2;
      const animEase = ease || 'power3.inOut';

      gsap.to(camera.position, { x: position[0], y: position[1], z: position[2], duration: animDuration, ease: animEase });

      if (fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        gsap.to(camera as THREE.PerspectiveCamera, {
          fov,
          duration: animDuration,
          ease: animEase,
          onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix()
        });
      }

      if (controls) {
        gsap.to((controls as any).target, { x: target[0], y: target[1], z: target[2], duration: animDuration, ease: animEase });
      }
    };

    window.addEventListener('camera-move', handleMove);
    return () => window.removeEventListener('camera-move', handleMove);
  }, [camera, controls]);

  // Return to default when no hotspot active
  useEffect(() => {
    if (activeHotspot === null && viewMode === 'room' && controls) {
      const mobile = isMobile();
      const defaults = getDefaults(mobile);

      gsap.to(camera.position, { x: defaults.pos[0], y: defaults.pos[1], z: defaults.pos[2], duration: 1.2, ease: 'power3.out' });

      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        gsap.to(camera as THREE.PerspectiveCamera, {
          fov: defaults.fov,
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix()
        });
      }

      gsap.to((controls as any).target, { x: defaults.target[0], y: defaults.target[1], z: defaults.target[2], duration: 1.2, ease: 'power3.out' });
    }
  }, [activeHotspot, viewMode, camera, controls]);

  return null;
}
