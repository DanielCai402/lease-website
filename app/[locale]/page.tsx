'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/types';
import ListingCard from '@/components/ListingCard';
import FilterBar, { FilterValues, DEFAULT_FILTERS } from '@/components/FilterBar';
import DisclaimerModal from '@/components/DisclaimerModal';

export default function HomePage() {
  const t = useTranslations('Home');
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .or('status.eq.active,status.is.null')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(
          (data ?? []).map((row) => ({
            ...row,
            id: String(row.id),
            postedAt: row.postedAt ?? row.created_at,
            images: row.images ?? [],
          }))
        );
        setLoading(false);
      });
  }, []);

  const filtered = listings.filter((l) => {
    if (filters.rentalType && l.rentalType !== filters.rentalType) return false;
    if (filters.borough && l.borough !== filters.borough) return false;

    if (filters.priceMin || filters.priceMax) {
      const price = filters.priceMode === 'monthly' ? l.monthlyPrice : l.dailyPrice;
      if (!price) return false;
      if (filters.priceMin && price < Number(filters.priceMin)) return false;
      if (filters.priceMax && price > Number(filters.priceMax)) return false;
    }

    if (filters.checkIn && filters.checkOut) {
      if (l.availableFrom > filters.checkIn) return false;
      if (l.availableTo < filters.checkOut) return false;
    }

    return true;
  });

  const foundKey = filtered.length === 1 ? 'found' : 'foundPlural';

  return (
    <>
      <DisclaimerModal />
      {/* Hero */}
      <div className="bg-[#f5f5f5] border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-[#111111] mb-2">
            {t('title')}
          </h1>
          <p className="text-zinc-500 text-lg">
            {t('subtitle')}
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
            {/* Warning banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-amber-800 leading-relaxed">{t('warning')}</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
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
