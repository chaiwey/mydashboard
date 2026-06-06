"use client";

import { api } from "@/trpc/react";
import { useState, useEffect } from "react";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  category: { id: string; name: string; color: string } | null;
};

interface Props {
  todo?: Todo;
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

export function TodoForm({ todo, onClose }: Props) {
  const utils = api.useUtils();
  const { data: categories } = api.category.list.useQuery();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
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
          <h2 className="text-base font-semibold" style={{  color: "var(--color-foreground)" }}>
            {todo ? "Edit task" : "New task"}
          </h2>
          <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--color-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Due date</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
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
          </div>

          <div className="flex gap-3 pt-1">
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
              {loading ? "Saving…" : todo ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
