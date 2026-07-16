import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Product } from '../types';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  product?: Product | null;
  isStore?: boolean;
}

export default function SEO({
  title,
  description,
  image,
  canonicalPath = '',
  product = null,
  isStore = false,
}: SEOProps) {
  const siteName = 'midad | مداد - متجر المستلزمات المدرسية';
  const defaultDesc = 'مداد (midad) - وجهتك الإلكترونية الأولى لشراء كافة اللوازم والمستلزمات المدرسية والأكاديمية بأفضل الأسعار. حقائب، دفاتر، أقلام، وآلات حاسبة.';
  const defaultImage = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'; // Default bag/store image

  const currentOrigin = typeof window !== 'undefined' && !window.location.origin.includes('run.app') ? window.location.origin : 'https://school-store-touggourt.netlify.app';
  const canonicalUrl = `${currentOrigin}${canonicalPath}`;

  const metaTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDesc = description || defaultDesc;
  const metaImage = image || defaultImage;

  // JSON-LD Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${currentOrigin}/#organization`,
    'name': 'midad | مداد',
    'url': currentOrigin,
    'logo': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=180',
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': '0661000000',
      'contactType': 'customer service',
      'areaServed': 'DZ',
      'availableLanguage': ['Arabic', 'French']
    },
    'sameAs': [
      'https://www.facebook.com/schoolstore.touggourt',
      'https://www.instagram.com/schoolstore.touggourt'
    ]
  };

  // JSON-LD Local Business / Store Schema (Linked to Organization)
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${currentOrigin}/#store`,
    'parentOrganization': {
      '@id': `${currentOrigin}/#organization`
    },
    'name': 'School Store Touggourt | متجر المستلزمات المدرسية بتوقرت',
    'image': defaultImage,
    'url': currentOrigin,
    'telephone': '0661000000',
    'priceRange': 'DZD',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'حي المستقبل، وسط المدينة',
      'addressLocality': 'توقرت',
      'addressRegion': 'ولاية توقرت',
      'addressCountry': 'DZ',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 33.1583,
      'longitude': 6.0667,
    },
    'openingHoursSpecification': {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      'opens': '08:00',
      'closes': '21:00'
    }
  };

  // Dynamic BreadcrumbList Schema
  const getBreadcrumbSchema = () => {
    const items = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'الرئيسية',
        'item': currentOrigin,
      },
    ];

    if (canonicalPath.startsWith('/product/') && product) {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': product.isPack ? 'الباكات المدرسية' : 'الأدوات الفردية',
        'item': `${currentOrigin}/`,
      });
      items.push({
        '@type': 'ListItem',
        'position': 3,
        'name': product.name,
        'item': canonicalUrl,
      });
    } else if (canonicalPath === '/privacy') {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'سياسة الخصوصية',
        'item': canonicalUrl,
      });
    } else if (canonicalPath === '/terms') {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'شروط وأحكام الاستخدام',
        'item': canonicalUrl,
      });
    } else if (canonicalPath === '/shipping') {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'الشحن والإرجاع',
        'item': canonicalUrl,
      });
    } else if (canonicalPath === '/faq') {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'الأسئلة الشائعة',
        'item': canonicalUrl,
      });
    } else if (canonicalPath === '/auth') {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'تسجيل الدخول / إنشاء حساب',
        'item': canonicalUrl,
      });
    } else if (canonicalPath === '/profile') {
      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'الملف الشخصي',
        'item': canonicalUrl,
      });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items,
    };
  };

  // JSON-LD Product Schema
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.name,
        'image': product.image,
        'description': product.description,
        'sku': product.id,
        'mpn': product.id,
        'brand': {
          '@type': 'Brand',
          'name': product.brand || 'SchoolStore',
        },
        'offers': {
          '@type': 'Offer',
          'url': `${currentOrigin}/product/${product.id}`,
          'priceCurrency': 'DZD',
          'price': product.price,
          'itemCondition': 'https://schema.org/NewCondition',
          'availability': product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          'seller': {
            '@type': 'LocalBusiness',
            'name': 'School Store Touggourt',
          },
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': product.rating || 4.8,
          'reviewCount': product.isPopular ? 84 : 12,
        },
      }
    : null;

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={product ? 'product' : 'website'} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="School Store Touggourt" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />

      {/* Robots indexing */}
      <meta name="robots" content="index, follow" />

      {/* Structured Schema Data Injection */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      {isStore && (
        <script type="application/ld+json">
          {JSON.stringify(storeSchema)}
        </script>
      )}

      <script type="application/ld+json">
        {JSON.stringify(getBreadcrumbSchema())}
      </script>

      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
    </Helmet>
  );
}
