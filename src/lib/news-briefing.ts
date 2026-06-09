export const ALL_SOURCE_NAMES = ["BBC News", "Al Jazeera", "NPR", "The Guardian", "NYT", "Fox News"] as const;
export type SourceName = (typeof ALL_SOURCE_NAMES)[number];

export const SOURCE_COLORS: Record<string, string> = {
  "BBC News":    "#bb1919",
  "Al Jazeera": "#c8a200",
  "NPR":         "#1a6b2b",
  "The Guardian":"#0d47a1",
  "NYT":         "#111111",
  "Fox News":    "#003366",
};

export type NewsArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
};

// ── Deduplication ─────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","is","in","on","at","to","for","of","and","or","but","as",
  "with","by","from","up","about","into","over","after","says","said","say",
  "will","has","have","had","be","been","was","were","are","its","this","that",
  "their","they","new","amid","after","after","over","under","more","than","two",
  "what","who","how","when","where","why","amid","than","also","like","just",
]);

function keyWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

export function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const kept: string[][] = [];
  return articles.filter((article) => {
    const words = keyWords(article.title);
    if (words.length === 0) return true;
    for (const seenWords of kept) {
      const overlap = words.filter((w) => seenWords.includes(w)).length;
      if (overlap >= 3) return false;
    }
    kept.push(words);
    return true;
  });
}

// ── Daily Briefing ────────────────────────────────────────────────────────────

function detectCategory(title: string): string {
  const t = title.toLowerCase();
  if (/\b(market|stock|shares|economy|gdp|inflation|trade|tariff|fed|interest rate|finance|bank|crypto|bitcoin)\b/.test(t)) return "business";
  if (/\b(tech|ai|openai|google|microsoft|apple|meta|nvidia|robot|software|app|chip|semiconductor)\b/.test(t)) return "technology";
  if (/\b(climate|environment|weather|flood|wildfire|storm|carbon|emissions|warming)\b/.test(t)) return "environment";
  if (/\b(health|virus|vaccine|covid|hospital|cancer|drug|medical|fda|who|outbreak)\b/.test(t)) return "health";
  if (/\b(sport|football|soccer|basketball|tennis|nba|nfl|olympics|world cup|match|game)\b/.test(t)) return "sports";
  return "news";
}

const CATEGORY_INTROS: Record<string, string> = {
  business:    "In business and markets",
  technology:  "In technology",
  environment: "On the environment",
  health:      "In health news",
  sports:      "In sports",
  news:        "Meanwhile",
};

const FALLBACK_INTROS = ["Also", "Meanwhile", "In other news", "And"];

export function generateBriefing(articles: NewsArticle[]): string {
  if (articles.length === 0) return "";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const top = articles.slice(0, 5);
  const [first, ...rest] = top;

  const usedCategories = new Set<string>();
  const lines = [
    `${greeting}. Here are today's top stories.`,
    "",
    `First, ${first!.title}.`,
  ];

  rest.forEach((article, idx) => {
    const cat = detectCategory(article.title);
    let intro: string;
    if (!usedCategories.has(cat) && cat !== "news") {
      intro = CATEGORY_INTROS[cat]!;
      usedCategories.add(cat);
    } else {
      intro = FALLBACK_INTROS[idx % FALLBACK_INTROS.length]!;
    }
    lines.push("", `${intro}, ${article.title}.`);
  });

  lines.push("", "Those are today's top headlines.");
  return lines.join("\n");
}
