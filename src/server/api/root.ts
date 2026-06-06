import { createTRPCRouter } from "./trpc";
import { todoRouter } from "./routers/todo";
import { categoryRouter } from "./routers/category";
import { pushRouter } from "./routers/push";

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  category: categoryRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
