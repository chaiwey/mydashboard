"use client";

import { useState } from "react";
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

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState<DateSelection>(todaySelection);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();

  const { data: entries, isLoading } = api.journalEntry.list.useQuery(selectedDate);

  const openCreate = () => { setEditingEntry(undefined); setShowEditor(true); };
  const openEdit = (entry: JournalEntry) => { setEditingEntry(entry); setShowEditor(true); };
  const closeEditor = () => { setShowEditor(false); setEditingEntry(undefined); };

  const dateLabel = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div className="flex gap-8 h-full">
      {/* Calendar */}
      <div className="w-64 flex-shrink-0 pt-1">
        <JournalCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* Entries for selected date */}
      <div className="flex-1 min-w-0">
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
              No entries for this day.
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

      {showEditor && (
        <JournalEditor entry={editingEntry} date={selectedDate} onClose={closeEditor} />
      )}
    </div>
  );
}
