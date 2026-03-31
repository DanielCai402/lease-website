'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Borough } from '@/lib/types';

const BOROUGHS: Borough[] = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

export interface FilterValues {
  borough: string;
  priceMax: number;
  priceMin: number;
  bedrooms: string;
}

export default function FilterBar({ onChange }: { onChange: (f: FilterValues) => void }) {
  const t = useTranslations('Home.filters');

  const PRICE_RANGES = [
    { label: t('anyPrice'), min: 0, max: Infinity },
    { label: t('under2500'), min: 0, max: 2499 },
    { label: t('price2500to3500'), min: 2500, max: 3500 },
    { label: t('price3500to5000'), min: 3500, max: 5000 },
    { label: t('price5000plus'), min: 5000, max: Infinity },
  ];

  const BEDROOM_OPTIONS = [
    { label: t('any'), value: '' },
    { label: t('studio'), value: '0' },
    { label: t('oneBR'), value: '1' },
    { label: t('twoBR'), value: '2' },
    { label: t('threePlusBR'), value: '3' },
  ];

  const [borough, setBorough] = useState('');
  const [priceIdx, setPriceIdx] = useState(0);
  const [bedrooms, setBedrooms] = useState('');

  function emit(b: string, pi: number, br: string) {
    onChange({ borough: b, priceMin: PRICE_RANGES[pi].min, priceMax: PRICE_RANGES[pi].max, bedrooms: br });
  }

  function handleBorough(b: string) {
    const next = borough === b ? '' : b;
    setBorough(next);
    emit(next, priceIdx, bedrooms);
  }

  function handlePrice(idx: number) {
    setPriceIdx(idx);
    emit(borough, idx, bedrooms);
  }

  function handleBedrooms(val: string) {
    setBedrooms(val);
    emit(borough, priceIdx, val);
  }

  const pillBase = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors';
  const pillActive = 'bg-blue-600 text-white';
  const pillInactive = 'bg-white border border-zinc-300 text-zinc-700 hover:border-zinc-500';

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
      <div className="space-y-5">
        {/* Borough */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
            {t('borough')}
          </p>
          <div className="flex flex-wrap gap-2">
            {BOROUGHS.map((b) => (
              <button
                key={b}
                onClick={() => handleBorough(b)}
                className={`${pillBase} ${borough === b ? pillActive : pillInactive}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
            {t('price')}
          </p>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => handlePrice(i)}
                className={`${pillBase} ${priceIdx === i ? pillActive : pillInactive}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
            {t('bedrooms')}
          </p>
          <div className="flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => handleBedrooms(o.value)}
                className={`${pillBase} ${bedrooms === o.value ? pillActive : pillInactive}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
