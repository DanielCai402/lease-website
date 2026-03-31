'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BOROUGHS } from '@/lib/types';

export interface FilterValues {
  rentalType: string;       // '' | 'entire' | 'room'
  borough: string;
  priceMode: 'monthly' | 'daily';
  priceMin: string;
  priceMax: string;
  checkIn: string;          // YYYY-MM-DD or ''
  checkOut: string;         // YYYY-MM-DD or ''
}

export const DEFAULT_FILTERS: FilterValues = {
  rentalType: '',
  borough: '',
  priceMode: 'monthly',
  priceMin: '',
  priceMax: '',
  checkIn: '',
  checkOut: '',
};

function nextDay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function FilterBar({ onChange }: { onChange: (f: FilterValues) => void }) {
  const t = useTranslations('Home.filters');
  const [f, setF] = useState<FilterValues>(DEFAULT_FILTERS);

  function update(patch: Partial<FilterValues>) {
    const next = { ...f, ...patch };
    setF(next);
    onChange(next);
  }

  function reset() {
    setF(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    f.rentalType || f.borough || f.priceMin || f.priceMax || f.checkIn || f.checkOut;

  const pillBase = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors';
  const pillOn   = 'bg-blue-600 text-white';
  const pillOff  = 'bg-white border border-zinc-300 text-zinc-700 hover:border-zinc-500';
  const inputCls = 'w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors';

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">

      {/* Rental type */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          {t('rentalType')}
        </p>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: '', label: t('allTypes') },
            { value: 'entire', label: t('entireUnit') },
            { value: 'room', label: t('room') },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ rentalType: value })}
              className={`${pillBase} ${f.rentalType === value ? pillOn : pillOff}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Borough */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          {t('borough')}
        </p>
        <select
          value={f.borough}
          onChange={(e) => update({ borough: e.target.value })}
          className={inputCls}
        >
          <option value="">{t('allBoroughs')}</option>
          {BOROUGHS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          {t('price')}
        </p>
        {/* Monthly / Daily toggle */}
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm w-fit mb-2.5">
          {(['monthly', 'daily'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => update({ priceMode: mode, priceMin: '', priceMax: '' })}
              className={`px-3 py-1.5 transition-colors ${
                f.priceMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {mode === 'monthly' ? t('monthly') : t('daily')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder={t('min')}
            value={f.priceMin}
            onChange={(e) => update({ priceMin: e.target.value })}
            className={inputCls}
          />
          <span className="text-zinc-400 text-sm flex-shrink-0">–</span>
          <input
            type="number"
            min={0}
            placeholder={t('max')}
            value={f.priceMax}
            onChange={(e) => update({ priceMax: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {/* Check-in / Check-out */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          {t('dates')}
        </p>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-zinc-400 mb-1">{t('checkIn')}</p>
            <input
              type="date"
              value={f.checkIn ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                const keepCheckOut = f.checkOut && f.checkOut > val ? f.checkOut : '';
                update({ checkIn: val, checkOut: keepCheckOut });
              }}
              className={inputCls}
            />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-1">{t('checkOut')}</p>
            <input
              type="date"
              value={f.checkOut ?? ''}
              min={nextDay(f.checkIn ?? '')}
              onChange={(e) => update({ checkOut: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={reset}
          className="w-full text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-0.5"
        >
          {t('reset')}
        </button>
      )}
    </div>
  );
}
