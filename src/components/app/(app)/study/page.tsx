"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";
import type { Subject } from "@/types";

const COLORS = ["#22e07a", "#3d9be0", "#f2b13d", "#e0523a", "#8a5cf6", "#3de0d0"];

export default function StudyPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetHours, setTargetHours] = useState(10);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiFetch<{ subjects: Subject[] }>("/api/subjects").then((d) => setSubjects(d.subjects));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/subjects", { method: "POST", body: JSON.stringify({ name, targetHours, color }) });
      setName("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create subject.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Study</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> New Subject
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          {error && <div className="text-sm text-empire-danger">{error}</div>}
          <div>
            <label className="label">Subject name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Digital Signal Processing" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target hours</label>
              <input className="input" type="number" min={0} value={targetHours} onChange={(e) => setTargetHours(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2 pt-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-offset-base-900 ring-white" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="btn-primary">Create subject</button>
        </form>
      )}

      {!subjects ? (
        <div className="h-40 bg-base-800 rounded-2xl animate-pulse" />
      ) : subjects.length === 0 ? (
        <div className="card text-center text-text-secondary py-10">
          No subjects yet. Create your first subject to start building your study plan.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <Link key={s.id} href={`/study/${s.id}`} className="card block hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-semibold">{s.name}</span>
              </div>
              <div className="text-xs text-text-muted mb-3">
                {s.topicCount} topic{s.topicCount === 1 ? "" : "s"} · {s.completedHours}h / {s.targetHours}h
              </div>
              <ProgressBar pct={s.progressPct} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
