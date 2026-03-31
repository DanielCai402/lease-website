'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Listing } from '@/lib/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const t = useTranslations('Card');

  const bedroomBadge = listing.bedrooms === 0 ? t('studio') : `${listing.bedrooms} ${t('br')}`;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative h-52 w-full overflow-hidden bg-zinc-100">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full text-zinc-700">
          {listing.borough}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-zinc-400 mb-1">{listing.neighborhood}</p>
        <h2 className="font-semibold text-zinc-900 leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
          {listing.title}
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-zinc-900">${listing.price.toLocaleString()}</span>
            <span className="text-zinc-400 text-sm">{t('perMonth')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="bg-zinc-100 px-2 py-0.5 rounded-md">{bedroomBadge}</span>
            {listing.bathrooms > 0 && (
              <span className="bg-zinc-100 px-2 py-0.5 rounded-md">{listing.bathrooms} {t('ba')}</span>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {t('available')} {formatDate(listing.availableFrom)}
        </p>
      </div>
    </Link>
  );
}
