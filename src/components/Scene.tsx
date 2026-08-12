'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';
import { Suspense } from 'react';
import Room from './Room';
import CameraController from './CameraController';

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [20, 20, 20], fov: 35 }}
      gl={{ antialias: false, toneMappingExposure: 1.2 }}
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
      />

      <CameraController />

      <Suspense fallback={null}>
        <Room />
        <Preload all />
      </Suspense>

      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.5} 
          luminanceSmoothing={0.9} 
          intensity={1.5} 
          mipmapBlur 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
}
