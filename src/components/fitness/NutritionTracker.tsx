"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { addDays } from "date-fns";
import { CalorieCalculator } from "./CalorieCalculator";

type DateSel = { year: number; month: number; day: number };

function todaySel(): DateSel {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() };
}

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
type Meal = (typeof MEALS)[number];
const MEAL_LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

const inputStyle: React.CSSProperties = {
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  color: "var(--color-foreground)",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "13px",
  outline: "none",
};

function CircleChart({ value, max, color, label, unit }: { value: number; max: number; color: string; label: string; unit: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ * (1 - pct);
  const over = value > max && max > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="110" height="110" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={over ? "#ef4444" : color}
            strokeWidth="9"
            strokeDasharray={`${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
          <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--color-foreground)">{value}</text>
          <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--color-muted)">/ {max} {unit}</text>
        </svg>
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>{label}</span>
    </div>
  );
}

export function NutritionTracker() {
  const [date, setDate] = useState<DateSel>(todaySel);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  // Food form state
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [presetSearch, setPresetSearch] = useState("");

  // Goal edit state
  const [goalCal, setGoalCal] = useState("");
  const [goalPro, setGoalPro] = useState("");

  // Preset form state
  const [presetName, setPresetName] = useState("");
  const [presetCal, setPresetCal] = useState("");
  const [presetPro, setPresetPro] = useState("");

  const utils = api.useUtils();
  const invalidate = () => void utils.foodLog.listDay.invalidate();

  const { data: logs } = api.foodLog.listDay.useQuery(date);
  const { data: goal } = api.nutritionGoal.get.useQuery();
  const { data: presets } = api.mealPreset.list.useQuery();
  const { data: streakData } = api.foodLog.calorieStreak.useQuery();

  const calorieGoal = goal?.calorieGoal ?? 2000;
  const proteinGoal = goal?.proteinGoal ?? 150;

  const totalCal = (logs ?? []).reduce((s, l) => s + l.calories, 0);
  const totalPro = (logs ?? []).reduce((s, l) => s + l.proteinG, 0);

  const createLog = api.foodLog.create.useMutation({ onSuccess: () => { invalidate(); resetForm(); setShowAddForm(false); } });
  const updateLog = api.foodLog.update.useMutation({ onSuccess: () => { invalidate(); setEditingId(null); resetForm(); } });
  const deleteLog = api.foodLog.delete.useMutation({ onSuccess: invalidate });
  const upsertGoal = api.nutritionGoal.upsert.useMutation({ onSuccess: () => { void utils.nutritionGoal.get.invalidate(); setShowGoalEdit(false); } });

  const createPreset = api.mealPreset.create.useMutation({
    onSuccess: () => {
      void utils.mealPreset.list.invalidate();
      setPresetName(""); setPresetCal(""); setPresetPro("");
    },
  });
  const deletePreset = api.mealPreset.delete.useMutation({ onSuccess: () => void utils.mealPreset.list.invalidate() });

  const resetForm = () => { setFoodName(""); setCalories(""); setProtein(""); setPresetSearch(""); };

  const handleSubmit = () => {
    if (!foodName.trim() || !calories) return;
    const data = {
      meal,
      name: foodName.trim(),
      calories: parseInt(calories),
      proteinG: protein ? parseFloat(protein) : 0,
    };
    if (editingId) {
      updateLog.mutate({ id: editingId, ...data });
    } else {
      createLog.mutate({ ...date, ...data });
    }
  };

  const handleEdit = (log: NonNullable<typeof logs>[0]) => {
    setMeal(log.meal as Meal);
    setFoodName(log.name);
    setCalories(log.calories.toString());
    setProtein(log.proteinG.toString());
    setEditingId(log.id);
    setPresetSearch("");
    setShowAddForm(true);
  };

  const applyPreset = (p: { name: string; calories: number; proteinG: number }) => {
    setFoodName(p.name);
    setCalories(p.calories.toString());
    setProtein(p.proteinG.toString());
    setPresetSearch("");
  };

  const prevDay = () => {
    const d = new Date(date.year, date.month - 1, date.day);
    const prev = addDays(d, -1);
    setDate({ year: prev.getFullYear(), month: prev.getMonth() + 1, day: prev.getDate() });
  };
  const nextDay = () => {
    const d = new Date(date.year, date.month - 1, date.day);
    const next = addDays(d, 1);
    setDate({ year: next.getFullYear(), month: next.getMonth() + 1, day: next.getDate() });
  };

  const dateLabel = new Date(date.year, date.month - 1, date.day).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const logsByMeal = (m: Meal) => (logs ?? []).filter((l) => l.meal === m);

  const filteredPresets = (presets ?? []).filter((p) =>
    p.name.toLowerCase().includes(presetSearch.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-full">
      {/* Left: main tracker */}
      <div className="flex-1 space-y-6 min-w-0 overflow-y-auto pb-4">
        {/* Date navigation */}
        <div className="flex items-center gap-3">
          <button onClick={prevDay} className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: "var(--color-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{dateLabel}</span>
          <button onClick={nextDay} className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: "var(--color-muted)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setDate(todaySel())}
            className="text-xs px-2.5 py-1 rounded-md hover:opacity-70 transition-opacity ml-1"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
          >
            Today
          </button>
        </div>

        {/* Progress circles */}
        <div
          className="rounded-2xl p-5 flex items-center justify-around"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
        >
          <CircleChart value={totalCal} max={calorieGoal} color="#f97316" label="Calories" unit="kcal" />
          <div className="text-center px-4">
            <div className="text-xs mb-3" style={{ color: "var(--color-muted)" }}>remaining</div>
            <div className="text-2xl font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>
              {Math.max(calorieGoal - totalCal, 0)}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>kcal</div>
            <button
              onClick={() => {
                setGoalCal(calorieGoal.toString());
                setGoalPro(proteinGoal.toString());
                setShowGoalEdit(!showGoalEdit);
              }}
              className="text-xs mt-3 underline hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-muted)" }}
            >
              Edit goals
            </button>
          </div>
          <CircleChart value={Math.round(totalPro)} max={proteinGoal} color="#6366f1" label="Protein" unit="g" />
        </div>

        {/* Deficit streak */}
        {(streakData?.streak ?? 0) > 0 && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
          >
            <span className="text-xl">🔥</span>
            <div>
              <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                {streakData!.streak}-day deficit streak
              </span>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                Under your calorie goal {streakData!.streak} day{streakData!.streak !== 1 ? "s" : ""} in a row
              </p>
            </div>
          </div>
        )}

        {/* Goal editor */}
        {showGoalEdit && (
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
          >
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>Calorie goal</label>
              <input value={goalCal} onChange={(e) => setGoalCal(e.target.value)} type="number" style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>Protein goal (g)</label>
              <input value={goalPro} onChange={(e) => setGoalPro(e.target.value)} type="number" style={{ ...inputStyle, width: "100%" }} />
            </div>
            <button
              onClick={() => upsertGoal.mutate({ calorieGoal: parseInt(goalCal), proteinGoal: parseInt(goalPro) })}
              disabled={!goalCal || !goalPro || upsertGoal.isPending}
              className="px-3 py-2 text-sm rounded-lg disabled:opacity-40 mt-5"
              style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
            >
              Save
            </button>
          </div>
        )}

        {/* Meal sections */}
        <div className="space-y-4">
          {MEALS.map((m) => {
            const items = logsByMeal(m);
            const mealCal = items.reduce((s, l) => s + l.calories, 0);
            return (
              <div key={m}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-muted)", opacity: 0.6 }}>
                    {MEAL_LABELS[m]}
                  </span>
                  {mealCal > 0 && (
                    <span className="text-xs" style={{ color: "var(--color-muted)" }}>{mealCal} kcal</span>
                  )}
                </div>
                {items.length > 0 && (
                  <div className="space-y-1 mb-1.5">
                    {items.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm group"
                        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
                      >
                        <span style={{ color: "var(--color-foreground)" }}>{log.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                            {log.calories} kcal · {log.proteinG}g protein
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(log)} className="text-xs" style={{ color: "var(--color-muted)" }}>✏</button>
                            <button onClick={() => deleteLog.mutate({ id: log.id })} className="text-xs" style={{ color: "var(--color-muted)" }}>✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add / Edit form */}
        {showAddForm ? (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
          >
            {/* Preset search */}
            {!editingId && (
              <div className="relative">
                <input
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search presets…"
                  style={{ ...inputStyle, width: "100%", paddingLeft: "30px" }}
                />
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--color-muted)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                {presetSearch && filteredPresets.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-10 shadow-lg"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
                  >
                    {filteredPresets.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:opacity-80 transition-opacity"
                        style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                      >
                        <span style={{ color: "var(--color-foreground)" }}>{p.name}</span>
                        <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                          {p.calories} kcal · {p.proteinG}g
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <select value={meal} onChange={(e) => setMeal(e.target.value as Meal)} style={{ ...inputStyle, flex: "none" }}>
                {MEALS.map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
              </select>
              <input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Food name"
                autoFocus={editingId !== null}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>Calories</label>
                <input value={calories} onChange={(e) => setCalories(e.target.value)} type="number" min="0" placeholder="0" style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--color-muted)" }}>Protein (g)</label>
                <input value={protein} onChange={(e) => setProtein(e.target.value)} type="number" min="0" step="0.1" placeholder="0" style={{ ...inputStyle, width: "100%" }} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowAddForm(false); setEditingId(null); resetForm(); }}
                className="flex-1 py-2 text-sm rounded-lg"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", background: "transparent", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!foodName.trim() || !calories || createLog.isPending || updateLog.isPending}
                className="flex-1 py-2 text-sm rounded-lg disabled:opacity-40"
                style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
              >
                {editingId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setEditingId(null); resetForm(); setMeal("breakfast"); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add food
          </button>
        )}

        {/* Calorie Calculator */}
        <div className="pt-2">
          <button
            onClick={() => setShowCalc(!showCalc)}
            className="flex items-center gap-2 text-sm font-medium mb-4 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-foreground)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Maintenance Calories Calculator
            <svg className={`w-3.5 h-3.5 transition-transform ${showCalc ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCalc && <CalorieCalculator onSetGoals={(cal, pro) => upsertGoal.mutate({ calorieGoal: cal, proteinGoal: pro })} />}
        </div>
      </div>

      {/* Right: Meal presets panel */}
      <div
        className="w-64 flex-shrink-0 rounded-2xl p-4 flex flex-col gap-4 self-start"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
      >
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-muted)", opacity: 0.6 }}>
          Meal Presets
        </div>

        {/* Preset list */}
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto max-h-72">
          {(presets ?? []).length === 0 && (
            <p className="text-xs" style={{ color: "var(--color-muted)", opacity: 0.5 }}>No presets yet</p>
          )}
          {(presets ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs group"
              style={{ background: "var(--color-background)", border: "1px solid var(--color-border-subtle)" }}
            >
              <div>
                <div className="font-medium" style={{ color: "var(--color-foreground)" }}>{p.name}</div>
                <div style={{ color: "var(--color-muted)" }}>{p.calories} kcal · {p.proteinG}g</div>
              </div>
              <button
                onClick={() => deletePreset.mutate({ id: p.id })}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--color-muted)" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add preset form */}
        <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="text-xs" style={{ color: "var(--color-muted)" }}>Add preset</div>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Meal name"
            style={{ ...inputStyle, width: "100%", fontSize: "12px", padding: "5px 8px" }}
          />
          <div className="flex gap-1.5">
            <input
              value={presetCal}
              onChange={(e) => setPresetCal(e.target.value)}
              placeholder="kcal"
              type="number"
              min="0"
              style={{ ...inputStyle, flex: 1, minWidth: 0, width: "auto", fontSize: "12px", padding: "5px 8px" }}
            />
            <input
              value={presetPro}
              onChange={(e) => setPresetPro(e.target.value)}
              placeholder="g protein"
              type="number"
              min="0"
              step="0.1"
              style={{ ...inputStyle, flex: 1, minWidth: 0, width: "auto", fontSize: "12px", padding: "5px 8px" }}
            />
          </div>
          <button
            onClick={() => {
              if (!presetName.trim() || !presetCal) return;
              createPreset.mutate({
                name: presetName.trim(),
                calories: parseInt(presetCal),
                proteinG: presetPro ? parseFloat(presetPro) : 0,
              });
            }}
            disabled={!presetName.trim() || !presetCal || createPreset.isPending}
            className="w-full py-1.5 text-xs rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
          >
            {createPreset.isPending ? "…" : "Save preset"}
          </button>
        </div>
      </div>
    </div>
  );
}
