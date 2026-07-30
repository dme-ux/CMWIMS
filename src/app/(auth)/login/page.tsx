"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * CMW ERP — 3D Glassmorphism Login
 * Signature: the glass card tilts in 3D toward the cursor, floating over an
 * animated blueprint-blue field with orbiting gear/part motifs from the brand.
 */
export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", password: "", remember: true });

  // ---- 3D tilt (cursor parallax) ----
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotX = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 150, damping: 20 });
  const rotY = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 150, damping: 20 });

  function onMove(e: React.MouseEvent) {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4">
      {/* animated background field */}
      <FloatingField />

      <motion.div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
        style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8 shadow-glass-lg"
      >
        {/* logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 160 }}
            className="mb-3 rounded-2xl bg-white/70 p-2 shadow-glass"
          >
            <Image src="/logo.jpeg" alt="Capital Motor Works" width={92} height={92} priority className="rounded-xl" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-700">CMW ERP</h1>
          <p className="mt-1 text-sm text-ink-muted">Smart Inventory &amp; Workshop Management</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            icon={<User className="h-4 w-4" />}
            placeholder="Username or email"
            value={form.username}
            onChange={(v) => setForm({ ...form, username: v })}
            autoComplete="username"
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            placeholder="Password"
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            autoComplete="current-password"
            trailing={
              <button type="button" onClick={() => setShowPw((s) => !s)} className="text-ink-muted hover:text-brand-600" aria-label="Toggle password">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Remember me
            </label>
            <a href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </a>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={loading} className="w-full py-3">
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-ink-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
            Secured with JWT &amp; role-based access
          </p>
        </form>
      </motion.div>

      {/* footer branding */}
      <div className="absolute bottom-5 z-10 text-center text-xs text-ink-muted">
        Powered by <span className="font-semibold text-brand-600">SystemMaster</span> · www.systemmaster.in
      </div>
    </div>
  );
}

/** Single glass input with leading icon + optional trailing control. */
function Field({
  icon, trailing, value, onChange, type = "text", placeholder, autoComplete,
}: {
  icon: React.ReactNode; trailing?: React.ReactNode; value: string;
  onChange: (v: string) => void; type?: string; placeholder: string; autoComplete?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/60 px-3.5 py-3 transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-200">
      <span className="text-brand-500">{icon}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
      />
      {trailing}
    </div>
  );
}

/** Ambient animated background — blueprint dots + orbiting gear rings. */
function FloatingField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* soft blobs */}
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-brand-300/30 blur-3xl animate-float" />
      {/* orbiting rings (gear nod) */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border border-brand-300/25"
          style={{ width: 340 + i * 200, height: 340 + i * 200, x: "-50%", y: "-50%" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40 + i * 20, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-brand-400/60" />
        </motion.div>
      ))}
    </div>
  );
}
