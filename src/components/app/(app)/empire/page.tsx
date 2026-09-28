"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";
import { CityViewer } from "@/components/empire3d/CityViewer";
import type { EmpireDTO, BuildingInstanceDTO } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Thriving",
  LOW_ACTIVITY: "Quiet",
  DAMAGED: "Damaged",
  ABANDONED: "Abandoned",
  CONSTRUCTING: "Under construction",
};

export default function EmpirePage() {
  const [empire, setEmpire] = useState<EmpireDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  function load() {
    apiFetch<{ empire: EmpireDTO }>("/api/empire").then((d) => setEmpire(d.empire)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function handleUpgrade(building: BuildingInstanceDTO) {
    setUpgrading(building.id);
    try {
      await apiFetch(`/api/empire/buildings/${building.id}/upgrade`, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upgrade this building.");
    } finally {
      setUpgrading(null);
    }
  }

  if (error) return <div className="card text-empire-danger">{error}</div>;
  if (!empire) return <div className="h-96 bg-base-800 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Empire</h1>
        <p className="text-text-secondary text-sm mt-1">{empire.townHallName} · Town Hall Level {empire.townHallLevel}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Population" value={empire.population.toLocaleString()} />
        <MiniStat label="Empire XP" value={empire.empireXp.toLocaleString()} />
        <MiniStat label="Buildings" value={String(empire.buildings.length)} />
        <MiniStat label="City Condition" value={`${empire.conditionPct}%`} />
      </div>

      <CityViewer empire={empire} />

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text-secondary">Empire Rating</span>
          <span className="text-sm font-semibold">{empire.empireRatingPct}%</span>
        </div>
        <ProgressBar pct={empire.empireRatingPct} colorClass="bg-empire-gold" />
      </div>

      <div>
        <h2 className="font-semibold mb-3">Buildings ({empire.buildings.length})</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {empire.buildings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{b.buildingName}</div>
                  <div className="text-xs text-text-muted mt-0.5">Level {b.level} · {STATUS_LABEL[b.status] ?? b.status}</div>
                </div>
                {b.status !== "CONSTRUCTING" && (
                  <button
                    onClick={() => handleUpgrade(b)}
                    disabled={upgrading === b.id}
                    className="btn-secondary text-xs px-2.5 py-1.5 shrink-0"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] text-text-muted mb-1">
                    <span>{b.status === "CONSTRUCTING" ? "Construction" : "Progress"}</span>
                    <span>{b.progressPct}%</span>
                  </div>
                  <ProgressBar pct={b.progressPct} colorClass={b.status === "CONSTRUCTING" ? "bg-empire-info" : "bg-accent"} />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-text-muted mb-1">
                    <span>Condition</span>
                    <span>{b.conditionPct}%</span>
                  </div>
                  <ProgressBar
                    pct={b.conditionPct}
                    colorClass={b.conditionPct >= 85 ? "bg-accent" : b.conditionPct >= 55 ? "bg-empire-gold" : "bg-empire-danger"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-text-muted">
        <Icon name="sparkles" className="h-4 w-4 shrink-0 mt-0.5" />
        <p>New buildings start automatically as you study. Keep your streak alive to grow your city and recover any damaged buildings.</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-3 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
