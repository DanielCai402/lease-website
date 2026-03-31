import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const [messages, tNav, tFooter] = await Promise.all([
    getMessages(),
    getTranslations('Nav'),
    getTranslations('Footer'),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#111111]">
            NYC<span className="text-blue-600">Rentals</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600">
            <Link href="/" className="hover:text-[#111111] transition-colors">
              {tNav('browse')}
            </Link>
            <LanguageSwitcher />
            <Link
              href="/post"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors"
            >
              {tNav('postListing')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-100 py-8 text-center text-sm text-zinc-400">
        {tFooter('text')}
      </footer>
    </NextIntlClientProvider>
  );
}
