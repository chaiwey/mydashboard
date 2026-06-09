"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { api } from "@/trpc/react";
import { JournalCalendar, type DateSelection } from "@/components/journal/JournalCalendar";
import { JournalEntryCard, type JournalEntry } from "@/components/journal/JournalEntryCard";
import type { JournalEditorProps } from "@/components/journal/JournalEditor";

// Tiptap accesses browser APIs during module init — keep it out of SSR
const JournalEditor = dynamic<JournalEditorProps>(
  () => import("@/components/journal/JournalEditor").then((m) => ({ default: m.JournalEditor })),
  { ssr: false }
);

function todaySelection(): DateSelection {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() };
}

// ── PIN gate ──────────────────────────────────────────────────────────────────

function PinDigits({ onComplete, error }: { onComplete: (pin: string) => void; error: boolean }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => { refs[0].current?.focus(); }, []);
  useEffect(() => { if (error) { setDigits(["", "", "", ""]); refs[0].current?.focus(); } }, [error]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 3) refs[i + 1].current?.focus();
    if (digit && i === 3) {
      const pin = [...next.slice(0, 3), digit].join("");
      if (pin.length === 4) onComplete(pin);
    }
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-14 text-center text-xl font-semibold rounded-xl outline-none transition-all"
          style={{
            background: "var(--color-background)",
            border: `2px solid ${error ? "#ef4444" : d ? "var(--color-accent)" : "var(--color-border)"}`,
            color: "var(--color-foreground)",
          }}
        />
      ))}
    </div>
  );
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const utils = api.useUtils();
  const { data: pinData } = api.journalPin.has.useQuery();
  const [mode, setMode] = useState<"enter" | "setup">("enter");
  const [setupStep, setSetupStep] = useState<"first" | "confirm">("first");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const verifyPin = api.journalPin.verify.useMutation({
    onSuccess: ({ valid }) => {
      if (valid) { onUnlock(); }
      else { setError(true); setErrorMsg("Incorrect PIN"); setTimeout(() => setError(false), 600); }
    },
  });
  const setPin = api.journalPin.set.useMutation({
    onSuccess: () => { void utils.journalPin.has.invalidate(); onUnlock(); },
  });

  const hasPin = pinData?.hasPin;

  useEffect(() => {
    if (pinData !== undefined) setMode(hasPin ? "enter" : "setup");
  }, [hasPin, pinData]);

  if (pinData === undefined) return null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-6 py-16">
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: "var(--color-muted)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
          {mode === "setup"
            ? setupStep === "first" ? "Create a PIN" : "Confirm your PIN"
            : "Enter your PIN"}
        </h2>
        <p className="text-xs text-center max-w-[200px]" style={{ color: "var(--color-muted)" }}>
          {mode === "setup"
            ? setupStep === "first" ? "Choose a 4-digit PIN to protect your private journal." : "Re-enter the PIN to confirm."
            : "Your private journal is locked."}
        </p>
      </div>

      <PinDigits
        error={error}
        onComplete={(pin) => {
          setErrorMsg("");
          if (mode === "setup") {
            if (setupStep === "first") { setFirstPin(pin); setSetupStep("confirm"); }
            else if (pin === firstPin) { setPin.mutate({ pin }); }
            else { setError(true); setErrorMsg("PINs don't match"); setSetupStep("first"); setFirstPin(""); setTimeout(() => setError(false), 600); }
          } else {
            verifyPin.mutate({ pin });
          }
        }}
      />

      {errorMsg && (
        <p className="text-xs" style={{ color: "#ef4444" }}>{errorMsg}</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Mode = "journal" | "private";

export default function JournalPage() {
  const [mode, setMode] = useState<Mode>("journal");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateSelection>(todaySelection);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();

  const isPrivate = mode === "private";
  const showContent = mode === "journal" || pinUnlocked;

  const { data: entries, isLoading } = api.journalEntry.list.useQuery(
    { ...selectedDate, isPrivate },
    { enabled: showContent }
  );

  const openCreate = () => { setEditingEntry(undefined); setShowEditor(true); };
  const openEdit = (entry: JournalEntry) => { setEditingEntry(entry); setShowEditor(true); };
  const closeEditor = () => { setShowEditor(false); setEditingEntry(undefined); };

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === "journal") setPinUnlocked(false);
    setShowEditor(false);
    setEditingEntry(undefined);
  };

  const dateLabel = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Mode tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => switchMode("journal")}
          className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: mode === "journal" ? "var(--color-accent)" : "transparent",
            color: mode === "journal" ? "var(--color-surface-raised)" : "var(--color-muted)",
            border: mode === "journal" ? "none" : "1px solid var(--color-border)",
          }}
        >
          Journal
        </button>
        <button
          onClick={() => switchMode("private")}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: mode === "private" ? "var(--color-accent)" : "transparent",
            color: mode === "private" ? "var(--color-surface-raised)" : "var(--color-muted)",
            border: mode === "private" ? "none" : "1px solid var(--color-border)",
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Private
          {mode === "private" && pinUnlocked && (
            <button
              onClick={(e) => { e.stopPropagation(); setPinUnlocked(false); }}
              className="ml-1 text-xs opacity-70 hover:opacity-100 underline"
            >
              Lock
            </button>
          )}
        </button>
      </div>

      {/* PIN gate when in private mode and locked */}
      {mode === "private" && !pinUnlocked ? (
        <PinGate onUnlock={() => setPinUnlocked(true)} />
      ) : (
        <div className="flex gap-8 flex-1 min-h-0">
          {/* Calendar */}
          <div className="w-64 flex-shrink-0 pt-1">
            <JournalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} isPrivate={isPrivate} />
          </div>

          {/* Entries */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
              >
                {dateLabel}
              </h2>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New entry
              </button>
            </div>

            {isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-36 rounded-xl animate-pulse"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
                  />
                ))}
              </div>
            )}

            {!isLoading && entries?.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
                  No {isPrivate ? "private " : ""}entries for this day.
                </p>
                <button
                  onClick={openCreate}
                  className="text-sm underline transition-opacity hover:opacity-70"
                  style={{ color: "var(--color-muted)" }}
                >
                  Write one?
                </button>
              </div>
            )}

            {entries && entries.length > 0 && (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <JournalEntryCard key={entry.id} entry={entry} onEdit={openEdit} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showContent && showEditor && (
        <JournalEditor entry={editingEntry} date={selectedDate} onClose={closeEditor} isPrivate={isPrivate} />
      )}
    </div>
  );
}
