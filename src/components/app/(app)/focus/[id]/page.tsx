"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

interface CompletionResult {
  xpAwarded: number;
  empireXp: number;
  constructionPoints: number;
  leveledUp: boolean;
  townHallLeveledUp: boolean;
  completedBuildings: string[];
  newlyUnlockedAchievements: { name: string }[];
  dailyGoalJustCompleted?: boolean;
}

export default function FocusSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Session context comes from wherever the user started this session; we
  // don't have a GET /api/focus/:id, so pull what we need from the URL's
  // referring state via sessionStorage set on start — falling back to
  // generic labels keeps the timer usable even on a hard refresh.
  const [plannedMinutes] = useState<number>(() => {
    if (typeof window === "undefined") return 30;
    return Number(sessionStorage.getItem(`se_planned_${id}`)) || 30;
  });
  const [topicName] = useState<string>(() => (typeof window === "undefined" ? "Focus Session" : sessionStorage.getItem(`se_topic_${id}`) || "Focus Session"));
  const [subjectName] = useState<string>(() => (typeof window === "undefined" ? "" : sessionStorage.getItem(`se_subject_${id}`) || ""));

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [prompt, setPrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function togglePause() {
    if (running) setBreaksTaken((b) => b + 1);
    setRunning((r) => !r);
  }

  function handleFinishClick() {
    setRunning(false);
    setPrompt(true);
  }

  async function submitCompletion(completed: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<CompletionResult>(`/api/focus/${id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          clientClaimedMinutes: elapsedSeconds / 60,
          breaksTaken,
          completed,
        }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your session.");
      setSubmitting(false);
    }
  }

  const targetSeconds = plannedMinutes * 60;
  const progressPct = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  if (result) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
          <Icon name="check" className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold">Session recorded</h1>
        <div className="card text-left space-y-2">
          <Row label="XP earned" value={`+${result.xpAwarded}`} />
          <Row label="Empire XP" value={`+${result.empireXp}`} />
          <Row label="Construction Points" value={`+${result.constructionPoints}`} />
          {result.leveledUp && <Row label="Level up!" value="🎉" accent />}
          {result.townHallLeveledUp && <Row label="Town Hall upgraded!" value="🏛️" accent />}
          {result.completedBuildings.length > 0 && (
            <Row label="Building completed" value={result.completedBuildings.join(", ")} accent />
          )}
          {result.newlyUnlockedAchievements.length > 0 && (
            <Row label="Achievement unlocked" value={result.newlyUnlockedAchievements.map((a) => a.name).join(", ")} accent />
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push("/empire")} className="btn-secondary">View Empire</button>
          <button onClick={() => router.push("/study")} className="btn-primary">Back to Study</button>
        </div>
      </div>
    );
  }

  if (prompt) {
    return (
      <div className="max-w-sm mx-auto text-center py-16 space-y-6">
        <h1 className="text-xl font-semibold">Did you complete your study session?</h1>
        {error && <div className="text-sm text-empire-danger">{error}</div>}
        <div className="flex gap-3 justify-center">
          <button onClick={() => submitCompletion(false)} disabled={submitting} className="btn-secondary flex-1">No</button>
          <button onClick={() => submitCompletion(true)} disabled={submitting} className="btn-primary flex-1">Yes</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto text-center py-10 space-y-8">
      <div>
        {subjectName && <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{subjectName}</div>}
        <h1 className="text-xl font-semibold">{topicName}</h1>
      </div>

      <div className="text-6xl font-mono font-bold tabular-nums">{formatTime(elapsedSeconds)}</div>

      <button onClick={togglePause} className={running ? "btn-secondary w-full" : "btn-primary w-full"}>
        <Icon name={running ? "pause" : "play"} className="h-5 w-5" />
        {running ? "Pause" : "Resume"}
      </button>

      <div>
        <ProgressBar pct={progressPct} />
        <div className="flex justify-between text-xs text-text-muted mt-2">
          <span>Target: {plannedMinutes}m</span>
          <span>Studied: {Math.floor(elapsedSeconds / 60)}m</span>
        </div>
      </div>

      {breaksTaken > 0 && <div className="text-xs text-text-muted">{breaksTaken} break{breaksTaken === 1 ? "" : "s"} taken</div>}

      <button onClick={handleFinishClick} className="btn-ghost w-full">Complete session</button>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-semibold ${accent ? "text-accent" : ""}`}>{value}</span>
    </div>
  );
}
