import { Suspense } from "react"
import { OrderList } from "@/components/orders/order-list"

export default function OrdersPage() {
  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders.
          </p>
        </div>
      </div>
      <Suspense>
        <OrderList />
      </Suspense>
    </div>
  )
}