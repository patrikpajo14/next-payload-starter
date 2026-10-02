import { getMessages } from "@/lib/i18n/server";

export default async function HomePage() {
  const t = await getMessages();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <h1 className="text-3xl font-semibold">{t.welcome}</h1>
      <p className="mt-4 text-lg">{t.shellIntro}</p>
    </main>
  );
}
