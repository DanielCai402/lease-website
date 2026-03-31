'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { lookupZip } from '@/lib/zip-to-neighborhood';
import type { ZipEntry as ZipInfo } from '@/lib/zip-to-neighborhood';
import Tooltip from '@/components/Tooltip';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostForm {
  rentalType: string;
  roomType: string;
  title: string;
  layout: string;
  address: string;
  zip: string;
  manualNeighborhood: string;
  availableFrom: string;
  availableTo: string;
  flexibleDates: boolean;
  dailyPrice: string;
  dailyNegotiable: boolean;
  monthlyPrice: string;
  monthlyNegotiable: boolean;
  utilitiesIncluded: boolean;
  utilitiesCost: string;
  utilitiesUnit: 'monthly' | 'daily';
  depositMonthlyMode: string;       // 'convention' | 'custom'
  depositMonthlyConvention: string; // 'none' | 'one_plus_one'
  depositMonthlyAmount: string;
  depositDailyMode: string;         // 'fixed' | 'percent' | 'none'
  depositDailyAmount: string;
  depositDailyPercent: string;
  furnished: string;
  furnitureDetails: string;
  parking: string;
  parkingFee: string;
  pets: string;
  roommatesCount: string;
  roommatesGender: string;
  sharedBathrooms: string;
  hasPartition: string;
  hasWindow: string;
  description: string;
  videoLinks: string[];
  wechat: string;
  phone: string;
  email: string;
}

const EMPTY: PostForm = {
  rentalType: '',
  roomType: '',
  title: '',
  layout: '',
  address: '',
  zip: '',
  manualNeighborhood: '',
  availableFrom: '',
  availableTo: '',
  flexibleDates: false,
  dailyPrice: '',
  dailyNegotiable: false,
  monthlyPrice: '',
  monthlyNegotiable: false,
  utilitiesIncluded: false,
  utilitiesCost: '',
  utilitiesUnit: 'monthly',
  depositMonthlyMode: '',
  depositMonthlyConvention: '',
  depositMonthlyAmount: '',
  depositDailyMode: '',
  depositDailyAmount: '',
  depositDailyPercent: '',
  furnished: '',
  furnitureDetails: '',
  parking: '',
  parkingFee: '',
  pets: '',
  roommatesCount: '',
  roommatesGender: '',
  sharedBathrooms: '',
  hasPartition: '',
  hasWindow: '',
  description: '',
  videoLinks: [],
  wechat: '',
  phone: '',
  email: '',
};

const LAYOUTS = ['Studio', '1B1B', '2B1B', '2B2B', '3B1B', '3B2B', '3B3B'];

// ─── Main component ───────────────────────────────────────────────────────────

export default function PostPage() {
  const t = useTranslations('Post');

  const [form, setForm] = useState<PostForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  const [zipStatus, setZipStatus] = useState<'idle' | 'found' | 'notfound'>('idle');
  const [zipInfo, setZipInfo] = useState<ZipInfo | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;

  // Revoke all object URLs on unmount to avoid memory leaks
  useEffect(() => () => { previewsRef.current.forEach(URL.revokeObjectURL); }, []);

  // ── helpers ──────────────────────────────────────────────────────────────

  function setField<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleZip(raw: string) {
    const v = raw.replace(/\D/g, '').slice(0, 5);
    setField('zip', v);
    if (v.length === 5) {
      const info = lookupZip(v);
      if (info) {
        setZipInfo(info);
        setZipStatus('found');
      } else {
        setZipInfo(null);
        setZipStatus('notfound');
      }
    } else {
      setZipInfo(null);
      setZipStatus('idle');
    }
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const slots = 10 - files.length;
    const toAdd = selected.slice(0, slots);
    const newUrls = toAdd.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newUrls]);
    e.target.value = '';
  }

  function removeFile(i: number) {
    URL.revokeObjectURL(previews[i]);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    setLightboxIndex((prev) => (prev === i ? null : prev !== null && prev > i ? prev - 1 : prev));
    setPlayingVideoIndex((prev) => (prev === i ? null : prev !== null && prev > i ? prev - 1 : prev));
  }

  function addVideo() {
    setField('videoLinks', [...form.videoLinks, '']);
  }

  function updateVideo(i: number, v: string) {
    const links = [...form.videoLinks];
    links[i] = v;
    setField('videoLinks', links);
  }

  function removeVideo(i: number) {
    setField('videoLinks', form.videoLinks.filter((_, idx) => idx !== i));
  }

  // ── validation ───────────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const req = t('validation.required');

    if (!form.rentalType) e.rentalType = t('validation.rentalTypeRequired');
    if (form.rentalType === 'room' && !form.roomType) e.roomType = t('validation.roomTypeRequired');
    if (!form.title.trim()) e.title = req;
    if (!form.layout) e.layout = req;
    if (!form.address.trim()) e.address = req;
    if (!form.zip || !/^\d{5}$/.test(form.zip)) e.zip = t('validation.invalidZip');
    if (zipStatus === 'notfound' && !form.manualNeighborhood.trim()) {
      e.manualNeighborhood = req;
    }
    if (!form.availableFrom) e.availableFrom = req;
    if (!form.availableTo) e.availableTo = req;
    if (form.availableFrom && form.availableTo && form.availableTo < form.availableFrom) {
      e.availableTo = t('validation.dateRange');
    }
    if (!form.dailyPrice && !form.monthlyPrice) {
      e.dailyPrice = t('validation.priceRequired');
    }
    if (form.dailyPrice && Number(form.dailyPrice) <= 0) e.dailyPrice = t('validation.invalidPrice');
    if (form.monthlyPrice && Number(form.monthlyPrice) <= 0) e.monthlyPrice = t('validation.invalidPrice');
    if (!form.furnished) e.furnished = req;
    if (!form.parking) e.parking = req;
    if (!form.pets) e.pets = req;
    if (form.rentalType === 'room') {
      if (!form.roommatesCount) e.roommatesCount = req;
      if (!form.roommatesGender) e.roommatesGender = req;
      if (!form.sharedBathrooms) e.sharedBathrooms = req;
      if (form.roomType === 'living') {
        if (!form.hasPartition) e.hasPartition = req;
        if (!form.hasWindow) e.hasWindow = req;
      }
    }
    if (form.email && !form.email.includes('@')) e.email = t('validation.invalidEmail');

    return e;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      setTimeout(() => {
        document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setSubmitted(true);
  }

  // ── success screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold text-[#111111] mb-3">{t('success.title')}</h1>
        <p className="text-zinc-500 mb-8">{t('success.message')}</p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
            {t('success.browse')}
          </Link>
          <button
            onClick={() => { setForm(EMPTY); setFiles([]); setPreviews([]); setZipStatus('idle'); setZipInfo(null); setSubmitted(false); setErrors({}); }}
            className="border border-zinc-300 text-zinc-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            {t('success.postAnother')}
          </button>
        </div>
      </div>
    );
  }

  // ── shortcuts ────────────────────────────────────────────────────────────

  const isRoom = form.rentalType === 'room';
  const isLiving = isRoom && form.roomType === 'living';

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-[#111111] transition-colors mb-6">
        ← {t('back')}
      </Link>
      <h1 className="text-3xl font-bold text-[#111111] mb-1">{t('title')}</h1>
      <p className="text-zinc-500 mb-8">{t('subtitle')}</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* ── Section 1: Basic Info ─────────────────────────────────────── */}
        <SectionCard number={1} title={t('sections.basics')}>
          <Field label={t('fields.listingTitle')} required error={errors.title}>
            <input
              type="text"
              placeholder={t('fields.titlePlaceholder')}
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              data-error={!!errors.title}
              className={inputCls(!!errors.title)}
            />
          </Field>

          <Field label={t('fields.description')}>
            <textarea
              placeholder={t('fields.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              className={inputCls(false) + ' resize-none'}
            />
          </Field>

          <Field label={t('fields.layout')} required error={errors.layout}>
            <select
              value={form.layout}
              onChange={(e) => setField('layout', e.target.value)}
              data-error={!!errors.layout}
              className={inputCls(!!errors.layout)}
            >
              <option value="">{t('fields.layoutPlaceholder')}</option>
              {LAYOUTS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
              <option value="other">{t('fields.layoutOther')}</option>
            </select>
          </Field>
        </SectionCard>

        {/* ── Section 2: Rental Type ────────────────────────────────────── */}
        <SectionCard number={2} title={t('sections.rentalType')}>
          <Field label={t('rentalType.entire') + ' / ' + t('rentalType.room')} required error={errors.rentalType}>
            <RadioGroup
              options={[
                { value: 'entire', label: t('rentalType.entire') },
                { value: 'room', label: t('rentalType.room') },
              ]}
              value={form.rentalType}
              onChange={(v) => {
                setField('rentalType', v);
                if (v === 'entire') setField('roomType', '');
              }}
            />
          </Field>

          <Collapsible show={isRoom}>
            <div className="pt-1">
              <Field label={t('rentalType.roomTypeLabel')} required error={errors.roomType}>
                <RadioGroup
                  options={[
                    { value: 'master', label: t('rentalType.master') },
                    { value: 'secondary', label: t('rentalType.secondary') },
                    { value: 'living', label: t('rentalType.living') },
                  ]}
                  value={form.roomType}
                  onChange={(v) => setField('roomType', v)}
                />
              </Field>
            </div>
          </Collapsible>
        </SectionCard>

        {/* ── Section 3: Location ───────────────────────────────────────── */}
        <SectionCard number={3} title={t('sections.location')}>
          <Field label={t('fields.address')} required error={errors.address}>
            <input
              type="text"
              placeholder={t('fields.addressPlaceholder')}
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              data-error={!!errors.address}
              className={inputCls(!!errors.address)}
            />
          </Field>

          <Field label={t('fields.zipCode')} required error={errors.zip}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder={t('fields.zipCodePlaceholder')}
              value={form.zip}
              onChange={(e) => handleZip(e.target.value)}
              data-error={!!errors.zip}
              className={inputCls(!!errors.zip)}
            />
          </Field>

          {/* ZIP found */}
          <Collapsible show={zipStatus === 'found' && zipInfo !== null}>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <span className="text-green-500 text-base">✓</span>
              <span>
                {t('fields.locatedIn', {
                  neighborhood: zipInfo?.neighborhood ?? '',
                  borough: zipInfo?.borough ?? '',
                })}
              </span>
            </div>
          </Collapsible>

          {/* ZIP not found — manual area input */}
          <Collapsible show={zipStatus === 'notfound'}>
            <Field label={t('fields.manualArea')} required error={errors.manualNeighborhood}>
              <input
                type="text"
                placeholder={t('fields.manualAreaPlaceholder')}
                value={form.manualNeighborhood}
                onChange={(e) => setField('manualNeighborhood', e.target.value)}
                data-error={!!errors.manualNeighborhood}
                className={inputCls(!!errors.manualNeighborhood)}
              />
            </Field>
          </Collapsible>
        </SectionCard>

        {/* ── Section 4: Availability ───────────────────────────────────── */}
        <SectionCard number={4} title={t('sections.availability')}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('fields.availableFrom')} required error={errors.availableFrom}>
              <input
                type="date"
                value={form.availableFrom}
                onChange={(e) => setField('availableFrom', e.target.value)}
                data-error={!!errors.availableFrom}
                className={inputCls(!!errors.availableFrom)}
              />
            </Field>
            <Field label={t('fields.availableTo')} required error={errors.availableTo}>
              <input
                type="date"
                value={form.availableTo}
                onChange={(e) => setField('availableTo', e.target.value)}
                data-error={!!errors.availableTo}
                className={inputCls(!!errors.availableTo)}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.flexibleDates}
              onChange={(e) => setField('flexibleDates', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-zinc-700">{t('fields.flexibleDates')}</span>
          </label>
          <Collapsible show={form.flexibleDates}>
            <p className="text-xs text-zinc-400 italic pt-0.5">{t('fields.flexibleDatesNote')}</p>
          </Collapsible>
        </SectionCard>

        {/* ── Section 5: Pricing ────────────────────────────────────────── */}
        <SectionCard number={5} title={t('sections.price')}>
          {/* Daily price */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              {t('fields.dailyPrice')}
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  placeholder={t('fields.dailyPricePlaceholder')}
                  value={form.dailyPrice}
                  onChange={(e) => setField('dailyPrice', e.target.value)}
                  data-error={!!errors.dailyPrice}
                  className={`w-32 ${inputCls(!!errors.dailyPrice)}`}
                />
                <span className="text-sm text-zinc-500 whitespace-nowrap">{t('fields.dailyUnit')}</span>
              </div>
              <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dailyNegotiable}
                  onChange={(e) => setField('dailyNegotiable', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                {t('fields.negotiable')}
              </label>
            </div>
            {errors.dailyPrice && (
              <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.dailyPrice}</p>
            )}
          </div>

          {/* Monthly price */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">
              {t('fields.monthlyPrice')}
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  placeholder={t('fields.monthlyPricePlaceholder')}
                  value={form.monthlyPrice}
                  onChange={(e) => setField('monthlyPrice', e.target.value)}
                  data-error={!!errors.monthlyPrice}
                  className={`w-32 ${inputCls(!!errors.monthlyPrice)}`}
                />
                <span className="text-sm text-zinc-500 whitespace-nowrap">{t('fields.monthlyUnit')}</span>
              </div>
              <label className="flex items-center gap-1.5 text-sm text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.monthlyNegotiable}
                  onChange={(e) => setField('monthlyNegotiable', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                {t('fields.negotiable')}
              </label>
            </div>
            {errors.monthlyPrice && (
              <p className="text-xs text-red-500 flex items-center gap-1">⚠ {errors.monthlyPrice}</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">{t('fields.utilitiesLabel')}</p>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.utilitiesIncluded}
                onChange={(e) => setField('utilitiesIncluded', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-zinc-700">{t('fields.utilitiesIncluded')}</span>
            </label>
            <Collapsible show={!form.utilitiesIncluded}>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  min={0}
                  placeholder={t('fields.utilitiesCostPlaceholder')}
                  value={form.utilitiesCost}
                  onChange={(e) => setField('utilitiesCost', e.target.value)}
                  className={`w-28 ${inputCls(false)}`}
                />
                <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
                  {(['monthly', 'daily'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setField('utilitiesUnit', unit)}
                      className={`px-3 py-1.5 transition-colors ${
                        form.utilitiesUnit === unit
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {unit === 'monthly' ? t('fields.monthlyUnit') : t('fields.dailyUnit')}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-zinc-400">{t('fields.utilitiesCostHint')}</span>
              </div>
            </Collapsible>
          </div>

          {/* Deposit — shown only when at least one price is filled */}
          {(form.monthlyPrice || form.dailyPrice) && (
            <div className="space-y-5">
              <p className="text-sm font-medium text-zinc-700">{t('fields.deposit')}</p>

              {/* ── Monthly deposit row ── */}
              {form.monthlyPrice && (
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('fields.depositMonthlyLabel')}</p>
                  <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm w-fit">
                    {(['convention', 'custom'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setField('depositMonthlyMode', mode)}
                        className={`px-3 py-1.5 transition-colors ${
                          (form.depositMonthlyMode || 'convention') === mode
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {t(`fields.deposit_${mode}`)}
                      </button>
                    ))}
                  </div>
                  <Collapsible show={(form.depositMonthlyMode || 'convention') === 'convention'}>
                    <div className="flex items-center gap-2 pt-0.5">
                      <select
                        value={form.depositMonthlyConvention}
                        onChange={(e) => setField('depositMonthlyConvention', e.target.value)}
                        className={`${inputCls(false)} max-w-xs`}
                      >
                        <option value="">{t('fields.depositConvention_placeholder')}</option>
                        <option value="none">{t('fields.depositConvention_none')}</option>
                        <option value="one_plus_one">{t('fields.depositConvention_onePlusOne')}</option>
                      </select>
                      <Tooltip text={t('fields.depositConvention_onePlusOneTooltip')} />
                    </div>
                  </Collapsible>
                  <Collapsible show={(form.depositMonthlyMode || 'convention') === 'custom'}>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <input
                        type="number"
                        min={0}
                        placeholder={t('fields.depositPlaceholder')}
                        value={form.depositMonthlyAmount}
                        onChange={(e) => setField('depositMonthlyAmount', e.target.value)}
                        className={`w-32 ${inputCls(false)}`}
                      />
                      <span className="text-sm text-zinc-500">{t('fields.depositUnit')}</span>
                    </div>
                  </Collapsible>
                </div>
              )}

              {/* ── Daily deposit row ── */}
              {form.dailyPrice && (
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t('fields.depositDailyLabel')}</p>
                  <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm w-fit">
                    {(['fixed', 'percent', 'none'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setField('depositDailyMode', mode)}
                        className={`px-3 py-1.5 transition-colors ${
                          (form.depositDailyMode || 'fixed') === mode
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {t(`fields.deposit_${mode}`)}
                      </button>
                    ))}
                  </div>
                  <Collapsible show={(form.depositDailyMode || 'fixed') === 'fixed'}>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          placeholder={t('fields.depositPlaceholder')}
                          value={form.depositDailyAmount}
                          onChange={(e) => setField('depositDailyAmount', e.target.value)}
                          className={`w-32 ${inputCls(false)}`}
                        />
                        <span className="text-sm text-zinc-500">{t('fields.depositUnit')}</span>
                      </div>
                      <Tooltip text={t('fields.deposit_fixedTooltip')} />
                    </div>
                  </Collapsible>
                  <Collapsible show={(form.depositDailyMode || 'fixed') === 'percent'}>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="20"
                          value={form.depositDailyPercent}
                          onChange={(e) => setField('depositDailyPercent', e.target.value)}
                          className={`w-24 ${inputCls(false)}`}
                        />
                        <span className="text-sm text-zinc-500">%</span>
                      </div>
                      <Tooltip text={t('fields.deposit_percentTooltip')} />
                    </div>
                  </Collapsible>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Section 6: Property Details ───────────────────────────────── */}
        <SectionCard number={6} title={t('sections.details')}>
          <Field label={t('fields.furnished')} required error={errors.furnished}>
            <RadioGroup
              options={[
                { value: 'full', label: t('fields.furnishedFull') },
                { value: 'partial', label: t('fields.furnishedPartial') },
                { value: 'none', label: t('fields.furnishedNone') },
              ]}
              value={form.furnished}
              onChange={(v) => setField('furnished', v)}
            />
            <Collapsible show={form.furnished === 'full' || form.furnished === 'partial'}>
              <div className="mt-3">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  {t('fields.furnitureDetails')}
                </label>
                <textarea
                  rows={2}
                  placeholder={t('fields.furnitureDetailsPlaceholder')}
                  value={form.furnitureDetails}
                  onChange={(e) => setField('furnitureDetails', e.target.value)}
                  className={`w-full resize-none ${inputCls(false)}`}
                />
              </div>
            </Collapsible>
          </Field>

          <Field label={t('fields.parking')} required error={errors.parking}>
            <RadioGroup
              options={[
                { value: 'none', label: t('fields.parkingNone') },
                { value: 'free', label: t('fields.parkingFree') },
                { value: 'paid', label: t('fields.parkingPaid') },
              ]}
              value={form.parking}
              onChange={(v) => setField('parking', v)}
            />
            <Collapsible show={form.parking === 'paid'}>
              <div className="mt-3">
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  {t('fields.parkingFee')}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    placeholder={t('fields.parkingFeePlaceholder')}
                    value={form.parkingFee}
                    onChange={(e) => setField('parkingFee', e.target.value)}
                    className={`w-32 ${inputCls(false)}`}
                  />
                  <span className="text-sm text-zinc-500">{t('fields.monthlyUnit')}</span>
                </div>
              </div>
            </Collapsible>
          </Field>

          <Field label={t('fields.petsAllowed')} required error={errors.pets}>
            <RadioGroup
              options={[
                { value: 'yes', label: t('fields.petsYes') },
                { value: 'no', label: t('fields.petsNo') },
                { value: 'negotiable', label: t('fields.petsNegotiable') },
              ]}
              value={form.pets}
              onChange={(v) => setField('pets', v)}
            />
          </Field>

          {/* Roommate fields — only for room rental */}
          <Collapsible show={isRoom}>
            <div className="space-y-4 pt-1 border-t border-zinc-100 mt-1">
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('fields.totalRoommates')} required error={errors.roommatesCount}>
                  <input
                    type="number"
                    min={1}
                    placeholder={t('fields.totalRoommatesPlaceholder')}
                    value={form.roommatesCount}
                    onChange={(e) => setField('roommatesCount', e.target.value)}
                    data-error={!!errors.roommatesCount}
                    className={inputCls(!!errors.roommatesCount)}
                  />
                </Field>
                <Field label={t('fields.sharedBathrooms')} required error={errors.sharedBathrooms}>
                  <input
                    type="number"
                    min={1}
                    placeholder={t('fields.sharedBathroomsPlaceholder')}
                    value={form.sharedBathrooms}
                    onChange={(e) => setField('sharedBathrooms', e.target.value)}
                    data-error={!!errors.sharedBathrooms}
                    className={inputCls(!!errors.sharedBathrooms)}
                  />
                </Field>
              </div>

              <Field label={t('fields.roommateGender')} required error={errors.roommatesGender}>
                <RadioGroup
                  options={[
                    { value: 'female', label: t('fields.genderFemale') },
                    { value: 'male', label: t('fields.genderMale') },
                    { value: 'mixed', label: t('fields.genderMixed') },
                  ]}
                  value={form.roommatesGender}
                  onChange={(v) => setField('roommatesGender', v)}
                />
              </Field>

              {/* Living room extras */}
              <Collapsible show={isLiving}>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <Field label={t('fields.hasPartition')} required error={errors.hasPartition}>
                    <RadioGroup
                      options={[
                        { value: 'yes', label: t('fields.yesOption') },
                        { value: 'no', label: t('fields.noOption') },
                      ]}
                      value={form.hasPartition}
                      onChange={(v) => setField('hasPartition', v)}
                    />
                  </Field>
                  <Field label={t('fields.hasWindow')} required error={errors.hasWindow}>
                    <RadioGroup
                      options={[
                        { value: 'yes', label: t('fields.yesOption') },
                        { value: 'no', label: t('fields.noOption') },
                      ]}
                      value={form.hasWindow}
                      onChange={(v) => setField('hasWindow', v)}
                    />
                  </Field>
                </div>
              </Collapsible>
            </div>
          </Collapsible>
        </SectionCard>

        {/* ── Section 7: Media ──────────────────────────────────────────── */}
        <SectionCard number={7} title={t('sections.photosVideo')}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />

          {files.length === 0 ? (
            /* Empty state: full dashed upload area */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-zinc-300 rounded-xl py-10 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <p className="text-zinc-500 text-sm font-medium">{t('upload.button')}</p>
              <p className="text-zinc-400 text-xs mt-1">{t('upload.hint')}</p>
            </button>
          ) : (
            /* Grid with thumbnails + optional add button */
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => {
                const isVideo = files[i]?.type.startsWith('video/');
                const isPlaying = playingVideoIndex === i;
                return (
                  <div key={src} className="relative rounded-xl overflow-hidden aspect-square bg-zinc-100">
                    {isVideo ? (
                      isPlaying ? (
                        <video
                          src={src}
                          autoPlay
                          playsInline
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <button
                          type="button"
                          className="w-full h-full relative block"
                          onClick={() => setPlayingVideoIndex(i)}
                          aria-label="Play video"
                        >
                          <video
                            src={src}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {/* Play button overlay */}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="w-10 h-10 rounded-full bg-white/85 flex items-center justify-center shadow">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-zinc-700 translate-x-0.5">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </span>
                          {/* Camera badge */}
                          <span className="absolute bottom-1.5 left-1.5 bg-black/50 rounded px-1 py-0.5">
                            <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                          </span>
                        </button>
                      )
                    ) : (
                      /* Image thumbnail — click to lightbox */
                      // eslint-disable-next-line @next/next/no-img-element
                      <button
                        type="button"
                        className="w-full h-full block"
                        onClick={() => setLightboxIndex(i)}
                        aria-label="View image"
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center hover:bg-black/80 leading-none"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Add button (shown when < 10 files) */}
              {files.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  aria-label="Add media"
                >
                  <span className="text-2xl text-zinc-400 leading-none">+</span>
                </button>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Section 8: Contact ────────────────────────────────────────── */}
        <SectionCard number={8} title={t('sections.contact')}>
          <p className="text-xs text-zinc-500 -mt-2 leading-relaxed">{t('wechatNote')}</p>

          <Field label={t('fields.wechat')}>
            <input
              type="text"
              placeholder={t('fields.wechatPlaceholder')}
              value={form.wechat}
              onChange={(e) => setField('wechat', e.target.value)}
              className={inputCls(false)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('fields.phone')}>
              <input
                type="tel"
                placeholder={t('fields.phonePlaceholder')}
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className={inputCls(false)}
              />
            </Field>
            <Field label={t('fields.email')} error={errors.email}>
              <input
                type="email"
                placeholder={t('fields.emailPlaceholder')}
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                data-error={!!errors.email}
                className={inputCls(!!errors.email)}
              />
            </Field>
          </div>
        </SectionCard>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-base"
        >
          {t('submit')}
        </button>
      </form>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && previews[lightboxIndex] && (
        <Lightbox
          src={previews[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
    </div>
  );
}

function Collapsible({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ gridTemplateRows: show ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function SectionCard({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-[#111111]">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-error={!!error}>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 bg-white',
    'placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
    hasError ? 'border-red-400 bg-red-50' : 'border-zinc-300 hover:border-zinc-400',
  ].join(' ');
}
