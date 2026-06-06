import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/SignInForm";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getServerSession(authOptions);
  if (session) redirect(`/${locale}/dashboard`);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-sm px-8 py-10" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: "16px" }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{  color: "var(--color-foreground)" }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Enter your email to receive a sign-in link.
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
