import { createHash } from "crypto";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function hashPin(pin: string) {
  return createHash("sha256").update(pin).digest("hex");
}

export const journalPinRouter = createTRPCRouter({
  has: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db.userPin.findUnique({ where: { userId: ctx.session.user.id } });
    return { hasPin: !!existing };
  }),

  set: protectedProcedure
    .input(z.object({ pin: z.string().length(4) }))
    .mutation(({ ctx, input }) =>
      ctx.db.userPin.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id, pinHash: hashPin(input.pin) },
        update: { pinHash: hashPin(input.pin) },
      })
    ),

  verify: protectedProcedure
    .input(z.object({ pin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.db.userPin.findUnique({ where: { userId: ctx.session.user.id } });
      if (!record) return { valid: false };
      return { valid: record.pinHash === hashPin(input.pin) };
    }),
});
