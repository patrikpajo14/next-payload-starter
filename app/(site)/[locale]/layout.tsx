import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { locales } from "@/lib/i18n/locales";
import { getLocale, getMessages } from "@/lib/i18n/server";

import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pages must render on demand: `revalidateTag(tag, { expire: 0 })` drops their
// cached copy, and with `dynamicParams = false` Next answers that cache miss
// with a 404 instead of rendering again. Unknown Locales still 404: the proxy
// redirects them, and `getLocale()` calls `notFound()` for any that slip past.
export const dynamicParams = true;

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
      <body className="min-h-full flex flex-col overflow-x-clip">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
