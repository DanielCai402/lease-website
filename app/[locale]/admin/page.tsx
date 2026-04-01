'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Report = {
  id: string;
  created_at: string;
  listing_id: string;
  reason: string;
  resolved: boolean;
  listings: {
    title: string;
    neighborhood: string;
    borough: string;
  } | null;
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

export default function AdminPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'zh';

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
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
        setLoading(false);
      });
  }, []);

  async function handleResolve(id: string) {
    setResolvedIds((prev) => new Set([...prev, id]));
    const { error } = await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('id', id);
    if (error) console.error('Failed to update report:', error);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">举报管理</h1>
      <p className="text-sm text-zinc-500 mb-8">共 {reports.length} 条举报</p>

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
                      {report.listings ? (
                        <a
                          href={`/${locale}/listings/${report.listing_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600"
                        >
                          {report.listings.title}
                        </a>
                      ) : (
                        <span className="text-zinc-400">（房源已删除）</span>
                      )}
                    </p>

                    {/* Borough */}
                    {report.listings?.borough && (
                      <p className="text-xs text-zinc-500 mb-2">
                        {report.listings.borough}
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
    </div>
  );
}
