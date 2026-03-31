import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listings, getListingById } from '@/lib/data';
import { routing } from '@/i18n/routing';
import MediaGallery from '@/components/MediaGallery';
import ContactCard from '@/components/ContactCard';
import { shortDate } from '@/lib/utils';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listings.map((l) => ({ locale, id: l.id }))
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

  const rentalTypeLabel = listing.rentalType === 'entire'
    ? t('rentalTypeEntire')
    : t('rentalTypeRoom');

  const roomTypeLabel =
    listing.roomType === 'master' ? t('roomTypeMaster') :
    listing.roomType === 'secondary' ? t('roomTypeSecondary') :
    listing.roomType === 'living' ? t('roomTypeLiving') : null;

  const furnishedLabel =
    listing.furnished === 'full' ? t('furnishedFull') :
    listing.furnished === 'partial' ? t('furnishedPartial') :
    t('furnishedNone');

  const parkingLabel =
    listing.parking === 'free' ? t('parkingFree') :
    listing.parking === 'paid'
      ? `${t('parkingPaid')}${listing.parkingFee ? ` ($${listing.parkingFee}/mo)` : ''}`
    : t('parkingNone');

  const petsLabel =
    listing.pets === 'yes' ? t('petsYes') :
    listing.pets === 'no' ? t('petsNo') :
    t('petsNegotiable');

  const genderLabel =
    listing.roommatesGender === 'female' ? t('genderFemale') :
    listing.roommatesGender === 'male' ? t('genderMale') :
    t('genderMixed');

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-28 lg:pb-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-[#111111] transition-colors mb-6"
      >
        ← {t('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">

        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="min-w-0">

          {/* Gallery */}
          <MediaGallery images={listing.images} title={listing.title} />

          {/* Title + badges + dates */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-[#111111] leading-snug mb-3">
              {listing.title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-zinc-900 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {rentalTypeLabel}{roomTypeLabel ? ` · ${roomTypeLabel}` : ''}
              </span>
              <span className="bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {listing.layout}
              </span>
              <span className="bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {listing.neighborhood}, {listing.borough}
              </span>
            </div>

            {/* Dates */}
            <p className="text-sm text-zinc-500">
              {t('availableLabel')}：{shortDate(listing.availableFrom)} – {shortDate(listing.availableTo)}
              {listing.flexibleDates && (
                <span className="ml-2 text-xs text-blue-500 font-medium border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded">
                  {t('flexible')}
                </span>
              )}
            </p>
          </div>

          {/* Description */}
          {listing.description && (
            <section className="mt-6 pt-6 border-t border-zinc-100">
              <h2 className="text-base font-semibold text-[#111111] mb-2">{t('aboutTitle')}</h2>
              <p className="text-zinc-600 leading-relaxed text-sm">{listing.description}</p>
            </section>
          )}

          {/* Property details */}
          <section className="mt-6 pt-6 border-t border-zinc-100">
            <h2 className="text-base font-semibold text-[#111111] mb-4">{t('detailsTitle')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Furnished */}
              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                <span className="text-xl leading-none mt-0.5">🛋</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800">{furnishedLabel}</p>
                  {listing.furnitureDetails && (
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{listing.furnitureDetails}</p>
                  )}
                </div>
              </div>

              {/* Parking */}
              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                <span className="text-xl leading-none mt-0.5">🚗</span>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{parkingLabel}</p>
                </div>
              </div>

              {/* Pets */}
              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                <span className="text-xl leading-none mt-0.5">🐾</span>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{petsLabel}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Roommate section (room rental only) */}
          {listing.rentalType === 'room' && (
            <section className="mt-6 pt-6 border-t border-zinc-100">
              <h2 className="text-base font-semibold text-[#111111] mb-3">{t('roommatesTitle')}</h2>
              <p className="text-sm text-zinc-600">
                {[
                  listing.roommatesCount ? `${listing.roommatesCount} ${t('roommatesTotal')}` : null,
                  listing.roommatesGender ? genderLabel : null,
                  listing.sharedBathrooms ? `${listing.sharedBathrooms} ${t('sharedBaths')}` : null,
                ].filter(Boolean).join(' · ')}
              </p>

              {/* Living room extras */}
              {listing.roomType === 'living' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    listing.hasPartition
                      ? 'bg-green-50 text-green-700'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {listing.hasPartition ? `✓ ${t('hasPartition')}` : `✗ ${t('noPartition')}`}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    listing.hasWindow
                      ? 'bg-green-50 text-green-700'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {listing.hasWindow ? `✓ ${t('hasWindow')}` : `✗ ${t('noWindow')}`}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Posted date */}
          <p className="text-xs text-zinc-400 mt-8 pt-6 border-t border-zinc-100">
            {t('posted')} {formatDate(listing.postedAt)}
          </p>
        </div>

        {/* ── Right column — ContactCard (desktop sidebar + mobile sheet) ── */}
        <ContactCard
          monthlyPrice={listing.monthlyPrice}
          monthlyNegotiable={listing.monthlyNegotiable}
          dailyPrice={listing.dailyPrice}
          dailyNegotiable={listing.dailyNegotiable}
          utilitiesIncluded={listing.utilitiesIncluded}
          utilitiesCost={listing.utilitiesCost}
          utilitiesUnit={listing.utilitiesUnit}
          depositMonthlyMode={listing.depositMonthlyMode}
          depositMonthlyConvention={listing.depositMonthlyConvention}
          depositMonthlyAmount={listing.depositMonthlyAmount}
          depositDailyMode={listing.depositDailyMode}
          depositDailyAmount={listing.depositDailyAmount}
          depositDailyPercent={listing.depositDailyPercent}
          wechat={listing.wechat}
        />
      </div>
    </div>
  );
}
