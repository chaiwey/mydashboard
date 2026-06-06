import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const pending = await db.notificationSchedule.findMany({
    where: { scheduledAt: { lte: now }, sent: false },
    include: {
      todo: { select: { title: true, dueDate: true } },
    },
    take: 100,
  });

  let sent = 0;
  let failed = 0;

  for (const schedule of pending) {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: schedule.userId },
    });

    const dueDate = schedule.todo.dueDate;
    const hoursLeft = dueDate
      ? Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      : null;

    const body =
      hoursLeft !== null
        ? hoursLeft <= 0
          ? "This task is overdue!"
          : `Due in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}`
        : "Reminder";

    for (const sub of subscriptions) {
      try {
        await sendPushNotification(sub, {
          title: schedule.todo.title,
          body,
          todoId: schedule.todoId,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    await db.notificationSchedule.update({
      where: { id: schedule.id },
      data: { sent: true, sentAt: now },
    });
  }

  return NextResponse.json({ processed: pending.length, sent, failed });
}
