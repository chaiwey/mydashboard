"use client";

import { api } from "@/trpc/react";
import { useState } from "react";

const PRESET_COLORS = [
  "#c0392b", "#e67e22", "#d4ac0d", "#27ae60",
  "#16a085", "#2980b9", "#8e44ad", "#e91e8c",
  "#7f8c8d", "#2c3e50", "#a04000", "#0e6655",
];

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

export function CategoriesManager() {
  const utils = api.useUtils();
  const { data: categories, isLoading } = api.category.list.useQuery();

  const createMutation = api.category.create.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); setName(""); },
  });
  const deleteMutation = api.category.delete.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
  });

  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[5]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), color });
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl p-5" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{  color: "var(--color-foreground)" }}>
          New category
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Math class" required style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-muted)" }}>Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer" style={{ border: "1px solid var(--color-border)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>{color}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
            className="w-full py-2 text-sm rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
          >
            {createMutation.isPending ? "Creating…" : "Create category"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          <h2 className="text-sm font-semibold" style={{  color: "var(--color-foreground)" }}>Your categories</h2>
        </div>

        {isLoading && (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--color-border-subtle)" }} />)}
          </div>
        )}

        {!isLoading && (!categories || categories.length === 0) && (
          <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--color-muted)" }}>No categories yet.</p>
        )}

        {categories && categories.length > 0 && (
          <ul>
            {categories.map((cat, i) => (
              <li
                key={cat.id}
                className="flex items-center gap-3 px-5 py-3"
                style={{ borderTop: i > 0 ? "1px solid var(--color-border-subtle)" : "none" }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm" style={{ color: "var(--color-foreground)" }}>{cat.name}</span>
                <span className="text-xs" style={{ color: "var(--color-muted)" }}>{cat._count.todos} task{cat._count.todos !== 1 ? "s" : ""}</span>
                {deleteConfirm === cat.id ? (
                  <>
                    <button onClick={() => { deleteMutation.mutate({ id: cat.id }); setDeleteConfirm(null); }} className="text-xs px-2 py-1 rounded transition-opacity" style={{ background: "rgba(192,57,43,0.1)", color: "#c0392b" }}>
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--color-muted)" }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(cat.id)} className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--color-muted)" }}>
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
