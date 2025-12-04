import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const homeMetadata: Metadata = {
  title: 'Trang chủ',
  description: 'Khám phá menu đa dạng với nhiều món ăn ngon. Đặt món trực tuyến nhanh chóng, thanh toán dễ dàng tại HRK.',
  openGraph: {
    title: 'HRK - Trang chủ | Menu đa dạng, đặt món nhanh chóng',
    description: 'Khám phá menu đa dạng với nhiều món ăn ngon. Đặt món trực tuyến nhanh chóng, thanh toán dễ dàng tại HRK.',
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'HRK - Nhà hàng & Đặt món trực tuyến',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HRK - Trang chủ | Menu đa dạng, đặt món nhanh chóng',
    description: 'Khám phá menu đa dạng với nhiều món ăn ngon. Đặt món trực tuyến nhanh chóng, thanh toán dễ dàng tại HRK.',
  },
}

export function generateProductMetadata(product: {
  name: string
  description: string | null
  price: number
  image: string | null
}): Metadata {
  const title = `${product.name} | HRK`
  const description = product.description || `Mua ${product.name} với giá ${product.price.toLocaleString('vi-VN')}đ tại HRK. Đặt món trực tuyến nhanh chóng.`
  const image = product.image || `${baseUrl}/og-image.jpg`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/${product.name.toLowerCase().replaceAll(/\s+/g, '-')}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export function generateShopMetadata(categoryName?: string): Metadata {
  const title = categoryName ? `Danh mục ${categoryName} | HRK` : 'Cửa hàng | HRK'
  const description = categoryName
    ? `Xem tất cả sản phẩm trong danh mục ${categoryName} tại HRK. Đặt món trực tuyến nhanh chóng.`
    : 'Khám phá tất cả sản phẩm tại HRK. Menu đa dạng, đặt món trực tuyến nhanh chóng.'

  const shopPath = categoryName ? `/${categoryName}` : ''
  const shopUrl = `${baseUrl}/shop${shopPath}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shopUrl,
    },
  }
}

