"use client";

import { useState } from "react";

const ACTIVITY_LEVELS = [
  { value: "sedentary",  label: "Sedentary (little/no exercise)",      factor: 1.2 },
  { value: "light",      label: "Lightly active (1–3 days/week)",      factor: 1.375 },
  { value: "moderate",   label: "Moderately active (3–5 days/week)",   factor: 1.55 },
  { value: "active",     label: "Very active (6–7 days/week)",          factor: 1.725 },
  { value: "veryActive", label: "Super active (2× daily training)",     factor: 1.9 },
];

const GOALS = [
  { value: "lose1_5", label: "Lose 1.5 lb/week", delta: -750 },
  { value: "lose1",   label: "Lose 1 lb/week",   delta: -500 },
  { value: "lose0_5", label: "Lose 0.5 lb/week", delta: -250 },
  { value: "maintain",label: "Maintain weight",  delta: 0 },
  { value: "gain0_5", label: "Gain 0.5 lb/week", delta: 250 },
];

const inputStyle: React.CSSProperties = {
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  color: "var(--color-foreground)",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "13px",
  outline: "none",
  width: "100%",
};

interface Props {
  onSetGoals: (calorieGoal: number, proteinGoal: number) => void;
}

export function CalorieCalculator({ onSetGoals }: Props) {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("maintain");

  type Result = { bmr: number; tdee: number; target: number; protein: number };
  const [result, setResult] = useState<Result | null>(null);

  const calculate = () => {
    const heightCm = (parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54;
    const weightKg = parseFloat(weightLbs) * 0.453592;
    const ageNum = parseInt(age);

    if (!heightCm || !weightKg || !ageNum) return;

    const bmr =
      sex === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;

    const actFactor = ACTIVITY_LEVELS.find((a) => a.value === activity)?.factor ?? 1.55;
    const tdee = bmr * actFactor;
    const delta = GOALS.find((g) => g.value === goal)?.delta ?? 0;
    const target = tdee + delta;
    const protein = Math.round(parseFloat(weightLbs) * 0.8);

    setResult({ bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target), protein });
  };

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      {/* Sex toggle */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Sex</label>
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSex(s)}
              className="flex-1 py-1.5 text-sm capitalize transition-colors"
              style={{
                background: sex === s ? "var(--color-accent)" : "transparent",
                color: sex === s ? "var(--color-surface-raised)" : "var(--color-muted)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Age + height + weight */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Age</label>
          <input value={age} onChange={(e) => setAge(e.target.value)} type="number" min="10" max="100" placeholder="25" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Weight (lb)</label>
          <input value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} type="number" min="50" placeholder="165" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Height</label>
          <div className="flex gap-1">
            <input value={heightFt} onChange={(e) => setHeightFt(e.target.value)} type="number" min="3" max="8" placeholder="5 ft" style={{ ...inputStyle, flex: 1 }} />
            <input value={heightIn} onChange={(e) => setHeightIn(e.target.value)} type="number" min="0" max="11" placeholder="10 in" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Activity level</label>
          <select value={activity} onChange={(e) => setActivity(e.target.value)} style={{ ...inputStyle, fontFamily: "inherit" }}>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Goal</label>
        <div className="flex flex-wrap gap-1.5">
          {GOALS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGoal(g.value)}
              className="text-xs px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: goal === g.value ? "var(--color-accent)" : "var(--color-background)",
                color: goal === g.value ? "var(--color-surface-raised)" : "var(--color-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={!age || !weightLbs || !heightFt}
        className="w-full py-2 text-sm rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
      >
        Calculate
      </button>

      {/* Result */}
      {result && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "var(--color-background)", border: "1px solid var(--color-border-subtle)" }}
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-muted)", opacity: 0.6 }}>BMR</div>
              <div className="text-lg font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>{result.bmr}</div>
              <div className="text-xs" style={{ color: "var(--color-muted)" }}>kcal/day</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Maintenance</div>
              <div className="text-lg font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}>{result.tdee}</div>
              <div className="text-xs" style={{ color: "var(--color-muted)" }}>kcal/day</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-muted)", opacity: 0.6 }}>Target</div>
              <div className="text-xl font-bold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)" }}>{result.target}</div>
              <div className="text-xs" style={{ color: "var(--color-muted)" }}>kcal/day</div>
            </div>
          </div>
          <div className="text-xs text-center pt-1" style={{ color: "var(--color-muted)" }}>
            Suggested protein: <strong>{result.protein}g/day</strong> (0.8× body weight)
          </div>
          <button
            onClick={() => onSetGoals(result.target, result.protein)}
            className="w-full py-2 text-sm rounded-lg transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--color-accent)", color: "var(--color-accent)", background: "transparent", fontFamily: "inherit" }}
          >
            Set as my goals
          </button>
        </div>
      )}
    </div>
  );
}
