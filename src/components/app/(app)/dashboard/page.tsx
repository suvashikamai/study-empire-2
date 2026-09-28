"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";
import type { DashboardDTO } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isWelcome = useSearchParams().get("welcome") === "1";

  useEffect(() => {
    apiFetch<DashboardDTO>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="card text-empire-danger">{error}</div>;
  if (!data) return <DashboardSkeleton />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {isWelcome && (
        <div className="card border-accent/40 bg-accent/5">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <Icon name="sparkles" className="h-5 w-5 text-accent" /> Your empire is waiting for you.
          </div>
          <p className="text-sm text-text-secondary">
            Add a subject and start your first focus session below to begin construction.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {data.displayName}
        </h1>
        <p className="text-text-secondary text-sm mt-1">Here&apos;s where things stand today.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-secondary">Today&apos;s progress</span>
          <span className="text-sm font-semibold">
            {data.today.completedMinutes}m / {data.today.targetMinutes}m
          </span>
        </div>
        <ProgressBar pct={data.today.progressPct} />
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Icon name="flame" className="h-4 w-4 text-empire-gold" />
            <span className="font-semibold">{data.currentStreak}</span>
            <span className="text-text-muted">day streak</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-text-muted">Level</span>
            <span className="font-semibold">{data.level}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-text-muted">Empire</span>
            <span className="font-semibold">Lv. {data.empireLevel}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Today&apos;s Tasks</h2>
          <Link href="/schedule" className="text-xs text-accent font-medium">Manage schedule</Link>
        </div>
        {data.todaysTasks.length === 0 ? (
          <div className="card text-sm text-text-secondary">
            Nothing scheduled today. <Link href="/schedule" className="text-accent">Plan your day →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {data.todaysTasks.map((t) => (
              <div key={t.id} className="card flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.subjectColor }} />
                    <span className="text-xs text-text-muted">{t.subjectName}</span>
                  </div>
                  <div className="font-medium truncate mt-0.5">{t.topicName}</div>
                  <div className="text-xs text-text-muted mt-0.5">{t.startTime} – {t.endTime}</div>
                </div>
                {t.done ? (
                  <Icon name="check" className="h-5 w-5 text-accent shrink-0" />
                ) : (
                  <Link href="/study" className="btn-ghost text-xs px-2.5 py-1.5 shrink-0">Start</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Empire Status</h2>
        <div className="card">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Stat label="Population" value={data.empireStatus.population.toLocaleString()} />
            <Stat label="Buildings" value={String(data.empireStatus.buildingCount)} />
            <Stat label="Condition" value={`${data.empireStatus.conditionPct}%`} />
          </div>
          <Link href="/empire" className="btn-primary w-full">
            Enter Empire <Icon name="chevron-right" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {data.quests.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Today&apos;s Missions</h2>
          <div className="card space-y-3">
            {data.quests.map((q) => (
              <div key={q.key}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={q.completed ? "line-through text-text-muted" : ""}>{q.label}</span>
                  <span className="text-text-muted text-xs">{q.progress}/{q.target}</span>
                </div>
                <ProgressBar pct={(q.progress / Math.max(1, q.target)) * 100} colorClass={q.completed ? "bg-empire-gold" : "bg-accent"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-base-800 rounded-lg" />
      <div className="h-28 bg-base-800 rounded-2xl" />
      <div className="h-40 bg-base-800 rounded-2xl" />
    </div>
  );
}
