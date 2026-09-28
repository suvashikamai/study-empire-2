"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "@/components/icons";
import type { ScheduleEntry, Subject, Topic } from "@/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulePage() {
  const [entries, setEntries] = useState<ScheduleEntry[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [date, setDate] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");

  function load() {
    apiFetch<{ entries: ScheduleEntry[] }>("/api/schedule").then((d) => setEntries(d.entries));
  }

  useEffect(load, []);
  useEffect(() => {
    apiFetch<{ subjects: Subject[] }>("/api/subjects").then((d) => {
      setSubjects(d.subjects);
      if (d.subjects[0]) setSubjectId(d.subjects[0].id);
    });
  }, []);
  useEffect(() => {
    if (!subjectId) return;
    apiFetch<{ topics: Topic[] }>(`/api/subjects/${subjectId}/topics`).then((d) => {
      setTopics(d.topics);
      setTopicId(d.topics[0]?.id ?? "");
    });
  }, [subjectId]);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/schedule", {
        method: "POST",
        body: JSON.stringify({
          subjectId,
          topicId,
          recurring,
          date: recurring ? undefined : date,
          daysOfWeek: recurring ? days : undefined,
          startTime,
          endTime,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create schedule entry.");
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/schedule/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary" disabled={subjects.length === 0}>
          <Icon name="plus" className="h-4 w-4" /> New Entry
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="card text-sm text-text-secondary">Create a subject and topic first to build your schedule.</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          {error && <div className="text-sm text-empire-danger">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Topic</label>
              <select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={recurring} onChange={() => setRecurring(true)} /> Recurring
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!recurring} onChange={() => setRecurring(false)} /> One-off
            </label>
          </div>

          {recurring ? (
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((label, i) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => toggleDay(i)}
                  className={`h-9 w-9 rounded-full text-xs font-medium ${days.includes(i) ? "bg-accent text-base-950" : "bg-base-700 text-text-secondary"}`}
                >
                  {label[0]}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start time</label>
              <input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="label">End time</label>
              <input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn-primary">Save entry</button>
        </form>
      )}

      {!entries ? (
        <div className="h-40 bg-base-800 rounded-2xl animate-pulse" />
      ) : entries.length === 0 ? (
        <div className="card text-center text-text-secondary py-10">No schedule entries yet.</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="card flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: e.subjectColor }} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.topicName}</div>
                  <div className="text-xs text-text-muted">
                    {e.subjectName} · {e.startTime}–{e.endTime} ·{" "}
                    {e.recurring ? e.daysOfWeek?.map((d) => DAYS[d]).join(", ") : e.date}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(e.id)} className="btn-ghost p-2 shrink-0">
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
