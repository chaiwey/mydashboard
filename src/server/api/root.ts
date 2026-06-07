import { createTRPCRouter } from "./trpc";
import { todoRouter } from "./routers/todo";
import { categoryRouter } from "./routers/category";
import { pushRouter } from "./routers/push";
import { journalCategoryRouter } from "./routers/journalCategory";
import { journalEntryRouter } from "./routers/journalEntry";
import { workoutDayRouter } from "./routers/workoutDay";
import { exerciseRouter } from "./routers/exercise";
import { foodLogRouter } from "./routers/foodLog";
import { nutritionGoalRouter } from "./routers/nutritionGoal";

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  category: categoryRouter,
  push: pushRouter,
  journalCategory: journalCategoryRouter,
  journalEntry: journalEntryRouter,
  workoutDay: workoutDayRouter,
  exercise: exerciseRouter,
  foodLog: foodLogRouter,
  nutritionGoal: nutritionGoalRouter,
});

export type AppRouter = typeof appRouter;
