import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import "../globals.css";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Personal dashboard",
  manifest: "/manifest.json",
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`h-full ${lora.variable} ${inter.variable}`}>
      <body className="min-h-full">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <TRPCProvider>{children}</TRPCProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
