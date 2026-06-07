"use client";

import { api } from "@/trpc/react";
import { useState, useEffect } from "react";

type TodoKind = "task" | "exam";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  dueDate: Date | null;
  category: { id: string; name: string; color: string } | null;
};

interface Props {
  todo?: Todo;
  defaultKind?: TodoKind;
  onClose: () => void;
}

function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

const inputStyle = {
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

const TIME_PRESETS = [
  { label: "11:59 PM", hours: 23, minutes: 59 },
  { label: "11:00 PM", hours: 23, minutes: 0 },
];

export function TodoForm({ todo, defaultKind = "task", onClose }: Props) {
  const utils = api.useUtils();
  const { data: categories } = api.category.list.useQuery();

  const [kind, setKind] = useState<TodoKind>((todo?.kind as TodoKind) ?? defaultKind);
  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(todo?.dueDate));
  const [categoryId, setCategoryId] = useState(todo?.category?.id ?? "");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const createMutation = api.todo.create.useMutation({
    onSuccess: () => { utils.todo.list.invalidate(); onClose(); },
  });
  const updateMutation = api.todo.update.useMutation({
    onSuccess: () => { utils.todo.list.invalidate(); onClose(); },
  });

  const loading = createMutation.isPending || updateMutation.isPending;

  const applyTimePreset = (hours: number, minutes: number) => {
    const datePart = dueDate
      ? dueDate.split("T")[0]
      : new Date().toISOString().split("T")[0];
    const h = hours.toString().padStart(2, "0");
    const m = minutes.toString().padStart(2, "0");
    setDueDate(`${datePart}T${h}:${m}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      kind,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      categoryId: categoryId || undefined,
    };
    if (todo) updateMutation.mutate({ id: todo.id, ...data });
    else createMutation.mutate(data);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(28, 23, 20, 0.35)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--color-foreground)" }}>
            {todo ? "Edit" : "New"} {kind}
          </h2>
          <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--color-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Kind toggle — only show when creating */}
          {!todo && (
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
              {(["task", "exam"] as TodoKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className="flex-1 py-1.5 text-xs font-medium capitalize transition-colors"
                  style={{
                    background: kind === k ? "var(--color-accent)" : "transparent",
                    color: kind === k ? "var(--color-surface-raised)" : "var(--color-muted)",
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "exam" ? "Exam name" : "Task title"} required autoFocus style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" rows={2} style={{ ...inputStyle, resize: "none" }} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Due date & time</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
            <div className="flex gap-2 mt-2">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyTimePreset(p.hours, p.minutes)}
                  className="text-xs px-2.5 py-1 rounded-md transition-colors"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", background: "var(--color-background)" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
              <option value="">None</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm rounded-lg transition-opacity hover:opacity-70" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", background: "transparent", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()} className="flex-1 py-2 text-sm rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40" style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}>
              {loading ? "Saving…" : todo ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
