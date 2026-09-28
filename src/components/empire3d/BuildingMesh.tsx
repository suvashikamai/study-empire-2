"use client";

import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { BUILDING_ASSETS } from "@/game-engine/config/assets.config";
import type { BuildingInstanceDTO } from "@/types";

const STATUS_RING_COLOR: Record<string, string> = {
  ACTIVE: "#22e07a",
  LOW_ACTIVITY: "#f2b13d",
  DAMAGED: "#e0523a",
  ABANDONED: "#6c6c76",
  CONSTRUCTING: "#3d9be0",
};

function GltfBuilding({ file, heightScale }: { file: string; heightScale: number }) {
  const { scene } = useGLTF(`/models/${file}`);
  // Clone so multiple instances of the same asset (e.g. several houses)
  // don't fight over shared transform state.
  const cloned = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={cloned} scale={0.9 * heightScale} />;
}

function PlaceholderBuilding({
  shape,
  color,
  heightScale,
  faded,
}: {
  shape: "box" | "tower" | "dome" | "flat";
  color: string;
  heightScale: number;
  faded: boolean;
}) {
  const material = <meshStandardMaterial color={color} opacity={faded ? 0.45 : 1} transparent={faded} roughness={0.6} />;
  if (shape === "flat") {
    return (
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        {material}
      </mesh>
    );
  }
  if (shape === "dome") {
    return (
      <mesh position={[0, 0.5 * heightScale, 0]}>
        <sphereGeometry args={[0.6 * heightScale, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {material}
      </mesh>
    );
  }
  const height = (shape === "tower" ? 1.8 : 0.9) * heightScale;
  return (
    <mesh position={[0, height / 2, 0]}>
      <boxGeometry args={[shape === "tower" ? 0.7 : 1.1, height, shape === "tower" ? 0.7 : 1.1]} />
      {material}
    </mesh>
  );
}

export function BuildingMesh({ building, spacing }: { building: BuildingInstanceDTO; spacing: number }) {
  const def = BUILDING_ASSETS[building.buildingType];
  const isConstructing = building.status === "CONSTRUCTING";
  const faded = building.status === "DAMAGED" || building.status === "ABANDONED";
  const canLoadModel = def?.bundled && !!def.file;

  const position: [number, number, number] = [building.positionX * spacing, 0, building.positionY * spacing];

  return (
    <group position={position}>
      {canLoadModel ? (
        <Suspense fallback={<PlaceholderBuilding shape={def!.placeholder.shape} color={def!.placeholder.color} heightScale={def!.placeholder.heightScale} faded={faded} />}>
          <GltfBuilding file={def!.file} heightScale={def!.placeholder.heightScale} />
        </Suspense>
      ) : (
        <PlaceholderBuilding
          shape={def?.placeholder.shape ?? "box"}
          color={def?.placeholder.color ?? "#a6a6ae"}
          heightScale={def?.placeholder.heightScale ?? 1}
          faded={faded}
        />
      )}

      {/* Status ring — a quick-glance read on condition without needing to
          click into the building (spec 17/18: visible decay/recovery). */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.75, 0.85, 24]} />
        <meshBasicMaterial color={STATUS_RING_COLOR[building.status] ?? "#a6a6ae"} transparent opacity={isConstructing ? 0.9 : 0.6} />
      </mesh>
    </group>
  );
}
