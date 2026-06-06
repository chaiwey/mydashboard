"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (next: string) => {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1 px-3">
      {(["en", "zh"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className="text-xs px-2 py-1 rounded transition-opacity"
          style={{
            background: locale === l ? "var(--color-border)" : "transparent",
            color: locale === l ? "var(--color-foreground)" : "var(--color-muted)",
            fontFamily: "inherit",
          }}
        >
          {l === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}
