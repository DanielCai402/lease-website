'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type MediaItem = { src: string; kind: 'image' | 'video' };

interface Props {
  images: string[];
  videos?: string[];
  title: string;
}

export default function MediaGallery({ images, videos = [], title }: Props) {
  const media: MediaItem[] = [
    ...images.map((src) => ({ src, kind: 'image' as const })),
    ...videos.map((src) => ({ src, kind: 'video' as const })),
  ];

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i !== null && i < media.length - 1 ? i + 1 : i));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i !== null && i > 0 ? i - 1 : i));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, media.length]);

  if (media.length === 0) return null;

  const current = media[active];

  return (
    <>
      {/* Hero */}
      <div
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-100 cursor-zoom-in"
        onClick={() => { if (current.kind === 'image') setLightbox(active); }}
      >
        {current.kind === 'image' ? (
          <Image
            src={current.src}
            alt={title}
            fill
            priority
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 1024px) 100vw, 640px"
          />
        ) : (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            className="w-full h-full object-contain bg-black cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {media.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
            {active + 1} / {media.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors bg-zinc-100 ${
                active === i ? 'border-blue-500' : 'border-transparent hover:border-zinc-300'
              }`}
              aria-label={item.kind === 'video' ? `Video ${i + 1}` : `Image ${i + 1}`}
            >
              {item.kind === 'image' ? (
                <Image src={item.src} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <>
                  <video
                    src={item.src}
                    preload="metadata"
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-zinc-700 translate-x-px">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox (images only) */}
      {lightbox !== null && media[lightbox]?.kind === 'image' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media[lightbox].src}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); setActive(lightbox - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-2xl transition-colors"
              aria-label="Previous"
            >‹</button>
          )}

          {lightbox < media.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); setActive(lightbox + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-2xl transition-colors"
              aria-label="Next"
            >›</button>
          )}

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl transition-colors"
            aria-label="Close"
          >×</button>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightbox + 1} / {media.length}
          </span>
        </div>
      )}
    </>
  );
}
