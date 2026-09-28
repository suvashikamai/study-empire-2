"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ emailOrUsername, password }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-base-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
            <Icon name="castle" className="h-7 w-7 text-base-950" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to your empire</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="text-sm text-empire-danger bg-empire-danger/10 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Email or username</label>
            <input className="input" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          New to Study Empire?{" "}
          <Link href="/register" className="text-accent font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
