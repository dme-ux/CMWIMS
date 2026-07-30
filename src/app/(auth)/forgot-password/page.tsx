"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8 shadow-glass-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.jpeg" alt="CMW" width={72} height={72} className="mb-3 rounded-xl" />
          <h1 className="font-display text-xl font-bold text-brand-700">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-muted">We'll email you a secure reset link.</p>
        </div>
        {sent ? (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-center text-sm text-brand-700">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <div className="space-y-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@capitalmotorworks.in"
              className="w-full rounded-xl border border-white/60 bg-white/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-200"
            />
            <Button className="w-full py-3" onClick={() => setSent(true)}>Send reset link</Button>
          </div>
        )}
        <p className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
