import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface CameraCubeProps {
  onViewChange: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

const CubeGeometry = ({ onViewChange }: { onViewChange: (position: THREE.Vector3, target: THREE.Vector3) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);

  // Camera positions for each face
  const cameraPositions = {
    front: { position: new THREE.Vector3(0, 0, 5), target: new THREE.Vector3(0, 0, 0) },
    back: { position: new THREE.Vector3(0, 0, -5), target: new THREE.Vector3(0, 0, 0) },
    right: { position: new THREE.Vector3(5, 0, 0), target: new THREE.Vector3(0, 0, 0) },
    left: { position: new THREE.Vector3(-5, 0, 0), target: new THREE.Vector3(0, 0, 0) },
    top: { position: new THREE.Vector3(0, 5, 0), target: new THREE.Vector3(0, 0, 0) },
    bottom: { position: new THREE.Vector3(0, -5, 0), target: new THREE.Vector3(0, 0, 0) },
  };

  const handleFaceClick = (face: string) => {
    const { position, target } = cameraPositions[face as keyof typeof cameraPositions];
    onViewChange(position, target);
  };

  const faces = [
    { name: 'front', position: [0, 0, 0.51], rotation: [0, 0, 0], label: 'F' },
    { name: 'back', position: [0, 0, -0.51], rotation: [0, Math.PI, 0], label: 'B' },
    { name: 'right', position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0], label: 'R' },
    { name: 'left', position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0], label: 'L' },
    { name: 'top', position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0], label: 'T' },
    { name: 'bottom', position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0], label: 'B' },
  ];

  return (
    <group>
      {/* Main cube wireframe */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#444" wireframe />
      </mesh>

      {/* Interactive faces */}
      {faces.map(({ name, position, rotation, label }) => (
        <group key={name}>
          <mesh
            position={position as [number, number, number]}
            rotation={rotation as [number, number, number]}
            onClick={(e) => {
              e.stopPropagation();
              handleFaceClick(name);
            }}
            onPointerEnter={() => setHoveredFace(name)}
            onPointerLeave={() => setHoveredFace(null)}
          >
            <planeGeometry args={[0.8, 0.8]} />
            <meshBasicMaterial
              color={hoveredFace === name ? '#4a90e2' : '#2a2a2a'}
              transparent
              opacity={hoveredFace === name ? 0.8 : 0.6}
            />
          </mesh>
          <Text
            position={[position[0] * 1.1, position[1] * 1.1, position[2] * 1.1]}
            rotation={rotation as [number, number, number]}
            fontSize={0.3}
            color={hoveredFace === name ? '#ffffff' : '#cccccc'}
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        </group>
      ))}

      {/* Corner indicators for isometric views */}
      {[
        { position: [0.7, 0.7, 0.7], name: 'iso1' },
        { position: [-0.7, 0.7, 0.7], name: 'iso2' },
        { position: [0.7, -0.7, 0.7], name: 'iso3' },
        { position: [-0.7, -0.7, 0.7], name: 'iso4' },
      ].map(({ position, name }) => (
        <mesh
          key={name}
          position={position as [number, number, number]}
          onClick={(e) => {
            e.stopPropagation();
            onViewChange(
              new THREE.Vector3(position[0] * 7, position[1] * 7, position[2] * 7),
              new THREE.Vector3(0, 0, 0)
            );
          }}
          onPointerEnter={() => setHoveredFace(name)}
          onPointerLeave={() => setHoveredFace(null)}
        >
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial
            color={hoveredFace === name ? '#4a90e2' : '#666'}
            transparent
            opacity={hoveredFace === name ? 1 : 0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

const CameraCube: React.FC<CameraCubeProps> = ({ onViewChange }) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-black/20 rounded-lg border border-white/10 backdrop-blur-sm">
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <CubeGeometry onViewChange={onViewChange} />
      </Canvas>
      
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
        Click faces to change view
      </div>
    </div>
  );
};

export default CameraCube;