"use client";

import { useState } from "react";
import { WeeklySchedule } from "@/components/fitness/WeeklySchedule";
import { NutritionTracker } from "@/components/fitness/NutritionTracker";

type Tab = "gym" | "nutrition";

export default function FitnessPage() {
  const [tab, setTab] = useState<Tab>("gym");

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1">
        {(["gym", "nutrition"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
            style={{
              background: tab === t ? "var(--color-accent)" : "transparent",
              color: tab === t ? "var(--color-surface-raised)" : "var(--color-muted)",
              border: tab === t ? "none" : "1px solid var(--color-border)",
            }}
          >
            {t === "gym" ? "Gym Schedule" : "Nutrition"}
          </button>
        ))}
      </div>

      {tab === "gym" && <WeeklySchedule />}
      {tab === "nutrition" && <NutritionTracker />}
    </div>
  );
}
