import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateString(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export const journalEntryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number(), day: z.number(), isPrivate: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const { year, month, day, isPrivate } = input;
      const from = utcDate(year, month, day);
      const to = utcDate(year, month, day + 1);
      return ctx.db.journalEntry.findMany({
        where: { userId: ctx.session.user.id, entryDate: { gte: from, lt: to }, isPrivate },
        include: { category: true },
        orderBy: { createdAt: "asc" },
      });
    }),

  listDates: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number(), isPrivate: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      const { year, month, isPrivate } = input;
      const from = utcDate(year, month, 1);
      const to = utcDate(year, month + 1, 1);
      const entries = await ctx.db.journalEntry.findMany({
        where: { userId: ctx.session.user.id, entryDate: { gte: from, lt: to }, isPrivate },
        select: { entryDate: true },
      });
      const seen = new Set<string>();
      return entries.flatMap((e) => {
        const s = toDateString(e.entryDate);
        if (seen.has(s)) return [];
        seen.add(s);
        return [s];
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        body: z.string(),
        year: z.number(),
        month: z.number(),
        day: z.number(),
        categoryId: z.string().optional(),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { year, month, day, ...rest } = input;
      return ctx.db.journalEntry.create({
        data: { ...rest, entryDate: utcDate(year, month, day), userId: ctx.session.user.id },
        include: { category: true },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(500).optional(),
        body: z.string().optional(),
        categoryId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.journalEntry.update({
        where: { id, userId: ctx.session.user.id },
        data,
        include: { category: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.journalEntry.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      })
    ),
});
