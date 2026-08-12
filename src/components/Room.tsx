'use client';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '@/store/useStore';
import * as THREE from 'three';
import Hotspot from './Hotspot';
import { Text, Image } from '@react-three/drei';

function DigitalClockText() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text position={[0, 0, 0.2]} fontSize={0.5} color="#4fd8ff" material-toneMapped={false}>
      {time}
    </Text>
  );
}

export default function Room() {
  const { hasEntered, timeMode, cycleTimeMode, isSongPlaying, toggleSong } = useStore();
  const [hoveredLamp, setHoveredLamp] = useState(false);
  const [hoveredCPU, setHoveredCPU] = useState(false);
  
  const [activeMode, setActiveMode] = useState<'DAY'|'SUNSET'|'NIGHT'>('DAY');

  // Audio playback reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/interstellaraudio.mp4');
      audioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isSongPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback blocked by browser:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isSongPlaying]);

  // Update activeMode based on timeMode and real time
  useEffect(() => {
    const updateActiveMode = () => {
      if (timeMode !== 'AUTO') {
        setActiveMode(timeMode as 'DAY'|'SUNSET'|'NIGHT');
        return;
      }
      
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) {
        setActiveMode('DAY');
      } else if (hour >= 18 && hour < 20) {
        setActiveMode('SUNSET');
      } else {
        setActiveMode('NIGHT');
      }
    };
    
    updateActiveMode();
    const interval = setInterval(updateActiveMode, 60000);
    return () => clearInterval(interval);
  }, [timeMode]);

  // Toggle cursor when hovering interactive items
  useEffect(() => {
    document.body.style.cursor = (hoveredLamp || hoveredCPU) ? 'pointer' : 'auto';
  }, [hoveredLamp, hoveredCPU]);

  // Target values based on activeMode
  const targets = useMemo(() => {
    switch (activeMode) {
      case 'DAY':
        return {
          ambientIntensity: 1.2,
          sunIntensity: 4.0,
          sunColor: new THREE.Color('#ffffff'),
          lampIntensity: 0,
          lampColor: new THREE.Color('#ffffff'),
          monitorIntensity: 1,
          rgbIntensity: 0.5,
          skyColor: new THREE.Color('#66aaff'),
        };
      case 'SUNSET':
        return {
          ambientIntensity: 0.6,
          sunIntensity: 3.0,
          sunColor: new THREE.Color('#ff8c42'),
          lampIntensity: 3.0,
          lampColor: new THREE.Color('#ffb347'),
          monitorIntensity: 2.0,
          rgbIntensity: 1.5,
          skyColor: new THREE.Color('#ff7b54'),
        };
      case 'NIGHT':
      default:
        return {
          ambientIntensity: 0.1,
          sunIntensity: 0.5,
          sunColor: new THREE.Color('#445588'),
          lampIntensity: 5.0,
          lampColor: new THREE.Color('#ffb347'),
          monitorIntensity: 3.5,
          rgbIntensity: 2.5,
          skyColor: new THREE.Color('#080812'),
        };
    }
  }, [activeMode]);

  // Lighting & Environment Refs
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const floorLampRef = useRef<THREE.SpotLight>(null);
  const monitorGlowRef = useRef<any>(null); // RectAreaLight
  const pcRgbRef = useRef<THREE.PointLight>(null);
  const skyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const bulbMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const skyColorRef = useRef(new THREE.Color('#080812'));

  useFrame((state, delta) => {
    const t = Math.min(delta * 1.5, 1);
    
    if (ambientLightRef.current) ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, hasEntered ? targets.ambientIntensity : 0.02, t);
    if (sunLightRef.current) {
      sunLightRef.current.intensity = THREE.MathUtils.lerp(sunLightRef.current.intensity, hasEntered ? targets.sunIntensity : 0, t);
      sunLightRef.current.color.lerp(targets.sunColor, t);
    }
    if (floorLampRef.current) {
      floorLampRef.current.intensity = THREE.MathUtils.lerp(floorLampRef.current.intensity, hasEntered ? targets.lampIntensity : 0, t);
      floorLampRef.current.color.lerp(targets.lampColor, t);
    }
    if (monitorGlowRef.current) monitorGlowRef.current.intensity = THREE.MathUtils.lerp(monitorGlowRef.current.intensity, hasEntered ? targets.monitorIntensity : 0, t);
    if (pcRgbRef.current) pcRgbRef.current.intensity = THREE.MathUtils.lerp(pcRgbRef.current.intensity, hasEntered ? targets.rgbIntensity : 0, t);
    
    if (bulbMatRef.current) {
      const targetBulbColor = targets.lampIntensity > 0 ? targets.lampColor : new THREE.Color('#333333');
      bulbMatRef.current.color.lerp(targetBulbColor, t);
    }

    skyColorRef.current.lerp(targets.skyColor, t);
    if (skyMatRef.current) skyMatRef.current.color.copy(skyColorRef.current);
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Lighting Rig */}
      <ambientLight ref={ambientLightRef} intensity={0.02} color="#ffffff" />
      
      {/* Sun/Moon Light coming from the Window (Right Side) */}
      <directionalLight 
        ref={sunLightRef}
        position={[10, 8, 2]} 
        intensity={0} 
        color="#ffffff" 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Floor Lamp Light (Left Wall) */}
      <spotLight 
        ref={floorLampRef}
        position={[-8, 6, 2]} 
        angle={1.2} 
        penumbra={1} 
        intensity={0} 
        color="#ffffff" 
        castShadow 
      />

      {/* Monitor Glow */}
      <rectAreaLight ref={monitorGlowRef} width={4} height={2} color="#39ff88" intensity={0} position={[0, 3, -1.5]} lookAt={[0, 3, 0] as any} />

      {/* PC Case RGB Glow */}
      <pointLight ref={pcRgbRef} position={[4, 1.5, -2]} intensity={0} color="#39ff88" distance={8} />

      {/* Room Geometry */}
      {/* Floor */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#16161c" roughness={0.8} />
      </mesh>

      {/* Back Wall */}
      <mesh receiveShadow position={[0, 6, -10]}>
        <boxGeometry args={[25, 12, 0.5]} />
        <meshStandardMaterial color="#121216" roughness={0.9} />
      </mesh>

      {/* Left Wall */}
      <mesh receiveShadow position={[-10, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[25, 12, 0.5]} />
        <meshStandardMaterial color="#121216" roughness={0.9} />
      </mesh>

      {/* Right side is intentionally left open to the canvas background */}

      {/* Rug */}
      <mesh receiveShadow position={[0, 0.01, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#111" roughness={1} />
      </mesh>

      {/* Desk */}
      <group position={[0, 0, -2]}>
        <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
          <boxGeometry args={[9, 0.2, 3]} />
          <meshStandardMaterial color="#1a120d" roughness={0.8} />
        </mesh>
        <mesh castShadow receiveShadow position={[-4.3, 1.25, -1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow receiveShadow position={[4.3, 1.25, -1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow receiveShadow position={[-4.3, 1.25, 1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <mesh castShadow receiveShadow position={[4.3, 1.25, 1.3]}><boxGeometry args={[0.2, 2.5, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        
        {/* Drawers (Right side) */}
        <mesh castShadow receiveShadow position={[3.5, 1.25, 0]}>
          <boxGeometry args={[1.5, 2.3, 2.8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Realistic Office Chair */}
      <group position={[0, 0, 1.5]} rotation={[0, -0.3, 0]}>
        {/* Wheels & Star Base */}
        <group position={[0, 0.1, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            return (
              <group key={i} rotation={[0, angle, 0]}>
                {/* Leg */}
                <mesh castShadow receiveShadow position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.08, 0.05, 1.4, 8]} />
                  <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Wheel */}
                <mesh castShadow receiveShadow position={[0, -0.05, 1.3]}>
                  <sphereGeometry args={[0.1, 16, 16]} />
                  <meshStandardMaterial color="#050505" roughness={0.9} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Gas Lift / Main Pillar */}
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.0, 16]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Seat Base Mechanism */}
        <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
          <boxGeometry args={[0.6, 0.2, 0.6]} />
          <meshStandardMaterial color="#111" />
        </mesh>

        {/* Seat Cushion */}
        <mesh castShadow receiveShadow position={[0, 1.3, 0]}>
          <boxGeometry args={[2.0, 0.3, 2.0]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.8} />
        </mesh>

        {/* Armrests */}
        <group position={[-1.1, 1.4, 0]}>
          {/* Vertical Support */}
          <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 0.3]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Pad */}
          <mesh castShadow receiveShadow position={[0, 0.85, 0.2]}>
            <boxGeometry args={[0.25, 0.1, 1.0]} />
            <meshStandardMaterial color="#15151c" roughness={0.9} />
          </mesh>
        </group>
        
        <group position={[1.1, 1.4, 0]}>
          {/* Vertical Support */}
          <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 0.3]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          {/* Pad */}
          <mesh castShadow receiveShadow position={[0, 0.85, 0.2]}>
            <boxGeometry args={[0.25, 0.1, 1.0]} />
            <meshStandardMaterial color="#15151c" roughness={0.9} />
          </mesh>
        </group>

        {/* Backrest (Slightly tilted) */}
        <group position={[0, 1.4, 0.8]} rotation={[-0.15, 0, 0]}>
          {/* Lower Lumbar */}
          <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[1.8, 1.2, 0.25]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.8} />
          </mesh>
          {/* Upper Back */}
          <mesh castShadow receiveShadow position={[0, 1.9, -0.05]}>
            <boxGeometry args={[1.6, 1.4, 0.25]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.8} />
          </mesh>
          {/* Headrest */}
          <mesh castShadow receiveShadow position={[0, 2.9, -0.05]}>
            <boxGeometry args={[1.0, 0.5, 0.25]} />
            <meshStandardMaterial color="#15151c" roughness={0.9} />
          </mesh>
          {/* Spine support */}
          <mesh castShadow receiveShadow position={[0, 1.5, 0.2]}>
            <boxGeometry args={[0.3, 2.8, 0.1]} />
            <meshStandardMaterial color="#050505" />
          </mesh>
        </group>
      </group>

      {/* PC Tower */}
      <group 
        position={[4.5, 1.2, -1.5]}
        onClick={(e) => { e.stopPropagation(); toggleSong(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredCPU(true); }}
        onPointerOut={(e) => { setHoveredCPU(false); }}
      >
        <mesh castShadow receiveShadow><boxGeometry args={[1.2, 2.4, 2.5]} /><meshStandardMaterial color="#050505" /></mesh>
        {/* PC Fans Glowing */}
        <mesh position={[0, 0.3, 1.26]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color={isSongPlaying ? "#ff3366" : "#39ff88"} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.7, 1.26]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color={isSongPlaying ? "#4fd8ff" : "#39ff88"} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Door (Left Wall) */}
      <group position={[-9.7, 3.5, 6]}>
        <mesh castShadow receiveShadow rotation={[0, Math.PI/2, 0]}>
          <boxGeometry args={[4, 7, 0.1]} />
          <meshStandardMaterial color="#15100c" />
        </mesh>
        {/* ENTER ROOM neon sign on door */}
        <Text position={[0.1, 1, 0]} rotation={[0, Math.PI/2, 0]} fontSize={0.4} color="#39ff88" outlineWidth={0.01} outlineColor="#39ff88" material-toneMapped={false} anchorX="center" anchorY="middle">
          ENTER{'\n'}ROOM
        </Text>
      </group>

      {/* Floor Lamp (Left Wall) */}
      <group 
        position={[-8.5, 0, 2]} 
        onClick={(e) => { e.stopPropagation(); cycleTimeMode(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredLamp(true); }}
        onPointerOut={(e) => { setHoveredLamp(false); }}
      >
        <mesh castShadow receiveShadow position={[0, 2, 0]}><cylinderGeometry args={[0.05, 0.05, 4]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh castShadow receiveShadow position={[0, 4.2, 0]}><cylinderGeometry args={[0.4, 0.6, 0.8]} openEnded /><meshStandardMaterial color="#eee" side={THREE.DoubleSide} /></mesh>
        {/* The bulb */}
        <mesh position={[0, 4.2, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial ref={bulbMatRef} color="#333333" />
        </mesh>
        {/* Lamp Control Status Text */}
        <Text position={[0, 5, 0]} fontSize={0.2} color="#ffffff" material-toneMapped={false}>
          MODE: {timeMode}
        </Text>
      </group>


      {/* Frames (Left Wall) */}
      <group position={[-9.7, 5, -2]} rotation={[0, Math.PI/2, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[3, 4, 0.1]} /><meshStandardMaterial color="#050505" /></mesh>
        <Text position={[0, 1.2, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">DISCIPLINE</Text>
        <Text position={[0, 0.4, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">FOCUS</Text>
        <Text position={[0, -0.4, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">CONSISTENCY</Text>
        <Text position={[0, -1.2, 0.1]} fontSize={0.3} color="#ffffff" anchorX="center">SUCCESS</Text>
      </group>

      {/* Batman Logo (Back Wall under Clock) */}
      <group position={[0, 4.8, -9.7]} rotation={[0, 0, 0]}>
        <Image url="/batman_logo.png" scale={[5, 2.8]} transparent toneMapped={false} />
      </group>

      {/* Clock (Back Wall) */}
      <group position={[0, 7, -9.7]}>
        <mesh castShadow receiveShadow><boxGeometry args={[3, 1, 0.2]} /><meshStandardMaterial color="#050505" /></mesh>
        <DigitalClockText />
      </group>

      {/* Neon Sign (Back Wall) */}
      <group position={[6, 6, -9.7]}>
        <Text position={[0, 1.5, 0]} fontSize={0.7} color="#ffffff" material-toneMapped={false}>Code</Text>
        <Text position={[0, 0.5, 0]} fontSize={0.7} color="#ffffff" material-toneMapped={false}>Eat</Text>
        <Text position={[0, -0.5, 0]} fontSize={0.7} color="#ffffff" material-toneMapped={false}>Sleep</Text>
        <Text position={[0, -1.5, 0]} fontSize={0.7} color="#39ff88" material-toneMapped={false}>Repeat</Text>
      </group>

      {/* ---------------- HOTSPOTS ---------------- */}

      {/* Monitor (About Me) */}
      <Hotspot 
        id="about" 
        label="MONITOR — Click to view" 
        position={[0, 3.2, -2.5]} 
        cameraTarget={[0, 3.2, -2.5]} 
        cameraPosition={[0, 3.2, -1.8]}
        isFullscreenAction={true}
      >
        <mesh castShadow receiveShadow><boxGeometry args={[4, 2.2, 0.2]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        {/* Screen */}
        <mesh position={[0, 0, 0.11]}><planeGeometry args={[3.8, 2]} /><meshBasicMaterial color="#111" /></mesh>
        
        {activeMode === 'NIGHT' ? (
          <>
            <Text position={[-1.7, 0.7, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">{'> SYSTEM ONLINE'}</Text>
            <Text position={[-1.7, 0.35, 0.12]} fontSize={0.35} color="#ffffff" material-toneMapped={false} anchorX="left">{'> DEVELOPER MODE'}</Text>
            <Text position={[-1.7, -0.15, 0.12]} fontSize={0.18} color="#aaaaaa" material-toneMapped={false} anchorX="left">STATUS: READY</Text>
            <Text position={[-1.7, -0.6, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">_</Text>
          </>
        ) : (
          <>
            <Text position={[-1.7, 0.7, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">Hello, I'm</Text>
            <Text position={[-1.7, 0.35, 0.12]} fontSize={0.35} color="#ffffff" material-toneMapped={false} anchorX="left">S.SRIDHAR_</Text>
            <Text position={[-1.7, -0.15, 0.12]} fontSize={0.18} color="#aaaaaa" material-toneMapped={false} anchorX="left">IT Student | Developer | Builder</Text>
            <Text position={[-1.7, -0.6, 0.12]} fontSize={0.2} color="#39ff88" material-toneMapped={false} anchorX="left">{'>_'}</Text>
          </>
        )}
        
        {/* Stand */}
        <mesh castShadow position={[0, -0.8, -0.2]}><cylinderGeometry args={[0.1, 0.4, 0.5]} /><meshStandardMaterial color="#111" /></mesh>
      </Hotspot>

      {/* Keyboard (Skills) */}
      <Hotspot id="skills" label="KEYBOARD — Skills" position={[-0.5, 2.65, -1.2]} cameraTarget={[-0.5, 2.65, -1.2]} cameraPosition={[-0.5, 4, 0.5]}>
        <mesh castShadow receiveShadow><boxGeometry args={[2.2, 0.1, 0.7]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[0, -0.04, 0]}><boxGeometry args={[2.22, 0.1, 0.72]} /><meshBasicMaterial color="#4fd8ff" transparent opacity={0.3} /></mesh>
      </Hotspot>

      {/* Mouse (Projects) */}
      <Hotspot id="projects" label="MOUSE — Projects" position={[1.5, 2.65, -1.2]} cameraTarget={[1.5, 2.65, -1.2]} cameraPosition={[1.5, 4, 0.5]}>
        <mesh castShadow receiveShadow><boxGeometry args={[0.25, 0.1, 0.4]} /><meshStandardMaterial color="#ffffff" roughness={0.3} /></mesh>
        <mesh position={[0, 0, 0.1]}><sphereGeometry args={[0.02]} /><meshBasicMaterial color="#4fd8ff" /></mesh>
      </Hotspot>

      {/* Phone (Contact) */}
      <Hotspot id="contact" label="PHONE — Contact" position={[-2.5, 2.65, -1.2]} cameraTarget={[-2.5, 2.65, -1.2]} cameraPosition={[-2.5, 3.5, 0]}>
        <mesh castShadow receiveShadow rotation={[-Math.PI / 4, 0.2, 0]}><boxGeometry args={[0.4, 0.8, 0.05]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[-0.01, 0.02, 0.026]} rotation={[-Math.PI / 4, 0.2, 0]}><planeGeometry args={[0.36, 0.76]} /><meshBasicMaterial color="#050505" /></mesh>
      </Hotspot>

      {/* Bookshelf (Education) */}
      <Hotspot id="education" label="BOOKSHELF — Education" position={[-7, 3.5, -8]} cameraTarget={[-7, 3.5, -8]} cameraPosition={[-7, 4.5, -3]}>
        <mesh castShadow receiveShadow><boxGeometry args={[4, 7, 1.2]} /><meshStandardMaterial color="#2c1e13" roughness={0.9} /></mesh>
        <mesh position={[0, 2, 0.61]}><boxGeometry args={[3.8, 0.1, 1.1]} /><meshStandardMaterial color="#4a3b2c" /></mesh>
        <mesh position={[0, 0, 0.61]}><boxGeometry args={[3.8, 0.1, 1.1]} /><meshStandardMaterial color="#4a3b2c" /></mesh>
        <mesh position={[0, -2, 0.61]}><boxGeometry args={[3.8, 0.1, 1.1]} /><meshStandardMaterial color="#4a3b2c" /></mesh>
        <mesh position={[-1.2, 2.5, 0.6]}><boxGeometry args={[0.2, 0.9, 0.7]} /><meshStandardMaterial color="#b22222" /></mesh>
        <mesh position={[-0.9, 2.45, 0.6]}><boxGeometry args={[0.15, 0.8, 0.7]} /><meshStandardMaterial color="#2e8b57" /></mesh>
        <mesh position={[-0.6, 2.6, 0.6]}><boxGeometry args={[0.25, 1.1, 0.75]} /><meshStandardMaterial color="#4169e1" /></mesh>
        <mesh position={[-0.3, 2.5, 0.6]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.15, 0.9, 0.7]} /><meshStandardMaterial color="#daa520" /></mesh>
        <mesh position={[1.2, 0.6, 0.6]}><boxGeometry args={[0.3, 1.1, 0.8]} /><meshStandardMaterial color="#8b0000" /></mesh>
        <mesh position={[0.9, 0.5, 0.6]}><boxGeometry args={[0.2, 0.9, 0.8]} /><meshStandardMaterial color="#4682b4" /></mesh>
        <mesh position={[0.6, 0.55, 0.6]}><boxGeometry args={[0.2, 1.0, 0.7]} /><meshStandardMaterial color="#800080" /></mesh>
        <mesh position={[0.3, 0.45, 0.6]}><boxGeometry args={[0.15, 0.8, 0.75]} /><meshStandardMaterial color="#556b2f" /></mesh>
        <mesh position={[-1.4, -1.8, 0.6]} rotation={[0, 0, 0]}><boxGeometry args={[1.0, 0.2, 0.8]} /><meshStandardMaterial color="#cd853f" /></mesh>
        <mesh position={[-1.4, -1.55, 0.6]} rotation={[0, 0, 0]}><boxGeometry args={[0.9, 0.2, 0.75]} /><meshStandardMaterial color="#708090" /></mesh>
        <mesh position={[-1.4, -1.35, 0.6]} rotation={[0, 0, 0]}><boxGeometry args={[0.9, 0.15, 0.75]} /><meshStandardMaterial color="#fffafa" /></mesh>
      </Hotspot>

      {/* Headphones (Interests) */}
      <Hotspot id="interests" label="HEADPHONES — Interests" position={[3.5, 3.5, -2]} cameraTarget={[3.5, 3.5, -2]} cameraPosition={[3.5, 4, -0.5]}>
        <group rotation={[0, -Math.PI/6, 0]}>
          {/* Stand */}
          <group position={[0, -0.5, 0]}>
            {/* Base */}
            <mesh castShadow receiveShadow position={[0, -0.55, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Pole */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.1, 16]} />
              <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Hanger Hook */}
            <mesh castShadow receiveShadow position={[0, 0.55, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.2, 16]} />
              <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>

          {/* Headphones */}
          <group position={[0, 0.15, 0.05]}>
            {/* Headband Cushion */}
            <mesh castShadow receiveShadow position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.22, 0.04, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#111" roughness={0.9} />
            </mesh>
            {/* Headband Outer Frame */}
            <mesh castShadow receiveShadow position={[0, -0.05, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.24, 0.02, 16, 32, Math.PI]} />
              <meshStandardMaterial color="#444" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Left Earcup */}
            <group position={[-0.24, -0.15, 0]} rotation={[0, 0, 0.1]}>
              {/* Outer Shell */}
              <mesh castShadow receiveShadow position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.15, 0.15, 0.08, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              {/* Inner Cushion */}
              <mesh castShadow receiveShadow position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.11, 0.05, 16, 32]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
              </mesh>
              {/* Speaker mesh inside */}
              <mesh castShadow receiveShadow position={[0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.11, 0.11, 0.01, 32]} />
                <meshStandardMaterial color="#111" roughness={1.0} />
              </mesh>
            </group>

            {/* Right Earcup */}
            <group position={[0.24, -0.15, 0]} rotation={[0, 0, -0.1]}>
              {/* Outer Shell */}
              <mesh castShadow receiveShadow position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.15, 0.15, 0.08, 32]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              {/* Inner Cushion */}
              <mesh castShadow receiveShadow position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.11, 0.05, 16, 32]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
              </mesh>
              {/* Speaker mesh inside */}
              <mesh castShadow receiveShadow position={[-0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.11, 0.11, 0.01, 32]} />
                <meshStandardMaterial color="#111" roughness={1.0} />
              </mesh>
            </group>
          </group>
        </group>
      </Hotspot>

      {/* Coffee Cup (Hobbies) */}
      <Hotspot id="easter_egg" label="COFFEE CUP — Hobbies & Code" position={[2.5, 2.7, -1.4]} cameraTarget={[2.5, 2.7, -1.4]} cameraPosition={[2.5, 3.5, -0.5]}>
        <mesh castShadow receiveShadow><cylinderGeometry args={[0.15, 0.12, 0.35]} /><meshStandardMaterial color="#ffffff" roughness={0.2} /></mesh>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.14, 0.14, 0.02]} /><meshBasicMaterial color="#301502" /></mesh>
      </Hotspot>

    </group>
  );
}
