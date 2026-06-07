import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const nutritionGoalRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) =>
    ctx.db.nutritionGoal.findUnique({ where: { userId: ctx.session.user.id } })
  ),

  upsert: protectedProcedure
    .input(z.object({ calorieGoal: z.number().int().min(500), proteinGoal: z.number().int().min(10) }))
    .mutation(({ ctx, input }) =>
      ctx.db.nutritionGoal.upsert({
        where: { userId: ctx.session.user.id },
        create: { ...input, userId: ctx.session.user.id },
        update: input,
      })
    ),
});
