'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useStore } from '@/store/useStore';

// Default isometric view matching the specs
const DEFAULT_CAMERA_POS = [20, 20, 20];
const DEFAULT_TARGET_POS = [0, 1, 0];

export default function CameraController() {
  const { camera, controls } = useThree();
  const { activeHotspot, viewMode } = useStore();

  useEffect(() => {
    const handleMove = (e: any) => {
      const { target, position, duration, ease, fov } = e.detail;
      const animDuration = duration || 1.2;
      const animEase = ease || 'power3.inOut';

      // Animate Camera Position
      gsap.to(camera.position, {
        x: position[0],
        y: position[1],
        z: position[2],
        duration: animDuration,
        ease: animEase
      });

      // Animate FOV if provided
      if (fov && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        gsap.to(camera as THREE.PerspectiveCamera, {
          fov: fov,
          duration: animDuration,
          ease: animEase,
          onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix()
        });
      }

      // Animate OrbitControls Target (if controls exist)
      if (controls) {
        gsap.to((controls as any).target, {
          x: target[0],
          y: target[1],
          z: target[2],
          duration: animDuration,
          ease: animEase
        });
      }
    };

    window.addEventListener('camera-move', handleMove);
    return () => window.removeEventListener('camera-move', handleMove);
  }, [camera, controls]);

  // Return to default position when activeHotspot is null and viewMode is room
  useEffect(() => {
    if (activeHotspot === null && viewMode === 'room' && controls) {
      gsap.to(camera.position, {
        x: DEFAULT_CAMERA_POS[0],
        y: DEFAULT_CAMERA_POS[1],
        z: DEFAULT_CAMERA_POS[2],
        duration: 1.2,
        ease: 'power3.out'
      });

      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
         gsap.to(camera as THREE.PerspectiveCamera, {
           fov: 45, // default R3F FOV, or whatever your default is
           duration: 1.2,
           ease: 'power3.out',
           onUpdate: () => (camera as THREE.PerspectiveCamera).updateProjectionMatrix()
         });
      }

      gsap.to((controls as any).target, {
        x: DEFAULT_TARGET_POS[0],
        y: DEFAULT_TARGET_POS[1],
        z: DEFAULT_TARGET_POS[2],
        duration: 1.2,
        ease: 'power3.out'
      });
    }
  }, [activeHotspot, viewMode, camera, controls]);

  return null;
}
