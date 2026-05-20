import type { Metadata } from 'next';
import type { CheckoutData } from '@/types/checkout';

export function buildCheckoutMetadata(checkout: CheckoutData | null): Metadata {
  if (!checkout) {
    return {
      title: 'Checkout nao encontrado',
    };
  }

  const { config, name, description: checkoutDescription } = checkout;
  const seo = config.seo;

  const metaTitle = seo?.metaTitle || seo?.openGraph?.title || config.pageTitle || name;
  const metaDescription = seo?.metaDescription || seo?.openGraph?.description || checkoutDescription;
  const faviconUrl = config.faviconUrl;

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    keywords: seo?.metaKeywords || undefined,
    robots: seo?.robots || 'index, follow',
    ...(faviconUrl && {
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
    }),
  };

  const og = seo?.openGraph;
  const ogType: 'website' | 'article' = og?.type === 'article' ? 'article' : 'website';

  if (og) {
    metadata.openGraph = {
      title: og.title || metaTitle,
      description: og.description || metaDescription || undefined,
      siteName: og.siteName || undefined,
      locale: og.locale || 'pt_BR',
      type: ogType,
      ...(og.imageUrl && {
        images: [
          {
            url: og.imageUrl,
            width: og.imageWidth || 1200,
            height: og.imageHeight || 630,
            alt: og.imageAlt || metaTitle,
          },
        ],
      }),
    };
  } else {
    const primaryProduct = checkout.products[0];
    const defaultImage = config.logoUrl || primaryProduct?.imageUrl;

    metadata.openGraph = {
      title: metaTitle,
      description: metaDescription || undefined,
      locale: 'pt_BR',
      type: 'website',
      ...(defaultImage && {
        images: [
          {
            url: defaultImage,
            alt: metaTitle,
          },
        ],
      }),
    };
  }

  const twitter = seo?.twitter;
  if (twitter) {
    metadata.twitter = {
      card: twitter.card || 'summary_large_image',
      title: twitter.title || metaTitle,
      description: twitter.description || metaDescription || undefined,
      site: twitter.site || undefined,
      creator: twitter.creator || undefined,
      ...(twitter.imageUrl && {
        images: [twitter.imageUrl],
      }),
    };
  } else {
    const twitterImage = seo?.openGraph?.imageUrl || config.logoUrl || checkout.products[0]?.imageUrl;

    metadata.twitter = {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription || undefined,
      ...(twitterImage && {
        images: [twitterImage],
      }),
    };
  }

  return metadata;
}
