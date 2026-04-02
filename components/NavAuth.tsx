'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  return local.slice(0, 3) + '***' + domain;
}

export default function NavAuth() {
  const t = useTranslations('Nav');
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin');
      });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) {
      setUnresolvedCount(0);
      return;
    }

    function fetchCount() {
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false)
        .then(({ count }) => setUnresolvedCount(count ?? 0));
    }

    fetchCount();

    const channel = supabase
      .channel('nav-reports-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        console.log('[NavAuth] reports realtime event:', payload.eventType);
        fetchCount();
      })
      .subscribe((status) => {
        console.log('[NavAuth] reports channel status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    function fetchUnread() {
      supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
        .then(({ count }) => setUnreadMessages(count ?? 0));
    }

    fetchUnread();

    const channel = supabase
      .channel('nav-inquiries-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!ready) return null;

  if (!user) {
    return (
      <Link
        href="/auth"
        className="border border-zinc-300 text-zinc-700 px-4 py-1.5 rounded-full text-sm hover:bg-zinc-50 transition-colors"
      >
        {t('signIn')}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 hidden sm:block">{maskEmail(user.email ?? '')}</span>
      <Link
        href="/my-listings"
        className="hover:text-[#111111] transition-colors"
      >
        {t('myListings')}
      </Link>
      <Link
        href="/messages"
        className="relative hover:text-[#111111] transition-colors"
      >
        {t('messages')}
        {unreadMessages > 0 && (
          <span className="absolute -top-2 -right-3 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </span>
        )}
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          className="relative flex items-center justify-center w-7 h-7 rounded-full hover:bg-zinc-100 transition-colors"
          title={t('adminPanel')}
        >
          <span className="text-base leading-none">🚩</span>
          {unresolvedCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unresolvedCount > 99 ? '99+' : unresolvedCount}
            </span>
          )}
        </Link>
      )}
      <button
        onClick={handleSignOut}
        className="hover:text-[#111111] transition-colors"
      >
        {t('signOut')}
      </button>
    </div>
  );
}
