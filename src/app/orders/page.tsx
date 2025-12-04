"use client"

import { OrderList } from "@/components/orders/order-list"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, Suspense } from "react"

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Đơn hàng của tôi</h1>
          <p className="text-muted-foreground">
            Xem lịch sử đơn hàng của bạn
          </p>
        </div>
      </div>
      <Suspense>
        <OrderList />
      </Suspense>
    </div>
  )
}