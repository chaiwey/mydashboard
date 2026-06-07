import { setRequestLocale } from "next-intl/server";
import { TodoColumn } from "@/components/TodoColumn";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { category: categoryId } = await searchParams;

  return (
    <div className="flex gap-8 h-full">
      <div className="flex-1 min-w-0" style={{ borderRight: "1px solid var(--color-border-subtle)", paddingRight: "2rem" }}>
        <TodoColumn kind="task" categoryId={categoryId} showNotificationPrompt />
      </div>
      <div className="flex-1 min-w-0">
        <TodoColumn kind="exam" categoryId={categoryId} />
      </div>
    </div>
  );
}
