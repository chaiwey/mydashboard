"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn("email", { email, redirect: false });
      if (result?.error) {
        setError("Failed to send sign-in link. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Check your email</p>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          A sign-in link was sent to <span className="font-medium">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
          style={{ color: "var(--color-muted)" }}
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all"
          style={{
            background: "var(--color-background)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
      </div>
      {error && <p className="text-xs" style={{ color: "#c0392b" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium rounded-lg transition-opacity disabled:opacity-50"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-surface-raised)",
          fontFamily: "inherit",
        }}
      >
        {loading ? "Sending…" : "Continue with email"}
      </button>
    </form>
  );
}
