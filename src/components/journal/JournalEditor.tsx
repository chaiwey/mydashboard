"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { api } from "@/trpc/react";
import { useState, useEffect } from "react";
import type { DateSelection } from "./JournalCalendar";
import type { JournalEntry } from "./JournalEntryCard";

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#6366f1", "#a855f7", "#ec4899",
  "#94a3b8", "#1e293b",
];

const inputStyle: React.CSSProperties = {
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  color: "var(--color-foreground)",
  fontFamily: "inherit",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-2 py-1 rounded text-xs font-medium transition-colors"
      style={{
        background: active ? "var(--color-border)" : "transparent",
        color: active ? "var(--color-foreground)" : "var(--color-muted)",
        minWidth: "28px",
      }}
    >
      {children}
    </button>
  );
}

export interface JournalEditorProps {
  entry?: JournalEntry;
  date: DateSelection;
  onClose: () => void;
  isPrivate?: boolean;
}

export function JournalEditor({ entry, date, onClose, isPrivate = false }: JournalEditorProps) {
  const utils = api.useUtils();
  const { data: categories } = api.journalCategory.list.useQuery();

  const [title, setTitle] = useState(entry?.title ?? "");
  const [categoryId, setCategoryId] = useState(entry?.category?.id ?? "");
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: entry?.body ?? "",
    editorProps: { attributes: { class: "rich-text tiptap-editor" } },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const createMutation = api.journalEntry.create.useMutation({
    onSuccess: () => {
      void utils.journalEntry.list.invalidate();
      void utils.journalEntry.listDates.invalidate();
      onClose();
    },
  });
  const updateMutation = api.journalEntry.update.useMutation({
    onSuccess: () => {
      void utils.journalEntry.list.invalidate();
      onClose();
    },
  });
  const createCatMutation = api.journalCategory.create.useMutation({
    onSuccess: (cat) => {
      void utils.journalCategory.list.invalidate();
      setCategoryId(cat.id);
      setShowCatForm(false);
      setNewCatName("");
    },
  });

  const loading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !editor) return;
    const body = editor.getHTML();
    if (entry) {
      updateMutation.mutate({
        id: entry.id,
        title: title.trim(),
        body,
        categoryId: categoryId || null,
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        body,
        year: date.year,
        month: date.month,
        day: date.day,
        categoryId: categoryId || undefined,
        isPrivate,
      });
    }
  };

  const dateLabel = new Date(date.year, date.month - 1, date.day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(28, 23, 20, 0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: "var(--color-surface-raised)",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
              {entry ? "Edit entry" : "New entry"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{dateLabel}</p>
          </div>
          <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--color-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Category row */}
            <div className="flex items-center gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ ...inputStyle, width: "auto", flex: 1 }}
              >
                <option value="">No category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCatForm((v) => !v)}
                className="text-xs px-2.5 py-2 rounded-lg transition-opacity hover:opacity-70 flex-shrink-0"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
              >
                + New
              </button>
            </div>

            {showCatForm && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "var(--color-background)", border: "1px solid var(--color-border-subtle)" }}
              >
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  style={{ ...inputStyle, width: "auto", flex: 1 }}
                />
                {/* Color presets */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: newCatColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!newCatName.trim() || createCatMutation.isPending}
                  onClick={() => createCatMutation.mutate({ name: newCatName.trim(), color: newCatColor })}
                  className="text-xs px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                  style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
                >
                  Add
                </button>
              </div>
            )}

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              required
              autoFocus
              style={{ ...inputStyle, fontSize: "16px", fontWeight: 500 }}
            />

            {/* Rich text editor */}
            <div
              style={{ border: "1px solid var(--color-border)", borderRadius: "8px", overflow: "hidden" }}
            >
              {/* Toolbar */}
              <div
                className="flex items-center gap-0.5 px-2 py-1.5"
                style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "var(--color-background)" }}
              >
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  active={editor?.isActive("bold")}
                  title="Bold"
                >
                  <strong>B</strong>
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  active={editor?.isActive("italic")}
                  title="Italic"
                >
                  <em>I</em>
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  active={editor?.isActive("underline")}
                  title="Underline"
                >
                  <span style={{ textDecoration: "underline" }}>U</span>
                </ToolbarBtn>
                <div className="w-px h-4 mx-1.5 flex-shrink-0" style={{ background: "var(--color-border)" }} />
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  active={editor?.isActive("bulletList")}
                  title="Bullet list"
                >
                  ≡
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  active={editor?.isActive("orderedList")}
                  title="Numbered list"
                >
                  1.
                </ToolbarBtn>
              </div>
              {/* Editor area */}
              <div
                className="px-3 py-3 cursor-text"
                style={{ minHeight: "180px" }}
                onClick={() => editor?.commands.focus()}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex gap-3 px-5 py-4"
            style={{ borderTop: "1px solid var(--color-border-subtle)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-lg transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", background: "transparent", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2 text-sm rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
            >
              {loading ? "Saving…" : entry ? "Update entry" : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
