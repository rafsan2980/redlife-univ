import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { DONATION_PHOTOS_A } from '../donationPhotosA';
import { DONATION_PHOTOS_B } from '../donationPhotosB';
import { api } from '../lib/api';

const CURATED_PHOTOS = [...DONATION_PHOTOS_A, ...DONATION_PHOTOS_B];

interface DonationGalleryProps {
  onOpenRegister: () => void;
}

export default function DonationGallery({ onOpenRegister }: DonationGalleryProps) {
  const [photos, setPhotos] = useState<any[]>(CURATED_PHOTOS);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Approved donor uploads go first in the slideshow, so the newest
  // real campus donation photos are what visitors see first.
  useEffect(() => {
    api.getApprovedDonationPhotos()
      .then((approved) => {
        if (!approved || approved.length === 0) return;
        const userPhotos = approved.slice(0, 12).map((p: any) => ({
          src: p.photoData,
          alt: p.caption || `Donation photo by ${p.donorName}`,
          caption: p.caption || 'Rokto dilam, jibon bachlo',
          sub: `${p.donorName} • Campus Donor`,
        }));
        setPhotos([...userPhotos, ...CURATED_PHOTOS]);
        setIndex(0);
      })
      .catch(() => {
        // Keep the curated gallery when the approved feed is unavailable.
      });
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused, photos.length]);

  const go = (dir: number) => {
    setIndex((i) => (i + dir + photos.length) % photos.length);
  };

  const current = photos[index % photos.length] || photos[0];

  return (
    <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
      <div className="text-center">
        <h2 className="font-display text-xl md:text-2xl font-bold text-white">
          রক্ত দিন, জীবন বাঁচান
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-300">
          আপনার এক ব্যাগ রক্ত কারো মায়ের, কারো বাবার, কারো বন্ধুর জীবন বাঁচাতে পারে।
          আজ আপনি দিলে, কাল আপনার প্রয়োজনে কেউ এগিয়ে আসবে।
          রক্ত দেওয়া মানে শুধু একটা ব্যাগ দেওয়া না, একটা পরিবারকে আশা দেওয়া।
        </p>
        <p className="mt-2 text-xs font-semibold text-[#FBBF24]">
          Every Drop Saves a Life • প্রতি ফোঁটা রক্ত, একটা নতুন জীবন
        </p>
      </div>

      <div
        className="gallery-overlay relative mt-6 overflow-hidden rounded-2xl bg-black"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative h-64 sm:h-80 md:h-96 w-full">
          {photos.map((photo, i) => (
            <img
              key={i}
              src={photo.src}
              alt={photo.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
                i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-5 pt-24 text-left">
            <p className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">{current.caption}</p>
            <p className="mt-1 text-sm font-semibold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
              {index + 1} / {photos.length} • {current.sub || 'Trust University, Barishal Campus Donor Network'}
            </p>
          </div>
        </div>

        <button
          onClick={() => go(-1)}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-[#FF1E1E] transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-[#FF1E1E] transition-colors cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === index ? 'w-7 bg-[#FF1E1E]' : 'w-2.5 bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
        <button
          onClick={onOpenRegister}
          className="flex items-center gap-2 rounded-lg bg-[#FF1E1E] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ff3c3c] transition-colors cursor-pointer"
        >
          <Heart className="h-4 w-4 fill-white" />
          আমিও রক্ত দিতে চাই
        </button>
      </div>
    </div>
  );
}
