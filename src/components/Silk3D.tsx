import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment, Lightformer } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function Blob({ color, pos, scale, speed }: { color: string; pos: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.003 * speed;
    ref.current.position.x = pos[0] + s.pointer.x * 0.4;
    ref.current.position.y = pos[1] + s.pointer.y * 0.3;
  });
  return (
    <Float speed={speed} rotationIntensity={1.2} floatIntensity={1.5}>
      <mesh ref={ref} position={pos} scale={scale}>
        <torusKnotGeometry args={[1, 0.36, 220, 32]} />
        <MeshDistortMaterial color={color} roughness={0.25} metalness={0.15} distort={0.25} speed={1.5} />
      </mesh>
    </Float>
  );
}

export default function Silk3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.75]} onCreated={(s) => s.gl.domElement.parentElement?.setAttribute("data-scene-ready", "1")}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <Blob color="#7a1f2b" pos={[1.6, -0.9, -1]} scale={0.55} speed={1.4} />
      <mesh position={[-1.9, -1.1, -1]}>
        <sphereGeometry args={[0.55, 64, 64]} />
        <MeshDistortMaterial color="#e8b4a8" roughness={0.2} distort={0.4} speed={2} />
      </mesh>
      <mesh position={[2.3, 1.6, -1.5]}>
        <sphereGeometry args={[0.35, 64, 64]} />
        <MeshDistortMaterial color="#c9a25e" metalness={0.6} roughness={0.2} distort={0.3} speed={2} />
      </mesh>
      <Environment>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
        <Lightformer intensity={1} color="#f5d9c8" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
    </Canvas>
  );
}
