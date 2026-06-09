import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

const mealEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const logInput = z.object({
  meal: mealEnum,
  name: z.string().min(1).max(300),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0),
});

export const foodLogRouter = createTRPCRouter({
  listDay: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number(), day: z.number() }))
    .query(async ({ ctx, input }) => {
      const { year, month, day } = input;
      const from = utcDate(year, month, day);
      const to = utcDate(year, month, day + 1);
      return ctx.db.foodLog.findMany({
        where: { userId: ctx.session.user.id, date: { gte: from, lt: to } },
        orderBy: [{ meal: "asc" }, { createdAt: "asc" }],
      });
    }),

  calorieStreak: protectedProcedure.query(async ({ ctx }) => {
    const goal = await ctx.db.nutritionGoal.findUnique({ where: { userId: ctx.session.user.id } });
    const calorieGoal = goal?.calorieGoal ?? 2000;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    ninetyDaysAgo.setUTCHours(0, 0, 0, 0);

    const logs = await ctx.db.foodLog.findMany({
      where: { userId: ctx.session.user.id, date: { gte: ninetyDaysAgo } },
      select: { date: true, calories: true },
    });

    const byDate = new Map<string, number>();
    for (const log of logs) {
      const key = `${log.date.getUTCFullYear()}-${log.date.getUTCMonth()}-${log.date.getUTCDate()}`;
      byDate.set(key, (byDate.get(key) ?? 0) + log.calories);
    }

    let streak = 0;
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < 90; i++) {
      const d = new Date(todayUTC.getTime() - i * 86_400_000);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const dayTotal = byDate.get(key);

      if (dayTotal === undefined) {
        if (i === 0) continue; // today not yet logged — don't break streak
        break;
      }
      if (dayTotal >= calorieGoal) break;
      streak++;
    }

    return { streak };
  }),

  create: protectedProcedure
    .input(logInput.extend({ year: z.number(), month: z.number(), day: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { year, month, day, ...rest } = input;
      return ctx.db.foodLog.create({
        data: { ...rest, date: utcDate(year, month, day), userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(logInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.foodLog.update({
        where: { id, userId: ctx.session.user.id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.foodLog.delete({ where: { id: input.id, userId: ctx.session.user.id } })
    ),
});
