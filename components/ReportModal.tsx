'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const REASONS = ['reason1', 'reason2', 'reason3', 'reason4', 'reason5'] as const;

export default function ReportModal({ isOpen, onClose }: Props) {
  const t = useTranslations('Report');
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleClose() {
    onClose();
    setTimeout(() => { setSelected(''); setSubmitted(false); }, 200);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-3">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm font-medium text-zinc-700">{t('success')}</p>
            <button
              onClick={handleClose}
              className="mt-4 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold text-zinc-900 mb-4">{t('title')}</h3>
            <div className="space-y-3 mb-5">
              {REASONS.map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="report-reason"
                    value={key}
                    checked={selected === key}
                    onChange={() => setSelected(key)}
                    className="accent-blue-600 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                    {t(key)}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-600 hover:border-zinc-400 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => setSubmitted(true)}
                disabled={!selected}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('submit')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
