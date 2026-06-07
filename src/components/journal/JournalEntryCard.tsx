"use client";

import { api } from "@/trpc/react";

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  entryDate: Date;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
};

interface Props {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
}

export function JournalEntryCard({ entry, onEdit }: Props) {
  const utils = api.useUtils();
  const deleteMutation = api.journalEntry.delete.useMutation({
    onSuccess: () => {
      void utils.journalEntry.list.invalidate();
      void utils.journalEntry.listDates.invalidate();
    },
  });

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        {entry.category ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: entry.category.color + "22",
              color: entry.category.color,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: entry.category.color }}
            />
            {entry.category.name}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--color-muted)", opacity: 0.5 }}>
            No category
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onEdit(entry)}
          className="text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
        >
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm("Delete this entry?")) deleteMutation.mutate({ id: entry.id });
          }}
          className="text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-70 ml-1"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
          disabled={deleteMutation.isPending}
        >
          Delete
        </button>
      </div>

      <h3
        className="text-base font-semibold mb-3"
        style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
      >
        {entry.title}
      </h3>

      <div
        className="text-sm rich-text"
        style={{ color: "var(--color-foreground)", lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: entry.body }}
      />
    </div>
  );
}
