'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useEffect } from 'react';

const LOCALES = ['zh', 'en'] as const;
type Locale = (typeof LOCALES)[number];
const LABELS: Record<Locale, string> = { en: 'EN', zh: '中' };
const STORAGE_KEY = 'preferred-locale';

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  // On first mount, honour a previously saved preference.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && LOCALES.includes(saved) && saved !== locale) {
      router.replace(pathname, { locale: saved });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchLocale(next: Locale) {
    if (next === locale) return;
    localStorage.setItem(STORAGE_KEY, next);
    router.push(pathname, { locale: next });
  }

  return (
    <div className="flex items-center text-sm font-medium">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="text-zinc-300 mx-1 select-none">|</span>}
          <button
            onClick={() => switchLocale(l)}
            className={`px-1 py-0.5 rounded transition-colors ${
              locale === l
                ? 'text-blue-600 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {LABELS[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
