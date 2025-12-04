"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/auth-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
  tableNumber: number | null
  total: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
  orderProducts: OrderProduct[]
}

async function getOrders(userId?: string): Promise<Order[]> {
  const url = userId ? `/api/orders/user/${userId}` : "/api/orders"
  const res = await fetch(url)
  const data = await res.json()
  
  if (!res.ok || !data.success) {
    console.error('Error fetching orders:', data.error);
    throw new Error(data.error?.message || "Failed to fetch orders")
  }
  
  return data.data
}

const LOADING_SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => `order-skeleton-${i}`)

export function OrderList() {
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadOrders() {
    try {
      setLoading(true)
      const data = await getOrders(user?.id)
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500"
      case "PROCESSING": return "bg-blue-500"
      case "COMPLETED": return "bg-green-500"
      case "CANCELLED": return "bg-red-500"
      default: return "bg-gray-500"
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
            {LOADING_SKELETON_KEYS.map((key) => (
              <TableRow key={key} className="animate-pulse">
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
            <TableHead>Table</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id.slice(-8)}</TableCell>
                <TableCell>
                  {order.tableNumber ? `Table ${order.tableNumber}` : "N/A"}
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
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}