'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Report = {
  id: string;
  created_at: string;
  listing_id: string | null;
  reason: string;
  resolved: boolean;
  reported_user_id: string | null;
  listing_title: string | null;
  listings: {
    title: string;
    neighborhood: string;
    borough: string;
  } | null;
};

type AdminListing = {
  id: string;
  title: string;
  neighborhood: string;
  borough: string;
  monthlyPrice?: number;
  images: string[];
  videos?: string[];
  created_at: string;
  user_id?: string;
};

const reasonLabels: Record<string, string> = {
  fake: '虚假房源',
  inaccurate: '信息不实',
  scam: '疑似诈骗',
  duplicate: '重复发布',
  other: '其他',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : publicUrl.slice(i + marker.length);
}

export default function AdminPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'zh';

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'reports' | 'listings'>('reports');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Listings state
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Check admin on mount
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsAdmin(data?.role === 'admin');
    }
    checkAdmin();
  }, []);

  // Load reports when switching to that tab
  useEffect(() => {
    if (!isAdmin || tab !== 'reports') return;
    setReportsLoading(true);
    supabase
      .from('reports')
      .select(`
        *,
        listings (
          title,
          neighborhood,
          borough
        )
      `)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to fetch reports:', JSON.stringify(error));
        const rows = (data ?? []) as Report[];
        setReports(rows);
        const pre = new Set<string>();
        rows.forEach((r) => { if (r.resolved) pre.add(r.id); });
        setResolvedIds(pre);
        setReportsLoading(false);
      });
  }, [isAdmin, tab]);

  // Load listings when switching to that tab
  useEffect(() => {
    if (!isAdmin || tab !== 'listings') return;
    setListingsLoading(true);
    supabase
      .from('listings')
      .select('*')
      .or('status.eq.active,status.is.null')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to fetch listings:', JSON.stringify(error));
        setListings(
          (data ?? []).map((row) => ({
            ...row,
            id: String(row.id),
            images: row.images ?? [],
            videos: row.videos ?? [],
          }))
        );
        setListingsLoading(false);
      });
  }, [isAdmin, tab]);

  async function handleResolve(id: string) {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    // listing_id can be null OR undefined depending on Supabase join behaviour
    const listingGone = report.listing_id == null;
    console.log('[handleResolve] id:', id, '| listing_id:', report.listing_id, '| listingGone:', listingGone);

    if (listingGone) {
      // Listing already deleted — hard-delete the report row.
      // Requires RLS policy: CREATE POLICY "Allow admin delete reports" ON reports
      //   FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Failed to delete report:', JSON.stringify(error));
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== id));
    } else {
      // Listing still exists — mark resolved and grey out
      setResolvedIds((prev) => new Set([...prev, id]));
      const { error } = await supabase
        .from('reports')
        .update({ resolved: true })
        .eq('id', id);
      if (error) console.error('Failed to update report:', JSON.stringify(error));
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    setDeleteError('');

    // Best-effort: delete storage files before removing DB record
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      const imagePaths = (listing.images ?? [])
        .map((url) => extractStoragePath(url, 'listing-images'))
        .filter((p): p is string => p !== null);
      if (imagePaths.length) {
        await supabase.storage.from('listing-images').remove(imagePaths);
      }
      const videoPaths = (listing.videos ?? [])
        .map((url) => extractStoragePath(url, 'listing-videos'))
        .filter((p): p is string => p !== null);
      if (videoPaths.length) {
        await supabase.storage.from('listing-videos').remove(videoPaths);
      }
    }

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

    if (!deleted || deleted.length === 0) {
      setDeleteError('删除失败 — RLS 策略可能未配置。');
      setDeleting(false);
      return;
    }

    setListings((prev) => prev.filter((l) => l.id !== id));
    setConfirmId(null);
    setDeleting(false);
  }

  // Admin check loading
  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  // 403
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="text-6xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">403 — 无权访问</h1>
        <p className="text-zinc-500 text-sm">您没有管理员权限。</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">管理后台</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 mb-8 w-fit">
          <button
            onClick={() => setTab('reports')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === 'reports'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            举报管理
          </button>
          <button
            onClick={() => setTab('listings')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === 'listings'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            所有房源
          </button>
        </div>

        {/* ── Reports tab ── */}
        {tab === 'reports' && (
          reportsLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 mb-4">共 {reports.length} 条举报</p>
              {reports.length === 0 ? (
                <p className="text-zinc-400 text-sm py-16 text-center">暂无举报记录</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const isResolved = resolvedIds.has(report.id);
                    return (
                      <div
                        key={report.id}
                        className={`border rounded-xl px-5 py-4 transition-colors ${
                          isResolved
                            ? 'border-zinc-100 bg-zinc-50'
                            : 'border-zinc-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className={`flex-1 min-w-0 ${isResolved ? 'opacity-40' : ''}`}>
                            {/* Time */}
                            <p className="text-xs text-zinc-400 mb-1">
                              {formatDateTime(report.created_at)}
                            </p>

                            {/* Listing title */}
                            <p className={`text-sm font-medium mb-0.5 ${isResolved ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                              {report.listing_id && report.listings ? (
                                <a
                                  href={`/${locale}/listings/${report.listing_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline text-blue-600"
                                >
                                  {report.listings.title}
                                </a>
                              ) : report.listing_title ? (
                                <span>
                                  {report.listing_title}
                                  <span className="ml-2 text-xs text-zinc-400 font-normal">（帖子已删除）</span>
                                </span>
                              ) : (
                                <span className="text-zinc-400">（帖子已删除）</span>
                              )}
                            </p>

                            {/* Borough */}
                            {report.listings?.borough && (
                              <p className="text-xs text-zinc-500 mb-2">
                                {report.listings.borough}
                              </p>
                            )}

                            {/* Reported user */}
                            {report.reported_user_id && (
                              <p className="text-xs text-zinc-400 mb-2">
                                被举报用户：<span className="font-mono">{report.reported_user_id.slice(0, 8)}</span>
                              </p>
                            )}

                            {/* Reason */}
                            <p className={`text-sm ${isResolved ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>
                              {reasonLabels[report.reason] ?? report.reason}
                            </p>
                          </div>

                          {/* Resolve button */}
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={isResolved}
                            className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              isResolved
                                ? 'border-zinc-200 text-zinc-300 cursor-not-allowed bg-zinc-50'
                                : 'border-zinc-300 text-zinc-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 cursor-pointer'
                            }`}
                          >
                            {isResolved ? '已处理' : '标记已处理'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )
        )}

        {/* ── Listings tab ── */}
        {tab === 'listings' && (
          listingsLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 mb-4">共 {listings.length} 条活跃房源</p>
              {listings.length === 0 ? (
                <p className="text-zinc-400 text-sm py-16 text-center">暂无房源</p>
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
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-zinc-100 rounded-lg flex-shrink-0 flex items-center justify-center text-zinc-400 text-xl">
                          🏠
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <a
                          href={`/${locale}/listings/${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-zinc-900 hover:text-blue-600 truncate block mb-0.5 transition-colors"
                        >
                          {listing.title}
                        </a>
                        <p className="text-xs text-zinc-400">
                          {listing.neighborhood}{listing.borough ? `, ${listing.borough}` : ''}
                        </p>
                        {listing.user_id && (
                          <p className="text-xs text-zinc-400 mt-0.5">
                            用户：<span className="font-mono">{listing.user_id.slice(0, 8)}</span>
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => { setConfirmId(listing.id); setDeleteError(''); }}
                        className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-zinc-900 mb-1">确定要删除这条房源吗？</h3>
            <p className="text-sm text-zinc-500 mb-4">此操作不可撤销，同时会删除相关图片和视频文件。</p>
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
                取消
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
