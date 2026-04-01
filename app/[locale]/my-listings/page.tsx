'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';
import type { Listing } from '@/lib/types';

type ListingRow = Listing & { status: string };

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

export default function MyListingsPage() {
  const t = useTranslations('MyListings');
  const router = useRouter();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?redirect=/my-listings' as Parameters<typeof router.push>[0]);
        return;
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        setFetchError(error.message);
        setLoading(false);
        return;
      }

      setListings(
        (data ?? []).map((row) => ({
          ...row,
          id: String(row.id),
          images: row.images ?? [],
          status: row.status ?? 'active',
          postedAt: row.postedAt ?? row.created_at,
        }))
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    setDeleting(true);
    setDeleteError('');

    // Delete storage files first (best-effort — don't block on storage errors)
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      const imagePaths = (listing.images ?? [])
        .map((url) => extractStoragePath(url, 'listing-images'))
        .filter((p): p is string => p !== null);
      if (imagePaths.length) {
        await supabase.storage.from('listing-images').remove(imagePaths);
      }
      const videoPaths = ((listing.videos as string[] | undefined) ?? [])
        .map((url) => extractStoragePath(url, 'listing-videos'))
        .filter((p): p is string => p !== null);
      if (videoPaths.length) {
        await supabase.storage.from('listing-videos').remove(videoPaths);
      }
    }

    // Delete the DB record — check both error and affected rows
    const { data: deleted, error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
      return;
    }

    // If RLS blocked the delete, Supabase returns no error but 0 rows
    if (!deleted || deleted.length === 0) {
      setDeleteError('Delete failed — you may not have permission to delete this listing. Make sure the RLS DELETE policy is in place.');
      setDeleting(false);
      return;
    }

    // Only remove from local state after confirmed DB deletion
    setListings((prev) => prev.filter((l) => l.id !== id));
    setConfirmId(null);
    setDeleting(false);
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
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {fetchError}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">{t('title')}</h1>
          <Link
            href="/post"
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t('postListing')}
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">🏠</p>
            <p className="text-xl font-semibold text-zinc-700 mb-1">{t('empty')}</p>
            <p className="text-zinc-400 text-sm mb-6">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="border border-zinc-200 bg-white rounded-xl p-4 flex items-center gap-4"
              >
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-zinc-100 rounded-lg flex-shrink-0 flex items-center justify-center text-zinc-400 text-2xl">
                    🏠
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-zinc-900 truncate mb-0.5">
                    {listing.title}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {listing.neighborhood}
                    {listing.borough ? `, ${listing.borough}` : ''}
                  </p>
                  {listing.monthlyPrice && (
                    <p className="text-xs text-zinc-500 mt-0.5">${listing.monthlyPrice}/mo</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/edit-listing/${listing.id}`}
                    className="text-xs border border-zinc-300 text-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    {t('edit')}
                  </Link>
                  <button
                    onClick={() => { setConfirmId(listing.id); setDeleteError(''); }}
                    className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-zinc-900 mb-1">{t('deleteConfirmTitle')}</h3>
            <p className="text-sm text-zinc-500 mb-4">{t('deleteConfirmBody')}</p>
            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setConfirmId(null); setDeleteError(''); }}
                disabled={deleting}
                className="px-4 py-2 text-sm border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {t('deleteCancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
