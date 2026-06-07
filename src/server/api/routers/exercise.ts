import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const exerciseInput = z.object({
  name: z.string().min(1).max(200),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weightLbs: z.number().min(0).optional(),
});

export const exerciseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(exerciseInput.extend({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.db.exercise.count({ where: { sessionId: input.sessionId } });
      return ctx.db.exercise.create({ data: { ...input, order: count } });
    }),

  update: protectedProcedure
    .input(exerciseInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const exercise = await ctx.db.exercise.findFirst({
        where: { id },
        include: { session: { include: { workoutDay: { select: { userId: true } } } } },
      });
      if (exercise?.session.workoutDay.userId !== ctx.session.user.id) throw new Error("Not found");
      return ctx.db.exercise.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const exercise = await ctx.db.exercise.findFirst({
        where: { id: input.id },
        include: { session: { include: { workoutDay: { select: { userId: true } } } } },
      });
      if (exercise?.session.workoutDay.userId !== ctx.session.user.id) throw new Error("Not found");
      return ctx.db.exercise.delete({ where: { id: input.id } });
    }),
});
