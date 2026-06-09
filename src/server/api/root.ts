import { createTRPCRouter } from "./trpc";
import { todoRouter } from "./routers/todo";
import { categoryRouter } from "./routers/category";
import { pushRouter } from "./routers/push";
import { journalCategoryRouter } from "./routers/journalCategory";
import { journalEntryRouter } from "./routers/journalEntry";
import { journalPinRouter } from "./routers/journalPin";
import { workoutDayRouter } from "./routers/workoutDay";
import { workoutSessionRouter } from "./routers/workoutSession";
import { exerciseRouter } from "./routers/exercise";
import { foodLogRouter } from "./routers/foodLog";
import { nutritionGoalRouter } from "./routers/nutritionGoal";
import { mealPresetRouter } from "./routers/mealPreset";
import { newsRouter } from "./routers/news";

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  category: categoryRouter,
  push: pushRouter,
  journalCategory: journalCategoryRouter,
  journalEntry: journalEntryRouter,
  journalPin: journalPinRouter,
  workoutDay: workoutDayRouter,
  workoutSession: workoutSessionRouter,
  exercise: exerciseRouter,
  foodLog: foodLogRouter,
  nutritionGoal: nutritionGoalRouter,
  mealPreset: mealPresetRouter,
  news: newsRouter,
});

export type AppRouter = typeof appRouter;
