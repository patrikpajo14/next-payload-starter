import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { locales } from "@/lib/i18n/locales";
import { getLocale, getMessages } from "@/lib/i18n/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only the configured Locales exist; any other first segment is a 404.
// Check before adding Article List and Article routes below this layout: the
// docs don't say whether this also stops later pages being generated on first
// request, which pagination relies on. Set `dynamicParams = true` on those pages.
export const dynamicParams = false;

// Safety net for time-based refresh; Editor saves revalidate on demand.
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return { title: t.siteTitle };
}

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
