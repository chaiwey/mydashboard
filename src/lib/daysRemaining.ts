export function getDaysRemaining(dueDate: Date | null): number | null {
  if (!dueDate) return null;
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function getDaysColor(days: number): string {
  if (days < 0) return "text-red-600 bg-red-50";
  if (days <= 1) return "text-orange-600 bg-orange-50";
  if (days <= 3) return "text-yellow-600 bg-yellow-50";
  return "text-green-600 bg-green-50";
}
