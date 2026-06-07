import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const mealPresetRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.mealPreset.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { name: "asc" },
    })
  ),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      calories: z.number().int().min(0),
      proteinG: z.number().min(0),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.mealPreset.create({ data: { ...input, userId: ctx.session.user.id } })
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mealPreset.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
