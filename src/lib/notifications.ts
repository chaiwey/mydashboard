import { db } from "./db";

const OFFSETS_MS = [
  24 * 60 * 60 * 1000, // 1 day before
  6 * 60 * 60 * 1000,  // 6 hours before
  3 * 60 * 60 * 1000,  // 3 hours before
];

export async function scheduleNotifications(todo: {
  id: string;
  userId: string;
  dueDate: Date | null;
}) {
  await db.notificationSchedule.deleteMany({
    where: { todoId: todo.id, sent: false },
  });

  if (!todo.dueDate) return;

  const now = new Date();
  const scheduleTimes = OFFSETS_MS.map(
    (offset) => new Date(todo.dueDate!.getTime() - offset)
  ).filter((t) => t > now);

  if (scheduleTimes.length === 0) return;

  await db.notificationSchedule.createMany({
    data: scheduleTimes.map((scheduledAt) => ({
      todoId: todo.id,
      userId: todo.userId,
      scheduledAt,
    })),
  });
}
