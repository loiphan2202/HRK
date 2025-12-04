"use client"

import { Suspense } from "react"
import { CreateProduct } from "@/components/products/create-product"
import { ProductList } from "@/components/products/product-list"
import { ProductListSkeleton } from "@/components/products/product-list-skeleton"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminProductsPage() {
  return (
    <AdminGuard>
    <div className="flex flex-col space-y-6 sm:space-y-8 w-full px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Quản lý sản phẩm</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Quản lý danh mục sản phẩm của bạn, bao gồm tồn kho và giá cả.
        </p>
      </div>
      <div className="flex justify-end">
        <CreateProduct onProductCreated={(product) => {
          // Trigger reload của ProductList
          globalThis.dispatchEvent(new CustomEvent('product-created', { detail: product }))
        }} />
      </div>
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
    </AdminGuard>
  )
}

