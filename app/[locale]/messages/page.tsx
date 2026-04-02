'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';

interface Inquiry {
  id: string;
  listing_id: string;
  wechat_id: string;
  message: string | null;
  created_at: string;
  read: boolean;
}

interface ListingGroup {
  listing_id: string;
  listing_title: string;
  inquiries: Inquiry[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesPage() {
  const t = useTranslations('Messages');
  const router = useRouter();
  const [groups, setGroups] = useState<ListingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?redirect=/messages' as Parameters<typeof router.push>[0]);
        return;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('id, listing_id, wechat_id, message, created_at, read, listings(title)')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        setFetchError(error.message);
        setLoading(false);
        return;
      }

      const map = new Map<string, ListingGroup>();
      for (const row of (data ?? [])) {
        const listingTitle = (row.listings as { title: string } | null)?.title ?? row.listing_id;
        if (!map.has(row.listing_id)) {
          map.set(row.listing_id, { listing_id: row.listing_id, listing_title: listingTitle, inquiries: [] });
        }
        map.get(row.listing_id)!.inquiries.push({
          id: row.id,
          listing_id: row.listing_id,
          wechat_id: row.wechat_id,
          message: row.message,
          created_at: row.created_at,
          read: row.read ?? false,
        });
      }

      setGroups(Array.from(map.values()));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAsRead(inquiryId: string) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        inquiries: g.inquiries.map((inq) =>
          inq.id === inquiryId ? { ...inq, read: true } : inq
        ),
      }))
    );
    await supabase.from('inquiries').update({ read: true }).eq('id', inquiryId);
  }

  async function deleteInquiry(inquiryId: string) {
    await supabase.from('inquiries').delete().eq('id', inquiryId);
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, inquiries: g.inquiries.filter((inq) => inq.id !== inquiryId) }))
        .filter((g) => g.inquiries.length > 0)
    );
    setConfirmDeleteId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {fetchError}
        </p>
      </div>
    );
  }

  const totalInquiries = groups.reduce((sum, g) => sum + g.inquiries.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{t('title')}</h1>

      {totalInquiries === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-4">💬</p>
          <p className="text-xl font-semibold text-zinc-700 mb-1">{t('empty')}</p>
          <p className="text-zinc-400 text-sm">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => {
            const unreadCount = group.inquiries.filter((inq) => !inq.read).length;
            const totalCount = group.inquiries.length;
            return (
              <div key={group.listing_id}>
                {/* Group header */}
                <div className="flex items-baseline gap-3 mb-3 px-1">
                  <Link
                    href={`/listings/${group.listing_id}` as Parameters<typeof Link>[0]['href']}
                    className="text-sm font-semibold text-zinc-800 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {group.listing_title}
                  </Link>
                  <span className="text-xs text-zinc-400 flex-shrink-0">
                    {unreadCount > 0
                      ? t('countWithUnread', { total: totalCount, unread: unreadCount })
                      : t('countRead', { total: totalCount })}
                  </span>
                </div>

                {/* Inquiry list */}
                <div className="flex flex-col gap-2">
                  {group.inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className={`rounded-xl border px-4 py-3 transition-colors ${
                        inq.read
                          ? 'bg-white border-zinc-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {!inq.read && (
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <span className={`text-sm font-medium truncate ${inq.read ? 'text-zinc-600' : 'text-zinc-900'}`}>
                              {t('wechat')}: {inq.wechat_id}
                            </span>
                          </div>
                          {inq.message && (
                            <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{inq.message}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                          <span className="text-xs text-zinc-400">
                            {formatDate(inq.created_at)}
                          </span>
                          <button
                            onClick={() => setConfirmDeleteId(inq.id)}
                            className="text-zinc-300 hover:text-red-400 transition-colors"
                            aria-label={t('deleteButton')}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {!inq.read && (
                          <button
                            onClick={() => markAsRead(inq.id)}
                            className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            {t('clickToRead')}
                          </button>
                        )}
                        <Link
                          href={`/listings/${inq.listing_id}` as Parameters<typeof Link>[0]['href']}
                          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          {t('viewListing')} →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-zinc-800 mb-5">{t('deleteConfirmBody')}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm rounded-xl border border-zinc-300 text-zinc-600 hover:border-zinc-400 transition-colors"
              >
                {t('deleteCancel')}
              </button>
              <button
                onClick={() => deleteInquiry(confirmDeleteId)}
                className="px-4 py-2 text-sm rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
