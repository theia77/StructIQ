'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { BeamState, AnalysisResults } from '@/lib/types/structural';
import * as THREE from 'three';

function BeamGeometry({ state }: { state: BeamState }) {
  if (state.nodes.length < 2) return null;

  const sortedNodes = [...state.nodes].sort((a, b) => a.x - b.x);
  const points = sortedNodes.map(node => new THREE.Vector3(node.x, 0, 0));

  return (
    <group>
      {/* Beam as a thick line representing the neutral axis */}
      <Line
        points={points}
        color="#3b82f6"
        lineWidth={15}
      />

      {/* Supports as 3D meshes */}
      {sortedNodes.map((node, i) => {
        if (node.supportType === 'free') return null;

        return (
          <mesh key={`support-${i}`} position={[node.x, -0.5, 0]}>
            {node.supportType === 'fixed' ? (
              <boxGeometry args={[1, 1, 1]} />
            ) : (
              <coneGeometry args={[0.5, 1, 4]} />
            )}
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Beam3DScene({ state, results }: { state: BeamState; results: AnalysisResults | null }) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [5, 5, 10], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <BeamGeometry state={state} />

        <Grid
          infiniteGrid
          fadeDistance={50}
          sectionColor="#475569"
          cellColor="#334155"
          position={[0, -1, 0]}
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
