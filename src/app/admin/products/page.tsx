"use client"

import { Suspense } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { CreateProduct } from "@/components/products/create-product"
import { ProductList } from "@/components/products/product-list"
import { ProductListSkeleton } from "@/components/products/product-list-skeleton"

export default function AdminProductsPage() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  if (isLoading || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Products Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, including inventory and pricing.
          </p>
        </div>
        <CreateProduct />
      </div>
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList />
      </Suspense>
    </div>
  )
}

