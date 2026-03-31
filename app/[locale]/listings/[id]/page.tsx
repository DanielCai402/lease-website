import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listings, getListingById } from '@/lib/data';
import { routing } from '@/i18n/routing';
import ImageGallery from '@/components/ImageGallery';
import ZipMap from '@/components/ZipMap';
import { zipToNeighborhood } from '@/lib/zip-to-neighborhood';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listings.map((l) => ({ locale, id: l.id }))
  );
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing) notFound();

  const t = await getTranslations('Listing');
  const zipEntry = listing.zipCode ? zipToNeighborhood[listing.zipCode] : null;

  function bedroomLabel(n: number) {
    if (n === 0) return t('studio');
    return `${n} ${n > 1 ? t('bedrooms') : t('bedroom')}`;
  }

  function bathroomLabel(n: number) {
    if (n === 1) return `1 ${t('bathroom')}`;
    return `${n} ${t('bathrooms')}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-[#111111] transition-colors mb-6"
      >
        ← {t('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* Left column */}
        <div>
          <ImageGallery images={listing.images} title={listing.title} />

          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1.5">
              <span>{listing.borough}</span>
              <span>·</span>
              <span>{listing.neighborhood}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#111111] leading-snug mb-4">
              {listing.title}
            </h1>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                {bedroomLabel(listing.bedrooms)}
              </span>
              <span className="bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                {bathroomLabel(listing.bathrooms)}
              </span>
              {listing.sqft && (
                <span className="bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                  {listing.sqft.toLocaleString()} {t('sqft')}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#111111] mb-2">{t('aboutTitle')}</h2>
              <p className="text-zinc-600 leading-relaxed">{listing.description}</p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-semibold text-blue-900 mb-1">{t('availability')}</p>
              <p className="text-blue-700 text-sm">
                {t('availableFrom')} <strong>{formatDate(listing.availableFrom)}</strong>
                {listing.availableTo && (
                  <> {t('until')} <strong>{formatDate(listing.availableTo)}</strong></>
                )}
              </p>
            </div>

            {listing.amenities.length > 0 && (
              <div className="mt-6">
                <h2 className="text-base font-semibold text-[#111111] mb-3">{t('amenities')}</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {listing.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-zinc-600">
                      <span className="text-green-500">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right column — Price & Contact */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-[#f9f9f9] border border-zinc-200 rounded-2xl p-6 space-y-5">
            <div>
              <span className="text-3xl font-bold text-[#111111]">
                ${listing.price.toLocaleString()}
              </span>
              <span className="text-zinc-400 text-sm">{t('perMonth')}</span>
            </div>

            <hr className="border-zinc-200" />

            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {t('contact')}
              </p>
              <p className="font-semibold text-[#111111] mb-3">{listing.contactName}</p>
              <div className="space-y-2">
                <a
                  href={`mailto:${listing.contactEmail}`}
                  className="flex items-center gap-2.5 w-full bg-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <span>✉</span>
                  <span>{listing.contactEmail}</span>
                </a>
                {listing.contactPhone && (
                  <a
                    href={`tel:${listing.contactPhone}`}
                    className="flex items-center gap-2.5 w-full border border-zinc-300 text-zinc-700 rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-50 transition-colors"
                  >
                    <span>📞</span>
                    <span>{listing.contactPhone}</span>
                  </a>
                )}
              </div>
            </div>

            <hr className="border-zinc-200" />

            <p className="text-xs text-zinc-400 leading-relaxed">{t('disclaimer')}</p>
          </div>

          <p className="text-xs text-zinc-400 text-center mt-3">
            {t('posted')} {formatDate(listing.postedAt)}
          </p>

          {/* Zip-code area map */}
          {zipEntry && listing.zipCode && (
            <div className="mt-4 bg-white border border-zinc-200 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {t('mapTitle')}
              </p>
              <ZipMap
                zip={listing.zipCode}
                lat={zipEntry.lat}
                lon={zipEntry.lon}
                neighborhood={listing.neighborhood}
                borough={listing.borough}
                locatedInLabel={t('locatedIn', { neighborhood: listing.neighborhood, borough: listing.borough })}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
