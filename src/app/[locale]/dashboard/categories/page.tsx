import { setRequestLocale } from "next-intl/server";
import { CategoriesManager } from "@/components/CategoriesManager";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <h1
        className="text-xl font-bold mb-6"
        style={{  color: "var(--color-foreground)" }}
      >
        Categories
      </h1>
      <CategoriesManager />
    </div>
  );
}
