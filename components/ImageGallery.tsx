'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-zinc-100">
        <Image
          src={images[current]}
          alt={`${title} — photo ${current + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 65vw"
          priority
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-white transition-colors shadow-sm"
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-white transition-colors shadow-sm"
              aria-label="Next photo"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
              {current + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                current === i ? 'ring-2 ring-blue-600 ring-offset-1' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={src}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
