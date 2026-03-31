'use client';

import dynamic from 'next/dynamic';
import type { ZipMapProps } from './ZipMapLeaflet';

const ZipMapLeaflet = dynamic(() => import('./ZipMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-xl bg-zinc-100 animate-pulse border border-zinc-200" />
  ),
});

export default function ZipMap(props: ZipMapProps) {
  return <ZipMapLeaflet {...props} />;
}
