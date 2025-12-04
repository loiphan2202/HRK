# 📊 Hướng dẫn SEO cho HRK

## ✅ Đã triển khai

### 1. Metadata cơ bản
- ✅ Title và description cho tất cả pages
- ✅ Open Graph tags cho social media sharing
- ✅ Twitter Card tags
- ✅ Language: Vietnamese (vi)
- ✅ Robots meta tags

### 2. Sitemap tự động
- ✅ File: `src/app/sitemap.ts`
- ✅ Tự động generate sitemap từ:
  - Static routes (home, shop, login, register)
  - Dynamic product routes
  - Dynamic category routes
- ✅ Truy cập: `/sitemap.xml`

### 3. Robots.txt
- ✅ File: `src/app/robots.ts`
- ✅ Cho phép Googlebot index public pages
- ✅ Block admin routes, API routes, và private pages
- ✅ Truy cập: `/robots.txt`

### 4. Structured Data (JSON-LD)
- ✅ Product schema cho product detail pages
- ✅ Organization/Restaurant schema cho toàn site
- ✅ Breadcrumb schema (có thể thêm khi cần)

### 5. Environment Variables
- ✅ `NEXT_PUBLIC_SITE_URL` - URL của site (cho sitemap, Open Graph)

## 🔧 Cấu hình

### 1. Thêm vào `.env`:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Lưu ý:** 
- Development: `http://localhost:3000`
- Production: URL thực tế của bạn (ví dụ: `https://hrk.com`)

### 2. Tạo OG Image

Tạo file `/public/og-image.jpg` với kích thước:
- **1200x630px** (recommended)
- Format: JPG hoặc PNG
- Nội dung: Logo hoặc banner của nhà hàng

## 📈 Các tính năng SEO

### Metadata trong Layout (`src/app/layout.tsx`)
- Title template: `%s | HRK`
- Default description
- Open Graph và Twitter Cards
- Robots configuration
- Language: Vietnamese

### Sitemap (`src/app/sitemap.ts`)
- Tự động cập nhật khi có sản phẩm/category mới
- Priority và changeFrequency được set hợp lý
- LastModified date

### Robots.txt (`src/app/robots.ts`)
- Allow: Public pages (home, shop, products)
- Disallow: Admin, API, private pages (cart, orders, settings)

### Structured Data
- **Product Schema**: Mỗi product detail page có JSON-LD với:
  - Name, description, image
  - Price và currency (VND)
  - Availability status
  - Category

- **Organization Schema**: Toàn site có Restaurant schema với:
  - Name, description
  - URL, logo
  - Cuisine type

## 🚀 Cải thiện SEO tiếp theo

### 1. Google Search Console
1. Đăng ký tại: https://search.google.com/search-console
2. Verify ownership (có thể dùng meta tag hoặc file upload)
3. Submit sitemap: `https://yourdomain.com/sitemap.xml`

### 2. Google Analytics
Thêm Google Analytics để track traffic:
```tsx
// src/app/layout.tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

### 3. Performance Optimization
- ✅ Image optimization (Next.js Image component)
- ✅ Lazy loading
- ✅ Code splitting

### 4. Content SEO
- Thêm alt text cho tất cả images
- Semantic HTML (h1, h2, etc.)
- Internal linking
- Meta descriptions unique cho mỗi page

### 5. Social Media
- Facebook: Thêm Open Graph tags (đã có)
- Twitter: Thêm Twitter Cards (đã có)
- LinkedIn: Sử dụng Open Graph tags

## 📝 Checklist SEO

- [x] Meta title và description
- [x] Open Graph tags
- [x] Twitter Cards
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Structured Data (JSON-LD)
- [x] Language tag
- [x] Canonical URLs (Next.js tự động)
- [ ] OG Image (cần tạo file)
- [ ] Google Search Console verification
- [ ] Google Analytics (optional)
- [ ] Alt text cho images (kiểm tra lại)

## 🔍 Test SEO

### 1. Test Open Graph
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Twitter Card Validator: https://cards-dev.twitter.com/validator

### 2. Test Structured Data
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

### 3. Test Sitemap
- Truy cập: `https://yourdomain.com/sitemap.xml`
- Kiểm tra format và URLs

### 4. Test Robots.txt
- Truy cập: `https://yourdomain.com/robots.txt`
- Kiểm tra rules

## 📚 Tài liệu tham khảo

- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)

