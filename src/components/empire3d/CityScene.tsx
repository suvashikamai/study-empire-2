"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { BuildingMesh } from "./BuildingMesh";
import { BUILDING_ASSETS } from "@/game-engine/config/assets.config";
import type { EmpireDTO } from "@/types";

const SPACING = 2.4;

function TownHallCenterpiece({ level }: { level: number }) {
  const def = BUILDING_ASSETS.town_hall;
  const scale = 1 + Math.min(1.5, level * 0.08);
  return (
    <group position={[-SPACING * 1.8, 0, -SPACING * 1.8]}>
      <mesh position={[0, 0.9 * scale, 0]}>
        <boxGeometry args={[1, 1.8 * scale, 1]} />
        <meshStandardMaterial color={def.placeholder.color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.85 * scale, 0]}>
        <coneGeometry args={[0.8, 0.6 * scale, 4]} />
        <meshStandardMaterial color="#f2b13d" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#173423" roughness={1} />
    </mesh>
  );
}

export default function CityScene({ empire }: { empire: EmpireDTO }) {
  return (
    <Canvas shadows camera={{ position: [10, 9, 12], fov: 42 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#0a0a0d"]} />
      <fog attach="fog" args={["#0a0a0d", 20, 45]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <Ground />
      <TownHallCenterpiece level={empire.townHallLevel} />

      {empire.buildings.map((b) => (
        <BuildingMesh key={b.id} building={b} spacing={SPACING} />
      ))}

      <OrbitControls
        enablePan
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
