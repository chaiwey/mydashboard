import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { scheduleNotifications } from "@/lib/notifications";

const todoInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.date().optional(),
  categoryId: z.string().optional(),
});

export const todoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      categoryId: z.string().optional(),
      completed: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.todo.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input?.categoryId ? { categoryId: input.categoryId } : {}),
          ...(input?.completed !== undefined ? { completed: input.completed } : {}),
        },
        include: { category: true },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      });
    }),

  create: protectedProcedure
    .input(todoInput)
    .mutation(async ({ ctx, input }) => {
      const todo = await ctx.db.todo.create({
        data: { ...input, userId: ctx.session.user.id },
        include: { category: true },
      });
      await scheduleNotifications({ id: todo.id, userId: todo.userId, dueDate: todo.dueDate });
      return todo;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(todoInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const todo = await ctx.db.todo.update({
        where: { id, userId: ctx.session.user.id },
        data,
        include: { category: true },
      });
      if ("dueDate" in input) {
        await scheduleNotifications({ id: todo.id, userId: todo.userId, dueDate: todo.dueDate });
      }
      return todo;
    }),

  toggleComplete: protectedProcedure
    .input(z.object({ id: z.string(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todo.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { completed: input.completed },
        include: { category: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.todo.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
