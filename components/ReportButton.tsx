'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ReportModal from './ReportModal';

export default function ReportButton({ listingId, reportedUserId, listingTitle }: { listingId?: string; reportedUserId?: string; listingTitle?: string }) {
  const t = useTranslations('Report');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
      >
        {t('buttonLabel')}
      </button>
      <ReportModal isOpen={open} onClose={() => setOpen(false)} listingId={listingId} reportedUserId={reportedUserId} listingTitle={listingTitle} />
    </>
  );
}
