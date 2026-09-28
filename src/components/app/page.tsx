import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";
import { Icon } from "@/components/icons";

export default async function LandingPage() {
  const userId = await getSessionUserId();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-base-950">
      <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-6 shadow-glow">
        <Icon name="castle" className="h-9 w-9 text-base-950" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Study Empire</h1>
      <p className="text-text-secondary text-lg max-w-md mb-10">
        Real-life study progress = empire progress. Plan your study, focus, and watch your city grow.
      </p>
      <div className="flex gap-3">
        <Link href="/register" className="btn-primary px-6 py-3">Create your empire</Link>
        <Link href="/login" className="btn-secondary px-6 py-3">Sign in</Link>
      </div>
    </div>
  );
}
