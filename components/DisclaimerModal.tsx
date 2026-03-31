'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const STORAGE_KEY = 'nyc_disclaimer_accepted';

interface Props {
  /** Controlled mode: modal is shown when open=true, onClose is called on confirm (no localStorage write) */
  open?: boolean;
  onClose?: () => void;
}

export default function DisclaimerModal({ open, onClose }: Props = {}) {
  const t = useTranslations('Disclaimer');
  const controlled = open !== undefined;

  // Uncontrolled mode: auto-show on first visit
  const [autoVisible, setAutoVisible] = useState(false);
  useEffect(() => {
    if (!controlled && !localStorage.getItem(STORAGE_KEY)) {
      setAutoVisible(true);
    }
  }, [controlled]);

  const visible = controlled ? open : autoVisible;

  function confirm() {
    if (controlled) {
      onClose?.();
    } else {
      localStorage.setItem(STORAGE_KEY, '1');
      setAutoVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-[#111111]">{t('title')}</h2>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
            {t('body')}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-zinc-100 flex-shrink-0">
          <button
            onClick={confirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {t('confirm')}
          </button>
        </div>

      </div>
    </div>
  );
}
