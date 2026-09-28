"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "@/components/icons";
import type { SessionUser, AchievementDTO, EmpireDTO } from "@/types";

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [achievements, setAchievements] = useState<AchievementDTO[] | null>(null);
  const [empire, setEmpire] = useState<EmpireDTO | null>(null);

  useEffect(() => {
    apiFetch<{ user: SessionUser | null }>("/api/auth/me").then((d) => setUser(d.user));
    apiFetch<{ achievements: AchievementDTO[] }>("/api/achievements").then((d) => setAchievements(d.achievements));
    apiFetch<{ empire: EmpireDTO }>("/api/empire").then((d) => setEmpire(d.empire));
  }, []);

  if (!user) return <div className="h-40 bg-base-800 rounded-2xl animate-pulse" />;

  const unlockedCount = achievements?.filter((a) => a.unlocked).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-base-700 flex items-center justify-center text-2xl font-bold shrink-0">
          {user.displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{user.displayName}</h1>
          <div className="text-sm text-text-muted">@{user.username} · {user.friendCode}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Level" value={String(user.level)} />
        <Stat label="Total XP" value={user.totalXp.toLocaleString()} />
        <Stat label="Study Hours" value={String(Math.round((user.totalStudyMinutes / 60) * 10) / 10)} />
        <Stat label="Current Streak" value={`${user.currentStreak}d`} />
        <Stat label="Longest Streak" value={`${user.longestStreak}d`} />
        {empire && <Stat label="Empire Level" value={String(empire.townHallLevel)} />}
        {empire && <Stat label="Population" value={empire.population.toLocaleString()} />}
        {empire && <Stat label="Empire Rating" value={`${empire.empireRatingPct}%`} />}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Achievements</h2>
          <span className="text-xs text-text-muted">{unlockedCount}/{achievements?.length ?? 0} unlocked</span>
        </div>
        {!achievements ? (
          <div className="h-24 bg-base-800 rounded-2xl animate-pulse" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {achievements.map((a) => (
              <div key={a.key} className={`card flex items-center gap-3 ${a.unlocked ? "" : "opacity-50"}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${a.unlocked ? "bg-accent/15" : "bg-base-700"}`}>
                  <Icon name={a.unlocked ? "trophy" : "lock"} className={`h-5 w-5 ${a.unlocked ? "text-accent" : "text-text-muted"}`} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{a.name}</div>
                  <div className="text-xs text-text-muted truncate">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
