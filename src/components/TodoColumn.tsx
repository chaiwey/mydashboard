"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { TodoCard } from "./TodoCard";
import { TodoForm } from "./TodoForm";
import { NotificationPermission } from "./NotificationPermission";

type TodoKind = "task" | "exam";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  dueDate: Date | null;
  completed: boolean;
  category: { id: string; name: string; color: string } | null;
};

interface Props {
  kind: TodoKind;
  categoryId?: string;
  showNotificationPrompt?: boolean;
}

const LABELS: Record<TodoKind, { heading: string; button: string; empty: string }> = {
  task: { heading: "Tasks", button: "New task", empty: "No tasks yet." },
  exam: { heading: "Exams", button: "New exam", empty: "No exams yet." },
};

export function TodoColumn({ kind, categoryId, showNotificationPrompt }: Props) {
  const { data: todos, isLoading } = api.todo.list.useQuery({ kind, categoryId });
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();

  const openCreate = () => { setEditingTodo(undefined); setShowForm(true); };
  const openEdit = (todo: Todo) => { setEditingTodo(todo); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingTodo(undefined); };

  const activeTodos = todos?.filter((t: Todo) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t: Todo) => t.completed) ?? [];
  const label = LABELS[kind];

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>
          {label.heading}
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {label.button}
        </button>
      </div>

      {showNotificationPrompt && <NotificationPermission />}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }} />
          ))}
        </div>
      )}

      {!isLoading && activeTodos.length === 0 && completedTodos.length === 0 && (
        <p className="text-sm py-8 text-center" style={{ color: "var(--color-muted)" }}>{label.empty}</p>
      )}

      {activeTodos.length > 0 && (
        <div className="space-y-2 mb-5">
          {activeTodos.map((todo: Todo) => (
            <TodoCard key={todo.id} todo={todo} onEdit={openEdit} />
          ))}
        </div>
      )}

      {completedTodos.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-muted)", opacity: 0.5 }}>
            Completed ({completedTodos.length})
          </p>
          <div className="space-y-2">
            {completedTodos.map((todo: Todo) => (
              <TodoCard key={todo.id} todo={todo} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {showForm && <TodoForm todo={editingTodo} defaultKind={kind} onClose={closeForm} />}
    </div>
  );
}
