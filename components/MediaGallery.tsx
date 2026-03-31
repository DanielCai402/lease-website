'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
  title: string;
}

export default function MediaGallery({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((i) => (i !== null && i < images.length - 1 ? i + 1 : i));
      if (e.key === 'ArrowLeft') setLightbox((i) => (i !== null && i > 0 ? i - 1 : i));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      {/* Hero image */}
      <div
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-100 cursor-zoom-in"
        onClick={() => setLightbox(active)}
      >
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 1024px) 100vw, 640px"
        />
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-0.5">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); }}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors bg-zinc-100 ${
                active === i ? 'border-blue-500' : 'border-transparent hover:border-zinc-300'
              }`}
              aria-label={`Image ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightbox]}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {/* Prev */}
          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); setActive(lightbox - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-2xl transition-colors"
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {/* Next */}
          {lightbox < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); setActive(lightbox + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-2xl transition-colors"
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl transition-colors"
            aria-label="Close"
          >
            ×
          </button>

          {/* Counter */}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightbox + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
}
