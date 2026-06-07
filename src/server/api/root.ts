import { createTRPCRouter } from "./trpc";
import { todoRouter } from "./routers/todo";
import { categoryRouter } from "./routers/category";
import { pushRouter } from "./routers/push";
import { journalCategoryRouter } from "./routers/journalCategory";
import { journalEntryRouter } from "./routers/journalEntry";

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  category: categoryRouter,
  push: pushRouter,
  journalCategory: journalCategoryRouter,
  journalEntry: journalEntryRouter,
});

export type AppRouter = typeof appRouter;
