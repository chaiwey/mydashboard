import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const pushRouter = createTRPCRouter({
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        create: { ...input, userId: ctx.session.user.id },
        update: { p256dh: input.p256dh, auth: input.auth, userId: ctx.session.user.id },
      });
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.deleteMany({
        where: { endpoint: input.endpoint, userId: ctx.session.user.id },
      });
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.pushSubscription.findFirst({
      where: { userId: ctx.session.user.id },
    });
  }),
});
