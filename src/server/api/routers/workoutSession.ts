import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const workoutSessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      workoutDayId: z.string(),
      name: z.string().min(1).max(200),
      durationHours: z.number().min(0.5).max(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const day = await ctx.db.workoutDay.findFirst({
        where: { id: input.workoutDayId, userId: ctx.session.user.id },
      });
      if (!day) throw new Error("Not found");
      return ctx.db.workoutSession.create({
        data: { workoutDayId: input.workoutDayId, name: input.name, durationHours: input.durationHours },
        include: { exercises: { orderBy: { order: "asc" } } },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(200).optional(),
      durationHours: z.number().min(0.5).max(24).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const session = await ctx.db.workoutSession.findFirst({
        where: { id },
        include: { workoutDay: { select: { userId: true } } },
      });
      if (session?.workoutDay.userId !== ctx.session.user.id) throw new Error("Not found");
      return ctx.db.workoutSession.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.workoutSession.findFirst({
        where: { id: input.id },
        include: { workoutDay: { select: { userId: true } } },
      });
      if (session?.workoutDay.userId !== ctx.session.user.id) throw new Error("Not found");
      return ctx.db.workoutSession.delete({ where: { id: input.id } });
    }),
});
