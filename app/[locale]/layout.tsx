import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DisclaimerButton from '@/components/DisclaimerButton';
import NavAuth from '@/components/NavAuth';

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
  const tFooterWarning = tFooter('warning');
  const tFooterDisclaimer = tFooter('disclaimer');
  const tFooterCopyright = tFooter('copyright');

  return (
    <NextIntlClientProvider messages={messages}>
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#111111]">
            NYC<span className="text-blue-600">Rentals</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-5 text-sm font-medium text-zinc-600">
            <Link href="/" className="hidden sm:block hover:text-[#111111] transition-colors">
              {tNav('browse')}
            </Link>
            <LanguageSwitcher />
            <NavAuth />
            <Link
              href="/post"
              className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 rounded-full hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              {tNav('postListing')}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <DisclaimerButton />

      <footer>
        {/* Risk warning */}
        <div className="bg-amber-50 border-t border-amber-100 px-4 py-4 text-center">
          <p className="text-xs text-amber-800 leading-relaxed max-w-3xl mx-auto">
            {tFooterWarning}
          </p>
        </div>
        {/* Disclaimer + copyright */}
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-5 text-center">
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto">
            {tFooterDisclaimer}
          </p>
          <p className="text-xs text-gray-400 mt-3">{tFooterCopyright}</p>
        </div>
      </footer>
    </NextIntlClientProvider>
  );
}
