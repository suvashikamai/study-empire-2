"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { ProgressBar } from "@/components/ProgressBar";
import { Icon } from "@/components/icons";
import type { Subject, Topic } from "@/types";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("MEDIUM");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [startingTopicId, setStartingTopicId] = useState<string | null>(null);

  function load() {
    apiFetch<{ subject: Subject }>(`/api/subjects/${id}`).then((d) => setSubject(d.subject));
    apiFetch<{ topics: Topic[] }>(`/api/subjects/${id}/topics`).then((d) => setTopics(d.topics));
  }

  useEffect(load, [id]);

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch(`/api/subjects/${id}/topics`, {
        method: "POST",
        body: JSON.stringify({ name, targetMinutes, priority, difficulty }),
      });
      setName("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create topic.");
    }
  }

  async function handleStart(topic: Topic) {
    setStartingTopicId(topic.id);
    try {
      const plannedMinutes = Math.max(15, topic.targetMinutes - topic.completedMinutes) || 30;
      const { session } = await apiFetch<{ session: { id: string } }>("/api/focus/start", {
        method: "POST",
        body: JSON.stringify({ subjectId: id, topicId: topic.id, plannedMinutes }),
      });
      sessionStorage.setItem(`se_planned_${session.id}`, String(plannedMinutes));
      sessionStorage.setItem(`se_topic_${session.id}`, topic.name);
      sessionStorage.setItem(`se_subject_${session.id}`, subject?.name ?? "");
      router.push(`/focus/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start session.");
      setStartingTopicId(null);
    }
  }

  if (!subject || !topics) return <div className="h-40 bg-base-800 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />
            <h1 className="text-2xl font-bold">{subject.name}</h1>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            {subject.completedHours}h studied of {subject.targetHours}h target
          </p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> Topic
        </button>
      </div>

      {error && <div className="text-sm text-empire-danger bg-empire-danger/10 rounded-lg px-3 py-2">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreateTopic} className="card space-y-4">
          <div>
            <label className="label">Topic name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fourier Transform" required autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Target minutes</label>
              <input className="input" type="number" min={5} value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Add topic</button>
        </form>
      )}

      {topics.length === 0 ? (
        <div className="card text-center text-text-secondary py-10">No topics yet. Break this subject down into topics to study.</div>
      ) : (
        <div className="space-y-3">
          {topics.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    {t.completed && <Icon name="check" className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="badge">{t.priority}</span>
                    <span className="badge">{t.difficulty}</span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar pct={t.progressPct} />
                    <div className="text-xs text-text-muted mt-1">{t.completedMinutes}m / {t.targetMinutes}m</div>
                  </div>
                </div>
                <button onClick={() => handleStart(t)} disabled={startingTopicId === t.id} className="btn-primary shrink-0">
                  <Icon name="play" className="h-4 w-4" /> {startingTopicId === t.id ? "Starting..." : "Start"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
