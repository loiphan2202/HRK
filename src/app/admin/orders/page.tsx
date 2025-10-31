"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OrderProduct {
  id: string
  quantity: number
  product?: {
    name: string
    price: number
  } | null
}

interface Order {
  id: string
  tableNumber: number | null
  total: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  orderProducts?: OrderProduct[] | null
}

export default function AdminOrdersPage() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  async function loadOrders() {
    try {
      setLoading(true)
      const url = statusFilter !== "ALL" ? `/api/orders?status=${statusFilter}` : "/api/orders"
      const res = await fetch(url)
      const data = await res.json()
      setOrders(data.data || [])
    } catch (error) {
      console.error("Failed to load orders:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) throw new Error("Failed to update order")

      await loadOrders()
    } catch (error) {
      console.error("Failed to update order:", error)
      alert("Failed to update order status")
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
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all restaurant orders
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Orders</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading orders...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders found
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
                      {order.orderProducts && order.orderProducts.length > 0 ? (
                        <div className="space-y-1">
                          {order.orderProducts.map((op) => (
                            <div key={op.id} className="text-sm">
                              {op.quantity}x {op.product?.name || "Unknown"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No items</span>
                      )}
                    </TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

