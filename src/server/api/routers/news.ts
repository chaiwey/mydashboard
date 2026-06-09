import Parser from "rss-parser";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { NewsArticle } from "@/lib/news-briefing";

const parser = new Parser({ timeout: 8000 });

const FEEDS = [
  { name: "BBC News",     url: "https://feeds.bbci.co.uk/news/rss.xml" },
  { name: "Al Jazeera",  url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NPR",          url: "https://feeds.npr.org/1001/rss.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
];

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
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
