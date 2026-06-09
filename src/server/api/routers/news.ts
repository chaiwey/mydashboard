import Parser from "rss-parser";
import { createTRPCRouter, publicProcedure } from "../trpc";

const parser = new Parser({ timeout: 8000 });

const FEEDS = [
  { name: "BBC News",      url: "https://feeds.bbci.co.uk/news/rss.xml" },
  { name: "Al Jazeera",   url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NPR",           url: "https://feeds.npr.org/1001/rss.xml" },
  { name: "The Guardian",  url: "https://www.theguardian.com/world/rss" },
];

export type NewsArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
};

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

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

export const newsRouter = createTRPCRouter({
  getTopNews: publicProcedure.query(async (): Promise<NewsArticle[]> => {
    const results = await Promise.allSettled(
      FEEDS.map(async ({ name, url }) => {
        const feed = await parser.parseURL(url);
        return feed.items.slice(0, 12).map((item): NewsArticle => ({
          title: stripHtml(item.title ?? ""),
          description: truncate(stripHtml(item.contentSnippet ?? item.summary ?? ""), 220),
          link: item.link ?? "",
          pubDate: item.isoDate ?? item.pubDate ?? "",
          source: name,
        }));
      })
    );

    const articles = results
      .filter((r): r is PromiseFulfilledResult<NewsArticle[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .filter((a) => a.title && a.link);

    articles.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    });

    return articles;
  }),
});
