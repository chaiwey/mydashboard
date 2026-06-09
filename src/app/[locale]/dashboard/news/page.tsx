"use client";

import { api } from "@/trpc/react";
import { generateBriefing, type NewsArticle, ALL_SOURCE_NAMES, SOURCE_COLORS } from "@/lib/news-briefing";
import { useState } from "react";

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}


// ── Daily Briefing ────────────────────────────────────────────────────────────

function DailyBriefing({ articles }: { articles: NewsArticle[] }) {
  const [expanded, setExpanded] = useState(true);
  const briefing = generateBriefing(articles);
  if (!briefing) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-opacity hover:opacity-80"
      >
        <div className="flex items-center gap-3 text-left">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
            style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)" }}
          >
            📰
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Daily Briefing</div>
            <div className="text-xs" style={{ color: "var(--color-muted)" }}>{today}</div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          style={{ color: "var(--color-muted)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="pt-4 space-y-2">
            {briefing.split("\n").map((line, i) =>
              line === "" ? (
                <div key={i} className="h-1" />
              ) : (
                <p
                  key={i}
                  className="text-sm leading-relaxed"
                  style={{
                    color: "var(--color-foreground)",
                    fontStyle: line.startsWith("Good ") || line.startsWith("Those ") ? "italic" : "normal",
                    opacity: line.startsWith("Good ") || line.startsWith("Those ") ? 0.7 : 1,
                  }}
                >
                  {line}
                </p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: NewsArticle }) {
  const color = SOURCE_COLORS[article.source] ?? "#64748b";
  const ago = timeAgo(article.pubDate);

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl p-4 transition-opacity hover:opacity-80 group"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: color + "18", color }}
        >
          {article.source}
        </span>
        {ago && (
          <span className="text-xs" style={{ color: "var(--color-muted)", opacity: 0.6 }}>{ago}</span>
        )}
      </div>
      <h3
        className="text-sm font-semibold leading-snug mb-1.5 group-hover:underline"
        style={{ color: "var(--color-foreground)" }}
      >
        {article.title}
      </h3>
      {article.description && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {article.description}
        </p>
      )}
    </a>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-4 space-y-2 animate-pulse"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      <div className="h-3 w-20 rounded-full" style={{ background: "var(--color-border)" }} />
      <div className="h-4 w-full rounded" style={{ background: "var(--color-border)" }} />
      <div className="h-4 w-3/4 rounded" style={{ background: "var(--color-border)" }} />
      <div className="h-3 w-full rounded" style={{ background: "var(--color-border-subtle)" }} />
      <div className="h-3 w-5/6 rounded" style={{ background: "var(--color-border-subtle)" }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FIFTEEN_MIN = 15 * 60 * 1000;

export default function NewsPage() {
  const utils = api.useUtils();

  const { data: prefs } = api.news.getPreferences.useQuery();
  const enabledSources = prefs?.enabledSources ?? [...ALL_SOURCE_NAMES];

  const setPreferences = api.news.setPreferences.useMutation({
    onSuccess: () => void utils.news.getTopNews.invalidate(),
  });

  const toggleSource = (name: string) => {
    const next = enabledSources.includes(name)
      ? enabledSources.filter((s) => s !== name)
      : [...enabledSources, name];
    if (next.length === 0) return;
    setPreferences.mutate({ enabledSources: next });
  };

  const { data: articles, isLoading, isError, dataUpdatedAt, refetch } = api.news.getTopNews.useQuery(undefined, {
    refetchInterval: FIFTEEN_MIN,
    staleTime: FIFTEEN_MIN,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-foreground)", fontFamily: "var(--font-display)" }}
          >
            Top News
          </h1>
          {lastUpdated && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              Updated {lastUpdated} · auto-refreshes every 15 min
            </p>
          )}
        </div>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Source toggles */}
      <div className="flex flex-wrap gap-2">
        {ALL_SOURCE_NAMES.map((name) => {
          const active = enabledSources.includes(name);
          const color = SOURCE_COLORS[name] ?? "#64748b";
          const isLast = active && enabledSources.length === 1;
          return (
            <button
              key={name}
              onClick={() => toggleSource(name)}
              disabled={isLast || setPreferences.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40"
              style={{
                background: active ? color + "18" : "var(--color-surface-raised)",
                color: active ? color : "var(--color-muted)",
                border: `1px solid ${active ? color + "55" : "var(--color-border)"}`,
              }}
              title={isLast ? "At least one source must be enabled" : undefined}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: active ? color : "var(--color-border)" }}
              />
              {name}
            </button>
          );
        })}
      </div>

      {/* Daily Briefing */}
      {articles && articles.length > 0 && <DailyBriefing articles={articles} />}
      {isLoading && (
        <div
          className="rounded-2xl p-5 animate-pulse"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", height: "120px" }}
        />
      )}

      {/* Error state */}
      {isError && (
        <div
          className="rounded-xl px-5 py-4 text-sm"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)", color: "var(--color-muted)" }}
        >
          Could not load news feeds. Check your connection and try refreshing.
        </div>
      )}

      {/* Article feed */}
      <div className="space-y-3">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {articles?.map((article, i) => (
          <ArticleCard key={`${article.source}-${i}`} article={article} />
        ))}

        {!isLoading && articles?.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-muted)" }}>
            No articles loaded. Some feeds may be temporarily unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
