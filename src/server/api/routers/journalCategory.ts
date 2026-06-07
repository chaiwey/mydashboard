import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const journalCategoryRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.journalCategory.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "asc" },
    })
  ),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100), color: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.journalCategory.create({
        data: { ...input, userId: ctx.session.user.id },
      })
    ),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(100).optional(), color: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.journalCategory.update({
        where: { id, userId: ctx.session.user.id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.journalCategory.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      })
    ),
});
