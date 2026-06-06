"use client";

import { api } from "@/trpc/react";
import { CategoryBadge } from "./CategoryBadge";
import { getDaysRemaining, getDaysLabel, getDaysColor } from "@/lib/daysRemaining";
import { useState } from "react";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  completed: boolean;
  category: { id: string; name: string; color: string } | null;
};

interface Props {
  todo: Todo;
  onEdit: (todo: Todo) => void;
}

export function TodoCard({ todo, onEdit }: Props) {
  const utils = api.useUtils();
  const [deleting, setDeleting] = useState(false);

  const toggleMutation = api.todo.toggleComplete.useMutation({
    onSuccess: () => utils.todo.list.invalidate(),
  });
  const deleteMutation = api.todo.delete.useMutation({
    onSuccess: () => utils.todo.list.invalidate(),
  });

  const days = getDaysRemaining(todo.dueDate);

  return (
    <div
      className="flex gap-3 px-4 py-3.5 rounded-xl group transition-all"
      style={{
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border-subtle)",
        opacity: todo.completed ? 0.55 : 1,
      }}
    >
      <button
        onClick={() => toggleMutation.mutate({ id: todo.id, completed: !todo.completed })}
        className="mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          borderColor: todo.completed ? "#9e8a72" : "var(--color-border)",
          backgroundColor: todo.completed ? "#9e8a72" : "transparent",
        }}
      >
        {todo.completed && (
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm leading-snug"
            style={{
              color: todo.completed ? "var(--color-muted)" : "var(--color-foreground)",
              textDecoration: todo.completed ? "line-through" : "none",
              
            }}
          >
            {todo.title}
          </p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(todo)} className="p-1 rounded transition-opacity hover:opacity-70" style={{ color: "var(--color-muted)" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={async () => { setDeleting(true); await deleteMutation.mutateAsync({ id: todo.id }); }}
              disabled={deleting}
              className="p-1 rounded transition-opacity hover:opacity-70"
              style={{ color: "var(--color-muted)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {todo.description && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted)" }}>{todo.description}</p>
        )}

        {(todo.category || days !== null) && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {todo.category && <CategoryBadge name={todo.category.name} color={todo.category.color} />}
            {days !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDaysColor(days)}`}>
                {getDaysLabel(days)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
