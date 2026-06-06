import { setRequestLocale } from "next-intl/server";

export default async function JournalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-foreground)" }}>
        Daily Journal
      </h1>
      <p className="text-sm" style={{ color: "var(--color-muted)" }}>Coming soon.</p>
    </div>
  );
}
