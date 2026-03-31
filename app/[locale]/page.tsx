'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { listings } from '@/lib/data';
import ListingCard from '@/components/ListingCard';
import FilterBar, { FilterValues, DEFAULT_FILTERS } from '@/components/FilterBar';

export default function HomePage() {
  const t = useTranslations('Home');
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);

  const filtered = listings.filter((l) => {
    if (filters.rentalType && l.rentalType !== filters.rentalType) return false;
    if (filters.borough && l.borough !== filters.borough) return false;

    if (filters.priceMin || filters.priceMax) {
      const price = filters.priceMode === 'monthly' ? l.monthlyPrice : l.dailyPrice;
      if (!price) return false;
      if (filters.priceMin && price < Number(filters.priceMin)) return false;
      if (filters.priceMax && price > Number(filters.priceMax)) return false;
    }

    if (filters.moveInBy && l.availableFrom > filters.moveInBy) return false;

    return true;
  });

  const foundKey = filtered.length === 1 ? 'found' : 'foundPlural';

  return (
    <>
      {/* Hero */}
      <div className="bg-[#f5f5f5] border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-[#111111] mb-2">
            {t('title')}
          </h1>
          <p className="text-zinc-500 text-lg">
            {t('subtitle', { count: listings.length })}
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <FilterBar onChange={setFilters} />
          </aside>

          <section>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-5xl mb-4">🗽</p>
                <p className="text-xl font-semibold text-zinc-700 mb-1">{t('noResults')}</p>
                <p className="text-zinc-400 text-sm">{t('noResultsHint')}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-zinc-400 mb-4">
                  {t(foundKey, { count: filtered.length })}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filtered.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
