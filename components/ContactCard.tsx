'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  monthlyPrice?: number;
  monthlyNegotiable: boolean;
  dailyPrice?: number;
  dailyNegotiable: boolean;
  utilitiesIncluded: boolean;
  utilitiesCost?: number;
  utilitiesUnit?: 'monthly' | 'daily';
  depositMonthlyMode?: 'convention' | 'custom';
  depositMonthlyConvention?: 'none' | 'one_plus_one';
  depositMonthlyAmount?: number;
  depositDailyMode?: 'fixed' | 'percent' | 'none';
  depositDailyAmount?: number;
  depositDailyPercent?: number;
  wechat?: string;
}

export default function ContactCard(props: Props) {
  const {
    monthlyPrice, monthlyNegotiable,
    dailyPrice, dailyNegotiable,
    utilitiesIncluded, utilitiesCost, utilitiesUnit,
    depositMonthlyMode, depositMonthlyConvention, depositMonthlyAmount,
    depositDailyMode, depositDailyAmount, depositDailyPercent,
    wechat,
  } = props;

  const t = useTranslations('Listing');
  const [copied, setCopied] = useState(false);
  const [wechatRevealed, setWechatRevealed] = useState(false);
  const [wechatId, setWechatId] = useState('');
  const [message, setMessage] = useState('');
  const [formSent, setFormSent] = useState(false);
  const [wechatError, setWechatError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function copyWechat() {
    if (!wechat) return;
    navigator.clipboard.writeText(wechat).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!wechatId.trim()) { setWechatError(true); return; }
    setFormSent(true);
  }

  const depositLines: string[] = [];

  if (monthlyPrice) {
    if (depositMonthlyMode === 'convention' || !depositMonthlyMode) {
      if (depositMonthlyConvention === 'one_plus_one') depositLines.push(t('depositOnePlusOne'));
      else if (depositMonthlyConvention === 'none') depositLines.push(t('depositNone'));
    } else if (depositMonthlyMode === 'custom' && depositMonthlyAmount) {
      depositLines.push(t('depositCustomMonthly', { amount: depositMonthlyAmount.toLocaleString() }));
    }
  }

  if (dailyPrice) {
    if (depositDailyMode === 'none') depositLines.push(t('depositNone'));
    else if (depositDailyMode === 'fixed' && depositDailyAmount)
      depositLines.push(t('depositFixed', { amount: depositDailyAmount.toLocaleString() }));
    else if (depositDailyMode === 'percent' && depositDailyPercent)
      depositLines.push(t('depositPercent', { percent: depositDailyPercent }));
  }

  const utilitiesLine = utilitiesIncluded
    ? `✓ ${t('utilitiesIncluded')}`
    : utilitiesCost
      ? t('utilitiesExtraWithCost', { amount: utilitiesCost, unit: utilitiesUnit === 'monthly' ? t('perMonth') : t('perDay') })
      : t('utilitiesExtra');

  const cardContent = (
    <div className="space-y-5">
      {/* Price */}
      <div className="space-y-1.5">
        {monthlyPrice && (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold text-[#111111]">${monthlyPrice.toLocaleString()}</span>
            <span className="text-zinc-400 text-sm">{t('perMonth')}</span>
            {monthlyNegotiable && (
              <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                {t('negotiable')}
              </span>
            )}
          </div>
        )}
        {dailyPrice && (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-bold text-[#111111] ${monthlyPrice ? 'text-xl' : 'text-3xl'}`}>
              ${dailyPrice}
            </span>
            <span className="text-zinc-400 text-sm">{t('perDay')}</span>
            {dailyNegotiable && (
              <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                {t('negotiable')}
              </span>
            )}
          </div>
        )}
        {utilitiesLine && (
          <p className="text-sm text-zinc-500">{utilitiesLine}</p>
        )}
        {depositLines.length > 0 && (
          <p className="text-sm text-zinc-500">{depositLines.join(' · ')}</p>
        )}
      </div>

      <hr className="border-zinc-200" />

      {/* WeChat display */}
      {wechat && (
        <>
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">{t('wechatLabel')}</p>
            {wechatRevealed ? (
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-zinc-800 truncate min-w-0">{wechat}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={copyWechat}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-400 text-zinc-700 transition-colors"
                  >
                    {copied ? t('copied') : t('copy')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWechatRevealed(false)}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-400 text-zinc-500 transition-colors"
                  >
                    {t('hide')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWechatRevealed(true)}
                className="w-full text-sm font-medium px-3 py-2 rounded-lg border border-zinc-300 hover:border-blue-400 hover:text-blue-600 text-zinc-600 transition-colors"
              >
                {t('revealWechat')}
              </button>
            )}
          </div>
          <hr className="border-zinc-200" />
        </>
      )}

      {/* Contact form */}
      {formSent ? (
        <p className="text-sm text-green-600 font-medium py-2">{t('contactFormSuccess')}</p>
      ) : (
        <form onSubmit={submitForm} className="space-y-3">
          <p className="text-sm font-medium text-zinc-700">{t('contactFormNote')}</p>
          <div>
            <input
              type="text"
              placeholder={t('contactFormWechatPlaceholder')}
              value={wechatId}
              onChange={(e) => { setWechatId(e.target.value); setWechatError(false); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                wechatError ? 'border-red-400 bg-red-50' : 'border-zinc-300'
              }`}
            />
            {wechatError && (
              <p className="text-xs text-red-500 mt-1">⚠ {t('contactFormWechat')}</p>
            )}
          </div>
          <textarea
            placeholder={t('contactFormMessagePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-zinc-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            {t('contactFormSubmit')}
          </button>
        </form>
      )}

      <hr className="border-zinc-200" />

      <p className="text-xs text-zinc-400 leading-relaxed">{t('disclaimer')}</p>
    </div>
  );

  const mobilePrice = monthlyPrice
    ? <><span className="text-xl font-bold">${monthlyPrice.toLocaleString()}</span><span className="text-zinc-400 text-sm ml-0.5">{t('perMonth')}</span></>
    : dailyPrice
      ? <><span className="text-xl font-bold">${dailyPrice}</span><span className="text-zinc-400 text-sm ml-0.5">{t('perDay')}</span></>
      : null;

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden lg:block sticky top-20 self-start">
        <div className="bg-[#f9f9f9] border border-zinc-200 rounded-2xl p-6">
          {cardContent}
        </div>
      </aside>

      {/* ── Mobile sticky bottom bar ─────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1 min-w-0">
          {mobilePrice}
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-shrink-0 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          {t('contactLandlord')}
        </button>
      </div>

      {/* ── Mobile bottom sheet ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex justify-between items-center px-5 pt-4 pb-3 border-b border-zinc-100">
              <span className="font-semibold text-zinc-800">{t('contactLandlord')}</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-5">{cardContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
