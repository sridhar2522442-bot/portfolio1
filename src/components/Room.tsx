'use client';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '@/store/useStore';
import * as THREE from 'three';
import Hotspot from './Hotspot';
import { Text, Image } from '@react-three/drei';
import type { DeviceTier } from '@/lib/deviceDetect';
import { useFPSMonitor } from '@/lib/performanceMonitor';

interface RoomProps {
  deviceTier: DeviceTier;
  onTierChange: (tier: DeviceTier) => void;
}

// Clock uses a ref-mutation approach to avoid React re-renders inside R3F
function DigitalClockText() {
  const textRef = useRef<any>(null);

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const update = () => {
      if (textRef.current) textRef.current.text = fmt();
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Text ref={textRef} position={[0, 0, 0.2]} fontSize={0.5} color="#4fd8ff" material-toneMapped={false}>
      {''}
    </Text>
  );
}

export default function Room({ deviceTier, onTierChange }: RoomProps) {
  const { hasEntered, timeMode, cycleTimeMode, isSongPlaying, toggleSong } = useStore();
  const [hoveredLamp, setHoveredLamp] = useState(false);
  const [hoveredCPU, setHoveredCPU] = useState(false);
  const [activeMode, setActiveMode] = useState<'DAY'|'SUNSET'|'NIGHT'>('DAY');

  // Lazy audio: only create when user clicks PC
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const getAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/interstellaraudio.mp4');
      audioRef.current.loop = true;
    }
    return audioRef.current;
  }, []);

  // Pause/resume on isSongPlaying change
  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;
    if (isSongPlaying) {
      audio.play().catch(e => console.warn('Audio blocked:', e));
    } else {
      audio.pause();
    }
  }, [isSongPlaying, getAudio]);

  // Pause when tab is hidden (battery/thermal optimization)
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) audio.pause();
      else if (isSongPlaying) audio.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isSongPlaying]);

  // Time mode
  useEffect(() => {
    const update = () => {
      if (timeMode !== 'AUTO') { setActiveMode(timeMode as 'DAY'|'SUNSET'|'NIGHT'); return; }
      const h = new Date().getHours();
      if (h >= 6 && h < 18) setActiveMode('DAY');
      else if (h >= 18 && h < 20) setActiveMode('SUNSET');
      else setActiveMode('NIGHT');
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [timeMode]);

  // Cursor for interactive objects
  useEffect(() => {
    document.body.style.cursor = (hoveredLamp || hoveredCPU) ? 'pointer' : 'auto';
  }, [hoveredLamp, hoveredCPU]);

  const targets = useMemo(() => {
    switch (activeMode) {
      case 'DAY': return {
        ambientIntensity: 1.2, sunIntensity: 4.0, sunColor: new THREE.Color('#ffffff'),
        lampIntensity: 0, lampColor: new THREE.Color('#ffffff'),
        monitorIntensity: 1, rgbIntensity: 0.5, skyColor: new THREE.Color('#66aaff'),
      };
      case 'SUNSET': return {
        ambientIntensity: 0.6, sunIntensity: 3.0, sunColor: new THREE.Color('#ff8c42'),
        lampIntensity: 3.0, lampColor: new THREE.Color('#ffb347'),
        monitorIntensity: 2.0, rgbIntensity: 1.5, skyColor: new THREE.Color('#ff7b54'),
      };
      case 'NIGHT': default: return {
        ambientIntensity: 0.1, sunIntensity: 0.5, sunColor: new THREE.Color('#445588'),
        lampIntensity: 5.0, lampColor: new THREE.Color('#ffb347'),
        monitorIntensity: 3.5, rgbIntensity: 2.5, skyColor: new THREE.Color('#080812'),
      };
    }
  }, [activeMode]);

  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const floorLampRef = useRef<THREE.SpotLight>(null);
  const monitorGlowRef = useRef<any>(null);
  const pcRgbRef = useRef<THREE.PointLight>(null);
  const skyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const bulbMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const skyColorRef = useRef(new THREE.Color('#080812'));

  // FPS-based adaptive quality (runs inside the canvas)
  useFPSMonitor(deviceTier, onTierChange);

  // Frame throttle counter for low/mid
  const frameCount = useRef(0);

  useFrame((_, delta) => {
    frameCount.current++;
    // Throttle on mid: every 2nd frame; low: every 3rd frame
    if (deviceTier === 'mid' && frameCount.current % 2 !== 0) return;
    if (deviceTier === 'low' && frameCount.current % 3 !== 0) return;

    const t = Math.min(delta * 1.5, 1);
    if (ambientLightRef.current)
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, hasEntered ? targets.ambientIntensity : 0.02, t);
    if (sunLightRef.current) {
      sunLightRef.current.intensity = THREE.MathUtils.lerp(sunLightRef.current.intensity, hasEntered ? targets.sunIntensity : 0, t);
      sunLightRef.current.color.lerp(targets.sunColor, t);
    }
    if (floorLampRef.current) {
      floorLampRef.current.intensity = THREE.MathUtils.lerp(floorLampRef.current.intensity, hasEntered ? targets.lampIntensity : 0, t);
      floorLampRef.current.color.lerp(targets.lampColor, t);
    }
    // Skip RectAreaLight on mid/low (replaced with pointLight)
    if (deviceTier === 'high' && monitorGlowRef.current)
      monitorGlowRef.current.intensity = THREE.MathUtils.lerp(monitorGlowRef.current.intensity, hasEntered ? targets.monitorIntensity : 0, t);
    if (pcRgbRef.current)
      pcRgbRef.current.intensity = THREE.MathUtils.lerp(pcRgbRef.current.intensity, hasEntered ? targets.rgbIntensity : 0, t);
    if (bulbMatRef.current) {
      const targetBulbColor = targets.lampIntensity > 0 ? targets.lampColor : new THREE.Color('#333333');
      bulbMatRef.current.color.lerp(targetBulbColor, t);
    }
    skyColorRef.current.lerp(targets.skyColor, t);
    if (skyMatRef.current) skyMatRef.current.color.copy(skyColorRef.current);
  });

  // Determine cast/receive shadow
  const useShadows = deviceTier === 'high';
  // Wheel segment count (reduce on mobile)
  const wheelSegs = deviceTier === 'low' ? 8 : 16;
  // Number of chair star-legs (reduce on low)
  const starLegs = deviceTier === 'low' ? 4 : 5;

  return (
    <group position={[0, -2, 0]}>
      {/* Lighting Rig */}
      <ambientLight ref={ambientLightRef} intensity={0.02} color="#ffffff" />

      <directionalLight
        ref={sunLightRef}
        position={[10, 8, 2]}
        intensity={0}
        color="#ffffff"
        castShadow={useShadows}
        shadow-mapSize-width={useShadows ? 1024 : 512}
        shadow-mapSize-height={useShadows ? 1024 : 512}
      />

      {/* Floor Lamp — skip shadow on mid/low */}
      <spotLight
        ref={floorLampRef}
        position={[-8, 6, 2]}
        angle={1.2}
        penumbra={1}
        intensity={0}
        color="#ffffff"
        castShadow={useShadows}
      />

      {/* Monitor Glow — RectAreaLight only on high; point light on mid */}
      {deviceTier === 'high' ? (
        <rectAreaLight ref={monitorGlowRef} width={4} height={2} color="#39ff88" intensity={0} position={[0, 3, -1.5]} lookAt={[0, 3, 0] as any} />
      ) : (
        <pointLight ref={monitorGlowRef} position={[0, 3, -1.2]} intensity={0} color="#39ff88" distance={6} />
      )}

      {/* PC Case RGB Glow */}
      <pointLight ref={pcRgbRef} position={[4, 1.5, -2]} intensity={0} color="#39ff88" distance={8} />

      {/* Room Geometry — only floor and back wall receive shadow */}
      <mesh receiveShadow={useShadows} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#16161c" roughness={0.8} />
      </mesh>

      <mesh receiveShadow={useShadows} position={[0, 6, -10]}>
        <boxGeometry args={[25, 12, 0.5]} />
        <meshStandardMaterial color="#121216" roughness={0.9} />
      </mesh>

      <mesh receiveShadow={useShadows} position={[-10, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[25, 12, 0.5]} />
        <meshStandardMaterial color="#121216" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.01, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>

      {/* Desk */}
      <group position={[0, 0, -2]}>
        <mesh castShadow={useShadows} receiveShadow={useShadows} position={[0, 2.5, 0]}>
          <boxGeometry args={[9, 0.2, 3]} />
          <meshStandardMaterial color="#1a120d" roughness={0.8} />
        </mesh>
        <mesh castShadow={useShadows} position={[-4.3, 1.25, -1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow={useShadows} position={[4.3, 1.25, -1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow={useShadows} position={[-4.3, 1.25, 1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow={useShadows} position={[4.3, 1.25, 1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow={useShadows} position={[3.5, 1.25, 0]}>
          <boxGeometry args={[1.5, 2.3, 2.8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Chair — reduced complexity on low-end */}
      <group position={[0, 0, 1.5]} rotation={[0, -0.3, 0]}>
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.2, wheelSegs]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
          </mesh>
          {Array.from({ length: starLegs }, (_, i) => {
            const angle = (i * Math.PI * 2) / starLegs;
            return (
              <group key={i} rotation={[0, angle, 0]}>
                <mesh position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.08, 0.05, 1.4, 8]} />
                  <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
                </mesh>
                {deviceTier !== 'low' && (
                  <mesh position={[0, -0.05, 1.3]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshStandardMaterial color="#050505" roughness={0.9} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>

        <mesh castShadow={useShadows} position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.0, wheelSegs]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.6, 0.2, 0.6]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh castShadow={useShadows} position={[0, 1.3, 0]}><boxGeometry args={[2.0, 0.3, 2.0]} /><meshStandardMaterial color="#1a1a24" roughness={0.8} /></mesh>

        {/* Armrests — skip on low */}
        {deviceTier !== 'low' && (
          <>
            <group position={[-1.1, 1.4, 0]}>
              <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.1, 0.8, 0.3]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh position={[0, 0.85, 0.2]}><boxGeometry args={[0.25, 0.1, 1.0]} /><meshStandardMaterial color="#15151c" roughness={0.9} /></mesh>
            </group>
            <group position={[1.1, 1.4, 0]}>
              <mesh position={[0, 0.4, 0]}><boxGeometry args={[0.1, 0.8, 0.3]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh position={[0, 0.85, 0.2]}><boxGeometry args={[0.25, 0.1, 1.0]} /><meshStandardMaterial color="#15151c" roughness={0.9} /></mesh>
            </group>
          </>
        )}

        <group position={[0, 1.4, 0.8]} rotation={[-0.15, 0, 0]}>
          <mesh castShadow={useShadows} position={[0, 0.7, 0]}><boxGeometry args={[1.8, 1.2, 0.25]} /><meshStandardMaterial color="#1a1a24" roughness={0.8} /></mesh>
          <mesh castShadow={useShadows} position={[0, 1.9, -0.05]}><boxGeometry args={[1.6, 1.4, 0.25]} /><meshStandardMaterial color="#1a1a24" roughness={0.8} /></mesh>
          <mesh position={[0, 2.9, -0.05]}><boxGeometry args={[1.0, 0.5, 0.25]} /><meshStandardMaterial color="#15151c" roughness={0.9} /></mesh>
        </group>
      </group>

      {/* PC Tower */}
      <group
        position={[4.5, 1.2, -1.5]}
        onClick={(e) => { e.stopPropagation(); toggleSong(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredCPU(true); }}
        onPointerOut={() => setHoveredCPU(false)}
      >
        <mesh castShadow={useShadows}><boxGeometry args={[1.2, 2.4, 2.5]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh position={[0, 0.3, 1.26]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color={isSongPlaying ? "#ff3366" : "#39ff88"} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.7, 1.26]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color={isSongPlaying ? "#4fd8ff" : "#39ff88"} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Door */}
      <group position={[-9.7, 3.5, 6]}>
        <mesh castShadow={useShadows} rotation={[0, Math.PI/2, 0]}>
          <boxGeometry args={[4, 7, 0.1]} />
          <meshStandardMaterial color="#15100c" />
        </mesh>
        <Text position={[0.1, 1, 0]} rotation={[0, Math.PI/2, 0]} fontSize={0.4} color="#39ff88" outlineWidth={0.01} outlineColor="#39ff88" material-toneMapped={false} anchorX="center" anchorY="middle">
          ENTER{'\n'}ROOM
        </Text>
      </group>

      {/* Floor Lamp */}
      <group
        position={[-8.5, 0, 2]}
        onClick={(e) => { e.stopPropagation(); cycleTimeMode(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredLamp(true); }}
        onPointerOut={() => setHoveredLamp(false)}
      >
        <mesh castShadow={useShadows} position={[0, 2, 0]}><cylinderGeometry args={[0.05, 0.05, 4]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh castShadow={useShadows} position={[0, 4.2, 0]}><cylinderGeometry args={[0.4, 0.6, 0.8, wheelSegs, 1, true]} /><meshStandardMaterial color="#eee" side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 4.2, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial ref={bulbMatRef} color="#333333" />
        </mesh>
        <Text position={[0, 5, 0]} fontSize={0.2} color="#ffffff" material-toneMapped={false}>
          MODE: {timeMode}
        </Text>
      </group>

      {/* Frames */}
      <group position={[-9.7, 5, -2]} rotation={[0, Math.PI/2, 0]}>
        <mesh><boxGeometry args={[3, 4, 0.1]} /><meshStandardMaterial color="#050505" /></mesh>
        <Text position={[0, 1.2, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">DISCIPLINE</Text>
        <Text position={[0, 0.4, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">FOCUS</Text>
        <Text position={[0, -0.4, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">CONSISTENCY</Text>
        <Text position={[0, -1.2, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">SUCCESS</Text>
      </group>

      {/* Batman Logo */}
      <group position={[0, 4.8, -9.7]}>
        <Image url="/batman_logo.png" scale={[5, 2.8]} transparent toneMapped={false} />
      </group>

      {/* Clock */}
      <group position={[0, 7, -9.7]}>
        <mesh><boxGeometry args={[3, 1, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <DigitalClockText />
      </group>

      {/* Neon Sign */}
      <group position={[6, 6, -9.7]}>
        <Text position={[0, 1.5, 0]} fontSize={0.7} color="#ffffff" material-toneMapped={false}>Code</Text>
        <Text position={[0, 0.5, 0]} fontSize={0.7} color="#ffffff" material-toneMapped={false}>Eat</Text>
        <Text position={[0, -0.5, 0]} fontSize={0.7} color="#ffffff" material-toneMapped={false}>Sleep</Text>
        <Text position={[0, -1.5, 0]} fontSize={0.7} color="#39ff88" material-toneMapped={false}>Repeat</Text>
      </group>

      {/* HOTSPOTS */}

      {/* Monitor (About Me) */}
      <Hotspot id="about" label="MONITOR — About Me" position={[0, 3.2, -2.5]} cameraTarget={[0, 3.2, -2.5]} cameraPosition={[0, 3.2, -1.8]} isFullscreenAction={true}>
        <mesh castShadow={useShadows}><boxGeometry args={[4, 2.2, 0.2]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0, 0.11]}><planeGeometry args={[3.8, 2]} /><meshBasicMaterial color="#111" /></mesh>
        {activeMode === 'NIGHT' ? (
          <>
            <Text position={[-1.7, 0.7, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">{`> SYSTEM ONLINE`}</Text>
            <Text position={[-1.7, 0.35, 0.12]} fontSize={0.35} color="#ffffff" material-toneMapped={false} anchorX="left">{`> DEVELOPER MODE`}</Text>
            <Text position={[-1.7, -0.15, 0.12]} fontSize={0.18} color="#aaaaaa" material-toneMapped={false} anchorX="left">STATUS: READY</Text>
            <Text position={[-1.7, -0.6, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">_</Text>
          </>
        ) : (
          <>
            <Text position={[-1.7, 0.7, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">Hello, I'm</Text>
            <Text position={[-1.7, 0.35, 0.12]} fontSize={0.35} color="#ffffff" material-toneMapped={false} anchorX="left">S.SRIDHAR_</Text>
            <Text position={[-1.7, -0.15, 0.12]} fontSize={0.18} color="#aaaaaa" material-toneMapped={false} anchorX="left">IT Student | Developer | Builder</Text>
            <Text position={[-1.7, -0.6, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">{`>_`}</Text>
          </>
        )}
        <mesh castShadow={useShadows} position={[0, -0.8, -0.2]}><cylinderGeometry args={[0.1, 0.4, 0.5]} /><meshStandardMaterial color="#111" /></mesh>
      </Hotspot>

      {/* Keyboard (Skills) */}
      <Hotspot id="skills" label="KEYBOARD — Skills" position={[-0.5, 2.65, -1.2]} cameraTarget={[-0.5, 2.65, -1.2]} cameraPosition={[-0.5, 4, 0.5]}>
        <mesh castShadow={useShadows}><boxGeometry args={[2.2, 0.1, 0.7]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, -0.04, 0]}><boxGeometry args={[2.22, 0.1, 0.72]} /><meshBasicMaterial color="#4fd8ff" transparent opacity={0.3} /></mesh>
      </Hotspot>

      {/* Mouse (Projects) */}
      <Hotspot id="projects" label="MOUSE — Projects" position={[1.5, 2.65, -1.2]} cameraTarget={[1.5, 2.65, -1.2]} cameraPosition={[1.5, 4, 0.5]}>
        <mesh castShadow={useShadows}><boxGeometry args={[0.25, 0.1, 0.4]} /><meshStandardMaterial color="#ffffff" roughness={0.3} /></mesh>
        <mesh position={[0, 0, 0.1]}><sphereGeometry args={[0.02]} /><meshBasicMaterial color="#4fd8ff" /></mesh>
      </Hotspot>

      {/* Phone (Contact) */}
      <Hotspot id="contact" label="PHONE — Contact" position={[-2.5, 2.65, -1.2]} cameraTarget={[-2.5, 2.65, -1.2]} cameraPosition={[-2.5, 3.5, 0]}>
        <mesh castShadow={useShadows} rotation={[-Math.PI / 4, 0.2, 0]}><boxGeometry args={[0.4, 0.8, 0.05]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[-0.01, 0.02, 0.026]} rotation={[-Math.PI / 4, 0.2, 0]}><planeGeometry args={[0.36, 0.76]} /><meshBasicMaterial color="#050505" /></mesh>
      </Hotspot>

      {/* Bookshelf (Education) — reduced books on mobile */}
      <Hotspot id="education" label="BOOKSHELF — Education" position={[-7, 3.5, -8]} cameraTarget={[-7, 3.5, -8]} cameraPosition={[-7, 4.5, -3]}>
        <mesh castShadow={useShadows}><boxGeometry args={[4, 7, 1.2]} /><meshStandardMaterial color="#2c1e13" roughness={0.9} /></mesh>
        <mesh position={[0, 2, 0.61]}><boxGeometry args={[3.8, 0.1, 1.1]} /><meshStandardMaterial color="#4a3b2c" /></mesh>
        <mesh position={[0, 0, 0.61]}><boxGeometry args={[3.8, 0.1, 1.1]} /><meshStandardMaterial color="#4a3b2c" /></mesh>
        <mesh position={[0, -2, 0.61]}><boxGeometry args={[3.8, 0.1, 1.1]} /><meshStandardMaterial color="#4a3b2c" /></mesh>
        {/* Key books on all tiers */}
        <mesh position={[-1.2, 2.5, 0.6]}><boxGeometry args={[0.2, 0.9, 0.7]} /><meshStandardMaterial color="#b22222" /></mesh>
        <mesh position={[-0.6, 2.6, 0.6]}><boxGeometry args={[0.25, 1.1, 0.75]} /><meshStandardMaterial color="#4169e1" /></mesh>
        <mesh position={[1.2, 0.6, 0.6]}><boxGeometry args={[0.3, 1.1, 0.8]} /><meshStandardMaterial color="#8b0000" /></mesh>
        {/* Extra books only on high/mid */}
        {deviceTier !== 'low' && (
          <>
            <mesh position={[-0.9, 2.45, 0.6]}><boxGeometry args={[0.15, 0.8, 0.7]} /><meshStandardMaterial color="#2e8b57" /></mesh>
            <mesh position={[-0.3, 2.5, 0.6]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.15, 0.9, 0.7]} /><meshStandardMaterial color="#daa520" /></mesh>
            <mesh position={[0.9, 0.5, 0.6]}><boxGeometry args={[0.2, 0.9, 0.8]} /><meshStandardMaterial color="#4682b4" /></mesh>
            <mesh position={[0.6, 0.55, 0.6]}><boxGeometry args={[0.2, 1.0, 0.7]} /><meshStandardMaterial color="#800080" /></mesh>
            <mesh position={[0.3, 0.45, 0.6]}><boxGeometry args={[0.15, 0.8, 0.75]} /><meshStandardMaterial color="#556b2f" /></mesh>
            <mesh position={[-1.4, -1.8, 0.6]}><boxGeometry args={[1.0, 0.2, 0.8]} /><meshStandardMaterial color="#cd853f" /></mesh>
            <mesh position={[-1.4, -1.55, 0.6]}><boxGeometry args={[0.9, 0.2, 0.75]} /><meshStandardMaterial color="#708090" /></mesh>
            <mesh position={[-1.4, -1.35, 0.6]}><boxGeometry args={[0.9, 0.15, 0.75]} /><meshStandardMaterial color="#fffafa" /></mesh>
          </>
        )}
      </Hotspot>

      {/* Headphones (Interests) — simplified on low */}
      <Hotspot id="interests" label="HEADPHONES — Interests" position={[3.5, 3.5, -2]} cameraTarget={[3.5, 3.5, -2]} cameraPosition={[3.5, 4, -0.5]}>
        <group rotation={[0, -Math.PI/6, 0]}>
          <group position={[0, -0.5, 0]}>
            <mesh castShadow={useShadows} position={[0, -0.55, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, wheelSegs]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh castShadow={useShadows} position={[0, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
              <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
          <group position={[0, 0.15, 0.05]}>
            <mesh castShadow={useShadows} position={[0, -0.05, 0]}>
              <torusGeometry args={[0.22, 0.04, 8, wheelSegs, Math.PI]} />
              <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Earcups */}
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.24, -0.15, 0]} rotation={[0, 0, side * 0.1]}>
                <mesh castShadow={useShadows} position={[side * 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.08, wheelSegs]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.4} />
                </mesh>
                {deviceTier !== 'low' && (
                  <mesh position={[-side * 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <torusGeometry args={[0.11, 0.05, 8, 16]} />
                    <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
                  </mesh>
                )}
              </group>
            ))}
          </group>
        </group>
      </Hotspot>

      {/* Coffee Cup (Hobbies) */}
      <Hotspot id="easter_egg" label="COFFEE CUP — Hobbies" position={[2.5, 2.7, -1.4]} cameraTarget={[2.5, 2.7, -1.4]} cameraPosition={[2.5, 3.5, -0.5]}>
        <mesh castShadow={useShadows}><cylinderGeometry args={[0.15, 0.12, 0.35]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.14, 0.14, 0.02]} /><meshBasicMaterial color="#301502" /></mesh>
      </Hotspot>
    </group>
  );
}
