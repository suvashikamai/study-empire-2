"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-base-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
            <Icon name="castle" className="h-7 w-7 text-base-950" />
          </div>
          <h1 className="text-2xl font-bold">Build your empire</h1>
          <p className="text-text-secondary text-sm mt-1">Create your Study Empire account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="text-sm text-empire-danger bg-empire-danger/10 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Display name</label>
            <input className="input" value={form.displayName} onChange={update("displayName")} required autoFocus />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={update("username")} placeholder="letters, numbers, underscore" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={update("email")} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={update("password")} placeholder="8+ characters, with a letter and number" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating your empire..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
