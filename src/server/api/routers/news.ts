import Parser from "rss-parser";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ALL_SOURCE_NAMES, deduplicateArticles, type NewsArticle } from "@/lib/news-briefing";

const parser = new Parser({ timeout: 8000 });

const FEEDS: { name: string; url: string }[] = [
  { name: "BBC News",     url: "https://feeds.bbci.co.uk/news/rss.xml" },
  { name: "Al Jazeera",  url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "NPR",          url: "https://feeds.npr.org/1001/rss.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { name: "NYT",          url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
  { name: "Fox News",     url: "https://moxie.foxnews.com/google-publisher/latest.xml" },
];

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export const newsRouter = createTRPCRouter({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const pref = await ctx.db.newsPreference.findUnique({ where: { userId: ctx.session.user.id } });
    return { enabledSources: pref?.enabledSources ?? [...ALL_SOURCE_NAMES] };
  }),

  setPreferences: protectedProcedure
    .input(z.object({ enabledSources: z.array(z.string()).min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.newsPreference.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id, enabledSources: input.enabledSources },
        update: { enabledSources: input.enabledSources },
      })
    ),

  getTopNews: protectedProcedure.query(async ({ ctx }): Promise<NewsArticle[]> => {
    const pref = await ctx.db.newsPreference.findUnique({ where: { userId: ctx.session.user.id } });
    const enabled = new Set(pref?.enabledSources ?? [...ALL_SOURCE_NAMES]);
    const activeFeeds = FEEDS.filter((f) => enabled.has(f.name));

    const results = await Promise.allSettled(
      activeFeeds.map(async ({ name, url }) => {
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

    return deduplicateArticles(articles);
  }),
});
