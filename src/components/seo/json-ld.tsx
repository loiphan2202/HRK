'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

interface ProductJsonLdProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    image: string | null
    stock: number | null
    categories?: Array<{
      category: {
        id: string
        name: string
      }
    }>
  }
  baseUrl?: string
}

export function ProductJsonLd({ product, baseUrl = 'http://localhost:3000' }: Readonly<ProductJsonLdProps>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Mua ${product.name} tại HRK`,
    image: product.image || `${baseUrl}/og-image.jpg`,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'VND',
      availability: product.stock === null || product.stock === -1 || product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/${product.id}`,
    },
    ...(product.categories && product.categories.length > 0 && {
      category: product.categories.map((pc) => pc.category.name).join(', '),
    }),
  }

  return (
    <Script
      id={`product-jsonld-${product.id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface OrganizationJsonLdProps {
  baseUrl?: string
}

export function OrganizationJsonLd({ baseUrl = 'http://localhost:3000' }: Readonly<OrganizationJsonLdProps >) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'HRK',
    description: 'Nhà hàng & Đặt món trực tuyến',
    url: baseUrl,
    logo: `${baseUrl}/og-image.jpg`,
    servesCuisine: 'Vietnamese',
    priceRange: '$$',
  }

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbJsonLd({ items }: Readonly<BreadcrumbJsonLdProps>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

