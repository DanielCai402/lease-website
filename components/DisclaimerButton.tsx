'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DisclaimerModal from './DisclaimerModal';

export default function DisclaimerButton() {
  const t = useTranslations('Disclaimer');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t('buttonLabel')}
        aria-label={t('buttonLabel')}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-base shadow-md"
      >
        ⓘ
      </button>
      <DisclaimerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
