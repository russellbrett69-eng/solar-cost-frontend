"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [message, setMessage] = useState("");

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setStatus("sent");
      setMessage("Check your email for a sign-in link.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message ?? "Failed to send email.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border p-6 bg-black/20">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <form onSubmit={sendMagicLink} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded border bg-transparent px-3 py-2"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded bg-black text-white px-4 py-2 hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Email me a magic link"}
          </button>
        </form>

        {message && (
          <p className={`mt-3 text-sm ${status === "error" ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
