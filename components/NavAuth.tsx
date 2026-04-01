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
      <button
        onClick={handleSignOut}
        className="hover:text-[#111111] transition-colors"
      >
        {t('signOut')}
      </button>
    </div>
  );
}
