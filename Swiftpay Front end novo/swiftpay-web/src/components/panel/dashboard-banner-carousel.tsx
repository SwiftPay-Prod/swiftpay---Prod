'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { ArrowLeft02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { Routes } from '@/router/routes';

interface DashboardBannerCarouselProps {
  isCompact?: boolean;
}

interface DashboardBannerItem {
  id: string;
  alt: string;
  href?: string;
  desktopImageSrc: string;
  mobileImageSrc: string;
}

const DASHBOARD_BANNERS: DashboardBannerItem[] = [
  {
    id: 'dashboard',
    alt: 'Banner principal do dashboard',
    desktopImageSrc: '/images/banner-dashboard.png',
    mobileImageSrc: '/images/banner-dashboard-mobile.png',
  },
  {
    id: 'referral',
    alt: 'Banner de indique e ganhe',
    href: Routes.panel.referrals,
    desktopImageSrc: '/images/banner-dashboard-referral.png',
    mobileImageSrc: '/images/banner-dashboard-referral-mobile.png',
  },
];

export function DashboardBannerCarousel({ isCompact = false }: DashboardBannerCarouselProps) {
  const AUTO_PLAY_MS = 6000;
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCycleKey((current) => current + 1);
      setActiveIndex((current) => (current + 1) % DASHBOARD_BANNERS.length);
    }, AUTO_PLAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [AUTO_PLAY_MS, activeIndex, cycleKey]);

  function goToPrevious() {
    setCycleKey((current) => current + 1);
    setActiveIndex((current) => (current - 1 + DASHBOARD_BANNERS.length) % DASHBOARD_BANNERS.length);
  }

  function goToNext() {
    setCycleKey((current) => current + 1);
    setActiveIndex((current) => (current + 1) % DASHBOARD_BANNERS.length);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-default-200 bg-content1">
      <div className={`relative ${isCompact ? 'aspect-4/1' : 'aspect-14/2'}`}>
        {DASHBOARD_BANNERS.map((banner, index) => {
          const isActive = index === activeIndex;
          const slideClassName = `absolute inset-0 transition-opacity duration-700 ease-out ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`;
          const imageTransitionClassName = `object-cover transition-transform duration-700 ease-out ${isActive ? 'scale-100' : 'scale-105'}`;
          const imageContent = (
            <>
              <Image
                src={banner.mobileImageSrc}
                alt={banner.alt}
                fill
                className={`${imageTransitionClassName} sm:hidden`}
                priority={index === 0}
              />
              <Image
                src={banner.desktopImageSrc}
                alt={banner.alt}
                fill
                className={`hidden ${imageTransitionClassName} sm:block`}
                priority={index === 0}
              />
            </>
          );

          if (!banner.href) {
            return (
              <div
                key={banner.id}
                className={slideClassName}
              >
                {imageContent}
              </div>
            );
          }

          return (
            <Link
              key={banner.id}
              href={banner.href}
              className={slideClassName}
            >
              {imageContent}
            </Link>
          );
        })}

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-linear-to-r from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-linear-to-l from-black/55 to-transparent" />

        <div className="absolute inset-y-0 left-0 z-20 flex items-center pl-2 sm:pl-3">
          <Button
            isIconOnly
            variant="tertiary"
            aria-label="Banner anterior"
            className="bg-black/40 text-white backdrop-blur-sm hover:bg-black/55"
            onPress={goToPrevious}
          >
            <Icon icon={ArrowLeft02Icon} className="icon-sm" />
          </Button>
        </div>

        <div className="absolute inset-y-0 right-0 z-20 flex items-center pr-2 sm:pr-3">
          <Button
            isIconOnly
            variant="tertiary"
            aria-label="Proximo banner"
            className="bg-black/40 text-white backdrop-blur-sm hover:bg-black/55"
            onPress={goToNext}
          >
            <Icon icon={ArrowRight01Icon} className="icon-sm" />
          </Button>
        </div>

        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {DASHBOARD_BANNERS.map((banner, index) => (
            <Button
              key={banner.id}
              isIconOnly
              variant="tertiary"
              aria-label={`Ir para banner ${index + 1}`}
              className="relative h-1.5 min-h-1.5 w-10 min-w-10 overflow-hidden rounded-full bg-transparent p-0"
              onPress={() => {
                setCycleKey((current) => current + 1);
                setActiveIndex(index);
              }}
            >
              <span className="absolute inset-0 rounded-full bg-black/55 ring-1 ring-white/25" />
              <span
                key={`${banner.id}-${activeIndex === index ? cycleKey : 'idle'}`}
                className={`absolute inset-y-0 left-0 origin-left rounded-full ${activeIndex === index ? 'bg-accent shadow-[0_0_10px_var(--accent)]' : 'bg-white/50'}`}
                style={activeIndex === index ? { width: '100%', animation: `dashboard-banner-dot-progress ${AUTO_PLAY_MS}ms linear forwards` } : { width: '100%' }}
              />
            </Button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes dashboard-banner-dot-progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
