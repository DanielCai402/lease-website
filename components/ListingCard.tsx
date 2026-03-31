'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Listing } from '@/lib/types';
import { shortDate } from '@/lib/utils';

export default function ListingCard({ listing }: { listing: Listing }) {
  const t = useTranslations('Card');

  let typeBadge: string;
  if (listing.rentalType === 'entire') {
    typeBadge = t('entireUnit');
  } else {
    const roomLabel =
      listing.roomType === 'master' ? t('master') :
      listing.roomType === 'secondary' ? t('secondary') :
      t('living');
    typeBadge = `${t('room')} · ${roomLabel}`;
  }

  const tags: string[] = [];
  if (listing.furnished === 'full') tags.push(t('tagFurnished'));
  else if (listing.furnished === 'partial') tags.push(t('tagPartialFurnished'));
  if (listing.pets === 'yes') tags.push(t('tagPets'));
  if (listing.parking !== 'none') tags.push(t('tagParking'));

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Cover — 16:9 */}
      <div className="relative w-full aspect-video overflow-hidden bg-zinc-100">
        {listing.images[0] && (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        )}
        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          {typeBadge}
        </span>
      </div>

      <div className="p-4 space-y-2">
        {/* Title */}
        <h2 className="font-semibold text-sm text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors leading-snug">
          {listing.title}
        </h2>

        {/* Area · Layout */}
        <p className="text-xs text-zinc-400">
          {listing.neighborhood} · {listing.layout}
        </p>

        {/* Dates */}
        <p className="text-xs text-zinc-500">
          {shortDate(listing.availableFrom)} – {shortDate(listing.availableTo)}
          {listing.flexibleDates && (
            <span className="ml-1.5 text-blue-500 font-medium">{t('flexible')}</span>
          )}
        </p>

        {/* Price(s) */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {listing.monthlyPrice && (
            <span className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-zinc-900">${listing.monthlyPrice.toLocaleString()}</span>
              <span className="text-zinc-400 text-xs">{t('perMonth')}</span>
              {listing.monthlyNegotiable && (
                <span className="ml-1 text-xs text-blue-500">{t('negotiable')}</span>
              )}
            </span>
          )}
          {listing.dailyPrice && (
            <span className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-zinc-900">${listing.dailyPrice}</span>
              <span className="text-zinc-400 text-xs">{t('perDay')}</span>
              {listing.dailyNegotiable && (
                <span className="ml-1 text-xs text-blue-500">{t('negotiable')}</span>
              )}
            </span>
          )}
        </div>

        {/* Quick tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {tags.map((tag) => (
              <span key={tag} className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
