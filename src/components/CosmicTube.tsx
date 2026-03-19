import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, Vector3 } from 'three';
import { Stars, Trail, Float } from '@react-three/drei';

interface CosmicTubeProps {
  activeCodons: any[];
  chaos: number;
  flow: number;
  trailLength: number;
  trailIntensity: number;
  density: number;
  pulsationSpeed: number;
  neurographicMode: boolean;
}

const Pulsar = ({ 
  codon, i, chaos, flow, trailLength, trailIntensity, 
  pulsationSpeed, neurographicMode
}: any) => {
  const meshRef = useRef<any>(null);
  const groupRef = useRef<Group>(null);
  const trailTargetRef = useRef<Group>(null);
  const trailRef = useRef<any>(null);
  const { x, y, z } = codon.coordinates;
  
  // Разночастотное биение
  const frequencies = useMemo(() => [
    1 + Math.random() * 2,
    2 + Math.random() * 3,
    0.5 + Math.random() * 1
  ], []);

  const cosmicColors = useMemo(() => [
    new Color(codon.visual.color_hex),
    new Color('#a855f7'), // Lilac
    new Color('#ef4444'), // Red
    new Color('#f97316'), // Orange
  ], [codon.visual.color_hex]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Движение по спирали/вортексу
    const angleOffset = time * flow * 0.3;
    const currentAngle = Math.atan2(y, x) + angleOffset;
    const radius = Math.sqrt(x * x + y * y);
    
    const vortexStrength = 1 / (radius + 0.1);
    const spiralAngle = currentAngle + time * vortexStrength * 0.2;
    
    // Плавная нейрографическая модуляция (более органическая)
    const neuroMod = neurographicMode 
      ? (1 + Math.sin(time * 0.4 + i * 0.2) * 0.5 + Math.cos(time * 0.3 + i * 0.3) * 0.4) * (1 + chaos * 1.5)
      : 1;
    
    const autoChaos = chaos * neuroMod;

    const nx = Math.sin(time * 0.6 + i * 0.5) * autoChaos * 2;
    const ny = Math.cos(time * 0.5 + i * 0.7) * autoChaos * 2;
    const nz = Math.sin(time * 0.4 + i * 0.3) * autoChaos * 2;

    const zOffset = Math.sin(time * 0.4 + radius) * 2.5;

    const targetX = Math.cos(spiralAngle) * radius + nx;
    const targetY = Math.sin(spiralAngle) * radius + ny;
    const targetZ = z + nz + zOffset;

    groupRef.current.position.set(targetX, targetY, targetZ);
    
    // Дребезжание для шлейфа (эффект частиц)
    if (trailTargetRef.current) {
      const jitter = autoChaos * 0.3;
      const jitterFreq = 15;
      trailTargetRef.current.position.set(
        Math.sin(time * jitterFreq + i) * jitter,
        Math.cos(time * jitterFreq * 1.1 + i) * jitter,
        Math.sin(time * jitterFreq * 0.9 + i) * jitter
      );
    }
    
    // Многочастотная пульсация
    const beat1 = Math.sin(time * frequencies[0] * pulsationSpeed + i);
    const beat2 = Math.sin(time * frequencies[1] * pulsationSpeed + i * 0.5);
    const beat3 = Math.cos(time * frequencies[2] * pulsationSpeed + i * 2);
    
    const s = (0.5 + (beat1 * 0.2 + beat2 * 0.1 + beat3 * 0.05)) * (1 + codon.visual.radius_level * 0.15);
    groupRef.current.scale.setScalar(s);

    // Динамическое изменение цвета (мерцание)
    if (meshRef.current) {
      const colorIdx = Math.floor((time + i) % cosmicColors.length);
      const targetColor = cosmicColors[colorIdx];
      meshRef.current.material.emissive.lerp(targetColor, 0.05);
      meshRef.current.material.emissiveIntensity = 5 + beat1 * 2;
      
      // Попытка обновить цвет шлейфа динамически через реф, если это возможно
      // Но Trail обычно берет цвет при инициализации. 
      // Мы можем попробовать менять цвет материала шлейфа напрямую, если найдем его.
    }
  });

  return (
    <group ref={groupRef}>
      <Trail
        width={1.2 * trailIntensity}
        length={40 * trailLength}
        color={new Color(codon.visual.color_hex)} 
        attenuation={(t) => t * t}
      >
        <group ref={trailTargetRef} />
      </Trail>

      {/* Центральное ядро */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          emissive={codon.visual.color_hex} 
          emissiveIntensity={6} 
          toneMapped={false} 
        />
      </mesh>
      
      {/* Энергетическое облако (шум) */}
        <mesh scale={[1.5, 1.5, 1.5]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial 
            color={codon.visual.color_hex}
            transparent 
            opacity={0.2} 
            wireframe
          />
        </mesh>

        {/* Дополнительные искры для эффекта "сгустка" */}
        {[...Array(3)].map((_, j) => (
          <Float key={j} speed={2} rotationIntensity={2} floatIntensity={1}>
            <mesh position={[Math.sin(j) * 0.3, Math.cos(j) * 0.3, 0]}>
              <sphereGeometry args={[0.05, 4, 4]} />
              <meshBasicMaterial color={cosmicColors[j % cosmicColors.length]} />
            </mesh>
          </Float>
        ))}
      </group>
  );
};

export const CosmicTube: React.FC<CosmicTubeProps> = ({ 
  activeCodons, 
  chaos, 
  flow, 
  trailLength, 
  trailIntensity,
  density,
  pulsationSpeed,
  neurographicMode
}) => {
  const groupRef = useRef<Group>(null);

  // Умножаем количество пульсаров на плотность
  const multipliedCodons = useMemo(() => {
    const result = [];
    for (let d = 0; d < density; d++) {
      activeCodons.forEach((codon, i) => {
        result.push({
          ...codon,
          // Добавляем небольшое смещение для каждого дубликата
          coordinates: {
            x: codon.coordinates.x + (Math.random() - 0.5) * 2,
            y: codon.coordinates.y + (Math.random() - 0.5) * 2,
            z: codon.coordinates.z + (Math.random() - 0.5) * 2,
          },
          uniqueId: `${codon.index}-${d}-${i}`
        });
      });
    }
    return result;
  }, [activeCodons, density]);

  useFrame((state) => {
    if (groupRef.current) {
      // Медленное вращение всей системы для 3D глубины
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={15000} factor={6} saturation={1} fade speed={1} />
      
      {/* Космическая пыль / Фоновое свечение */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, 0.05, 16, 100]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.05} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0.5, 0]}>
        <torusGeometry args={[12, 0.02, 16, 100]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.03} />
      </mesh>

      {/* Пульсары с шлейфами */}
      {multipliedCodons.map((codon, i) => (
        <Pulsar 
          key={codon.uniqueId} 
          codon={codon} 
          i={i} 
          chaos={chaos} 
          flow={flow} 
          trailLength={trailLength}
          trailIntensity={trailIntensity}
          pulsationSpeed={pulsationSpeed}
          neurographicMode={neurographicMode}
        />
      ))}
      
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#10b981" />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <fog attach="fog" args={['#000000', 10, 60]} />
    </group>
  );
};
