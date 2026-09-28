"use client";

import dynamic from "next/dynamic";
import type { EmpireDTO } from "@/types";

// WebGL/Three.js must never be server-rendered (spec 32: performant MVP city
// engine). Loaded on the client only, with a skeleton while the bundle and
// GLB assets fetch.
const CityScene = dynamic(() => import("./CityScene"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-text-muted text-sm">
      Loading your city...
    </div>
  ),
});

export function CityViewer({ empire }: { empire: EmpireDTO }) {
  return (
    <div className="relative h-[420px] rounded-2xl overflow-hidden border border-base-700 bg-base-900">
      <CityScene empire={empire} />
      <div className="absolute bottom-3 left-3 text-[11px] text-text-muted bg-base-950/70 rounded-lg px-2.5 py-1.5">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
