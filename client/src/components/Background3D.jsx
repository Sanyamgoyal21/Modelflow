import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  TorusKnot, 
  MeshDistortMaterial, 
  Float, 
  Stars, 
  Torus 
} from "@react-three/drei";

function LuminousKnot() {
  return (
    // Increased Float speed (1.5 -> 4) for faster floating
    // Increased rotationIntensity for more dynamic spinning
    <Float speed={4} rotationIntensity={2} floatIntensity={1}>
      <group>
        {/* Main Object: Torus Knot (White/Silver) */}
        <TorusKnot args={[0.8, 0.25, 128, 16]}>
          <MeshDistortMaterial
            color="#ffffff"     // Pure White
            emissive="#e0e7ff"  // Silver/Blue glow
            emissiveIntensity={0.2}
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.8}     // More metallic for better reflections
            roughness={0.1}
            distort={0.4}       // Slightly more distortion
            speed={3}           // Increased liquid speed (1.5 -> 3)
          />
        </TorusKnot>

        {/* Halo Rings - spinning faster visually due to parent Float */}
        <Torus args={[2.2, 0.01, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#c7d2fe" transparent opacity={0.3} />
        </Torus>
        
        <Torus args={[1.8, 0.01, 16, 64]} rotation={[0, 0, Math.PI / 3]}>
           <meshBasicMaterial color="#e9d5ff" transparent opacity={0.2} />
        </Torus>
      </group>
    </Float>
  );
}

function FastParticles() {
  return (
    <Stars 
      radius={50} 
      depth={50} 
      count={3000} 
      factor={3} 
      saturation={0} 
      fade 
      speed={1.5} // Faster background stars
    />
  );
}

function Rig() {
  useFrame((state) => {
    state.camera.position.x += (state.mouse.x * 0.5 - state.camera.position.x) * 0.02;
    state.camera.position.y += (state.mouse.y * 0.5 - state.camera.position.y) * 0.02;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 4.5] }} gl={{ antialias: true }}>
        {/* Lights */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={30} color="#a78bfa" />
        <pointLight position={[-10, -10, -10]} intensity={15} color="#818cf8" />
        <directionalLight position={[0, 5, 0]} intensity={2} color="#ffffff" />

        <FastParticles />
        <LuminousKnot />
        <Rig />
      </Canvas>
    </div>
  );
}