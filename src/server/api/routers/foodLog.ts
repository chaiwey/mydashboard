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
