'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Suspense, useCallback } from 'react';
import Room from './Room';
import CameraController from './CameraController';
import { useStore } from '@/store/useStore';
import { type DeviceTier } from '@/lib/deviceDetect';
import * as THREE from 'three';

// DPR caps per tier
const DPR_MAP: Record<DeviceTier, [number, number]> = {
  high: [1, 2],
  mid:  [1, 1.5],
  low:  [1, 1],
};

// Shadows only on high
const SHADOWS_MAP: Record<DeviceTier, boolean> = {
  high: true,
  mid:  false,
  low:  false,
};

export default function Scene() {
  const { deviceTier, setDeviceTier } = useStore();

  const handleTierChange = useCallback((tier: DeviceTier) => {
    setDeviceTier(tier);
  }, [setDeviceTier]);

  const showEffects = deviceTier !== 'low';
  const bloomIntensity = deviceTier === 'high' ? 1.5 : 0.6;

  return (
    <div
      className="w-full h-full"
      style={{ touchAction: 'none' }} // prevent page scroll on canvas touch
    >
      <Canvas
        shadows={SHADOWS_MAP[deviceTier]}
        camera={{ position: [20, 20, 20], fov: 35 }}
        gl={{
          antialias: deviceTier === 'high',
          toneMappingExposure: 1.2,
          powerPreference: deviceTier === 'low' ? 'low-power' : 'high-performance',
        }}
        dpr={DPR_MAP[deviceTier]}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        <color attach="background" args={['#0a0a0c']} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
          minAzimuthAngle={-Math.PI / 8}
          maxAzimuthAngle={Math.PI / 4}
          minDistance={10}
          maxDistance={25}
          enablePan={false}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        <CameraController />

        <Suspense fallback={null}>
          <Room deviceTier={deviceTier} onTierChange={handleTierChange} />
          <Preload all />
        </Suspense>

        {showEffects && (
          <EffectComposer>
            <Bloom
              luminanceThreshold={deviceTier === 'high' ? 0.5 : 0.7}
              luminanceSmoothing={0.9}
              intensity={bloomIntensity}
              mipmapBlur={deviceTier === 'high'}
            />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
