import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

const workoutTypeEnum = z.enum(["push", "pull", "legs", "cardio", "rest", "other"]);

export const workoutDayRouter = createTRPCRouter({
  listWeek: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number(), day: z.number() }))
    .query(async ({ ctx, input }) => {
      const { year, month, day } = input;
      const weekStart = utcDate(year, month, day);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      return ctx.db.workoutDay.findMany({
        where: { userId: ctx.session.user.id, date: { gte: weekStart, lt: weekEnd } },
        include: { exercises: { orderBy: { order: "asc" } } },
        orderBy: { date: "asc" },
      });
    }),

  upsert: protectedProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
      day: z.number(),
      workoutType: workoutTypeEnum,
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { year, month, day, ...rest } = input;
      const date = utcDate(year, month, day);
      return ctx.db.workoutDay.upsert({
        where: { userId_date: { userId: ctx.session.user.id, date } },
        create: { date, userId: ctx.session.user.id, ...rest },
        update: rest,
        include: { exercises: { orderBy: { order: "asc" } } },
      });
    }),

  toggleComplete: protectedProcedure
    .input(z.object({
      year: z.number(),
      month: z.number(),
      day: z.number(),
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { year, month, day, completed } = input;
      const date = utcDate(year, month, day);
      return ctx.db.workoutDay.upsert({
        where: { userId_date: { userId: ctx.session.user.id, date } },
        create: { date, userId: ctx.session.user.id, completed, workoutType: "other" },
        update: { completed },
        include: { exercises: { orderBy: { order: "asc" } } },
      });
    }),
});
