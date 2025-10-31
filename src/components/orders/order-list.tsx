"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OrderProduct {
  id: string
  orderId: string
  productId: string
  quantity: number
  product?: {
    name: string
    price: number
  } | null
}

interface Order {
  id: string
  userId: string | null
  total: number
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
  orderProducts: OrderProduct[]
}

async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders")
  const data = await res.json()
  
  if (!res.ok || !data.success) {
    console.error('Error fetching orders:', data.error);
    throw new Error(data.error?.message || "Failed to fetch orders")
  }
  
  return data.data
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`loading-${i}`} className="animate-pulse">
                <TableCell>
                  <div className="h-4 w-[100px] rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="h-4 w-[150px] rounded bg-muted" />
                    <div className="h-4 w-[200px] rounded bg-muted" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-[300px] rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-4 w-[80px] rounded bg-muted ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-4 w-[100px] rounded bg-muted ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Products</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>
                  {order.user ? (
                    <div className="space-y-1">
                      <p className="font-medium">{order.user.name || "Guest"}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user.email}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Guest</p>
                      <p className="text-sm text-muted-foreground">
                        No account
                      </p>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.orderProducts && order.orderProducts.length > 0 ? (
                      order.orderProducts.map((op) => (
                        <div key={op.id} className="text-sm">
                          {op.quantity}x {op.product?.name || "Unknown"} (${op.product?.price?.toFixed(2) || "0.00"})
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No products</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}