import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface NavigationCubeProps {
  onViewChange: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

const CubeFace: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  text: string;
  onClick: () => void;
  color: string;
}> = ({ position, rotation, text, onClick, color }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        position={[0, 0, 0.51]}
      >
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial
          color={hovered ? '#4a90e2' : color}
          transparent
          opacity={hovered ? 0.9 : 0.7}
        />
      </mesh>
      <Text
        position={[0, 0, 0.52]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {text}
      </Text>
    </group>
  );
};

const CubeEdge: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  onClick: () => void;
}> = ({ position, rotation, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <cylinderGeometry args={[0.02, 0.02, 1.02]} />
      <meshBasicMaterial
        color={hovered ? '#4a90e2' : '#666666'}
        transparent
        opacity={hovered ? 0.9 : 0.5}
      />
    </mesh>
  );
};

const CubeCorner: React.FC<{
  position: [number, number, number];
  onClick: () => void;
}> = ({ position, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <sphereGeometry args={[0.05]} />
      <meshBasicMaterial
        color={hovered ? '#4a90e2' : '#888888'}
        transparent
        opacity={hovered ? 0.9 : 0.6}
      />
    </mesh>
  );
};

const NavigationCubeInner: React.FC<NavigationCubeProps> = ({ onViewChange }) => {
  const cubeRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Rotate cube to match main camera orientation
  useFrame(() => {
    if (cubeRef.current && camera) {
      // Get the main camera's rotation and apply it to the cube
      const mainCamera = camera as THREE.PerspectiveCamera;
      cubeRef.current.rotation.copy(mainCamera.rotation);
    }
  });

  const handleViewChange = (position: THREE.Vector3, target: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) => {
    onViewChange(position, target);
  };

  return (
    <group ref={cubeRef}>
      {/* Main cube wireframe */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#333333"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Faces */}
      <CubeFace
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        text="FRONT"
        color="#e74c3c"
        onClick={() => handleViewChange(new THREE.Vector3(0, 0, 5))}
      />
      <CubeFace
        position={[0, 0, 0]}
        rotation={[0, Math.PI, 0]}
        text="BACK"
        color="#e74c3c"
        onClick={() => handleViewChange(new THREE.Vector3(0, 0, -5))}
      />
      <CubeFace
        position={[0, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        text="RIGHT"
        color="#27ae60"
        onClick={() => handleViewChange(new THREE.Vector3(5, 0, 0))}
      />
      <CubeFace
        position={[0, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        text="LEFT"
        color="#27ae60"
        onClick={() => handleViewChange(new THREE.Vector3(-5, 0, 0))}
      />
      <CubeFace
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        text="TOP"
        color="#3498db"
        onClick={() => handleViewChange(new THREE.Vector3(0, 5, 0))}
      />
      <CubeFace
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        text="BOTTOM"
        color="#3498db"
        onClick={() => handleViewChange(new THREE.Vector3(0, -5, 0))}
      />

      {/* Edges for diagonal views */}
      <CubeEdge
        position={[0.5, 0.5, 0]}
        rotation={[0, 0, Math.PI / 4]}
        onClick={() => handleViewChange(new THREE.Vector3(3.5, 3.5, 3.5))}
      />
      <CubeEdge
        position={[-0.5, 0.5, 0]}
        rotation={[0, 0, -Math.PI / 4]}
        onClick={() => handleViewChange(new THREE.Vector3(-3.5, 3.5, 3.5))}
      />
      <CubeEdge
        position={[0.5, -0.5, 0]}
        rotation={[0, 0, -Math.PI / 4]}
        onClick={() => handleViewChange(new THREE.Vector3(3.5, -3.5, 3.5))}
      />
      <CubeEdge
        position={[-0.5, -0.5, 0]}
        rotation={[0, 0, Math.PI / 4]}
        onClick={() => handleViewChange(new THREE.Vector3(-3.5, -3.5, 3.5))}
      />

      {/* Vertical edges */}
      <CubeEdge
        position={[0.5, 0, 0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(3.5, 2, 3.5))}
      />
      <CubeEdge
        position={[-0.5, 0, 0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(-3.5, 2, 3.5))}
      />
      <CubeEdge
        position={[0.5, 0, -0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(3.5, 2, -3.5))}
      />
      <CubeEdge
        position={[-0.5, 0, -0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(-3.5, 2, -3.5))}
      />

      {/* Horizontal edges */}
      <CubeEdge
        position={[0, 0.5, 0.5]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(2, 3.5, 3.5))}
      />
      <CubeEdge
        position={[0, -0.5, 0.5]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(2, -3.5, 3.5))}
      />
      <CubeEdge
        position={[0, 0.5, -0.5]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(2, 3.5, -3.5))}
      />
      <CubeEdge
        position={[0, -0.5, -0.5]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={() => handleViewChange(new THREE.Vector3(2, -3.5, -3.5))}
      />

      {/* Corners for isometric views */}
      <CubeCorner
        position={[0.5, 0.5, 0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(4, 4, 4))}
      />
      <CubeCorner
        position={[-0.5, 0.5, 0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(-4, 4, 4))}
      />
      <CubeCorner
        position={[0.5, -0.5, 0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(4, -4, 4))}
      />
      <CubeCorner
        position={[-0.5, -0.5, 0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(-4, -4, 4))}
      />
      <CubeCorner
        position={[0.5, 0.5, -0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(4, 4, -4))}
      />
      <CubeCorner
        position={[-0.5, 0.5, -0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(-4, 4, -4))}
      />
      <CubeCorner
        position={[0.5, -0.5, -0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(4, -4, -4))}
      />
      <CubeCorner
        position={[-0.5, -0.5, -0.5]}
        onClick={() => handleViewChange(new THREE.Vector3(-4, -4, -4))}
      />
    </group>
  );
};

const NavigationCube: React.FC<NavigationCubeProps> = ({ onViewChange }) => {
  return (
    <div className="absolute bottom-4 left-4 w-24 h-24 bg-black/20 rounded-lg border border-white/10 overflow-hidden">
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <NavigationCubeInner onViewChange={onViewChange} />
      </Canvas>
      
      {/* Compass indicators */}
      <div className="absolute top-1 left-1 text-xs text-white/60 font-mono">
        <div className="flex flex-col items-center">
          <span className="text-red-400">Y</span>
          <span className="text-green-400">X</span>
        </div>
      </div>
      
      {/* Home button */}
      <button
        onClick={() => onViewChange(new THREE.Vector3(5, 5, 5), new THREE.Vector3(0, 0, 0))}
        className="absolute bottom-1 right-1 w-4 h-4 bg-white/10 hover:bg-white/20 rounded text-xs text-white/70 hover:text-white transition-colors flex items-center justify-center"
        title="Reset View"
      >
        ⌂
      </button>
    </div>
  );
};

export default NavigationCube;