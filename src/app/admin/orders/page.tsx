"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
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
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, TrendingUp } from "lucide-react"

interface OrderProduct {
  id: string
  quantity: number
  product?: {
    id: string
    name: string
    price: number
    description: string | null
  } | null
}

interface Order {
  id: string
  tableNumber: number | null
  total: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt?: string | null
  user: {
    id: string
    name: string | null
    email: string
  } | null
  orderProducts?: OrderProduct[] | null
}

export default function AdminOrdersPage() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month')
  const [exportPeriod, setExportPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month')
  const [stats, setStats] = useState<{
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    topProducts: Array<{
      productId: string
      productName: string
      quantity: number
      revenue: number
    }>
  } | null>(null)

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    loadOrders()
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, statsPeriod])

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

  async function loadStats() {
    try {
      const periodParam = statsPeriod === 'all' ? '' : statsPeriod
      const res = await fetch(`/api/orders/stats${periodParam ? `?period=${periodParam}` : ''}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
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
      await loadStats()
    } catch (error) {
      console.error("Failed to update order:", error)
      alert("Failed to update order status")
    }
  }

  function getDateRange(period: string) {
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0) // All time
    }
    
    return { startDate, endDate: now }
  }

  function exportToExcel() {
    // Filter orders theo period
    const { startDate, endDate } = getDateRange(exportPeriod)
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })

    if (filteredOrders.length === 0) {
      alert(`Không có đơn hàng nào trong khoảng thời gian đã chọn (${exportPeriod})`)
      return
    }

    // Tính thống kê
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = filteredOrders.length
    
    // Tính số lượng từng món đã bán
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {}
    filteredOrders.forEach(order => {
      order.orderProducts?.forEach((op: OrderProduct) => {
        const productId = op.product?.name || 'Unknown'
        if (!productStats[productId]) {
          productStats[productId] = { name: productId, quantity: 0, revenue: 0 }
        }
        productStats[productId].quantity += op.quantity
        productStats[productId].revenue += (op.product?.price || 0) * op.quantity
      })
    })

    const productStatsArray = Object.values(productStats).sort((a, b) => b.quantity - a.quantity)

    // Tạo CSV content với nhiều sheets (dùng dấu phân cách đặc biệt)
    const periodLabel = {
      week: 'Tuần',
      month: 'Tháng',
      quarter: 'Quý',
      year: 'Năm',
      all: 'Tất cả'
    }[exportPeriod]

    // Sheet 1: Thống kê tổng quan
    const statsHeaders = ['Chỉ số', 'Giá trị']
    const statsRows = [
      ['Khoảng thời gian', periodLabel],
      ['Tổng doanh thu', totalRevenue.toLocaleString('vi-VN') + 'đ'],
      ['Tổng số đơn hàng', totalOrders.toString()],
      ['Giá trị đơn trung bình', (totalRevenue / totalOrders).toLocaleString('vi-VN') + 'đ'],
      ['', ''],
      ['Sản phẩm', 'Số lượng bán', 'Doanh thu']
    ]
    
    productStatsArray.forEach(product => {
      statsRows.push([
        product.name,
        product.quantity.toString(),
        product.revenue.toLocaleString('vi-VN') + 'đ'
      ])
    })

    const statsContent = [
      statsHeaders.join(','),
      ...statsRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Sheet 2: Chi tiết đơn hàng
    const orderHeaders = [
      'Mã đơn', 
      'Khách hàng', 
      'Email', 
      'Bàn số', 
      'Trạng thái', 
      'Đặt món lúc', 
      'Thanh toán lúc',
      'Tên món',
      'Số lượng',
      'Đơn giá',
      'Thành tiền',
      'Tổng đơn',
      'Mô tả món'
    ]
    
    // Tạo rows với mỗi product là một dòng
    const orderRows: string[][] = []
    filteredOrders.forEach(order => {
      const baseInfo = [
        order.id.slice(-8),
        order.user ? (order.user.name || order.user.email) : 'Khách hàng',
        order.user?.email || 'N/A',
        order.tableNumber ? `Bàn ${order.tableNumber}` : 'N/A',
        order.status === 'PENDING' ? 'Chờ xử lý' : order.status === 'PROCESSING' ? 'Đang xử lý' : order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy',
        new Date(order.createdAt).toLocaleString('vi-VN'),
        order.updatedAt ? new Date(order.updatedAt).toLocaleString('vi-VN') : 'Chưa thanh toán',
      ]
      
      if (order.orderProducts && order.orderProducts.length > 0) {
        order.orderProducts.forEach((op: OrderProduct, index: number) => {
          const itemTotal = (op.product?.price || 0) * op.quantity
          orderRows.push([
            ...(index === 0 ? baseInfo : ['', '', '', '', '', '', '']), // Chỉ hiển thị thông tin đơn ở dòng đầu tiên
            op.product?.name || 'Không xác định',
            op.quantity.toString(),
            (op.product?.price || 0).toLocaleString('vi-VN') + 'đ',
            itemTotal.toLocaleString('vi-VN') + 'đ',
            index === 0 ? order.total.toLocaleString('vi-VN') + 'đ' : '', // Chỉ hiển thị tổng ở dòng đầu
            op.product?.description || 'N/A'
          ])
        })
      } else {
        // Nếu không có sản phẩm
        orderRows.push([
          ...baseInfo,
          'N/A',
          '0',
          '0đ',
          '0đ',
          order.total.toLocaleString('vi-VN') + 'đ',
          'N/A'
        ])
      }
    })

    const orderContent = [
      orderHeaders.join(','),
      ...orderRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Kết hợp cả 2 sheets (thêm dòng phân cách)
    const csvContent = [
      '=== THỐNG KÊ ===',
      statsContent,
      '',
      '=== CHI TIẾT ĐƠN HÀNG ===',
      orderContent
    ].join('\n')

    // Tạo và download file
    const periodSuffix = exportPeriod !== 'all' ? `_${exportPeriod}` : ''
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders${periodSuffix}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground mt-2">
            Xem và quản lý tất cả đơn hàng của nhà hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả đơn hàng</SelectItem>
              <SelectItem value="PENDING">Đang chờ</SelectItem>
              <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportPeriod} onValueChange={(value: 'week' | 'month' | 'quarter' | 'year' | 'all') => setExportPeriod(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm này</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kỳ thống kê</p>
                <Select value={statsPeriod} onValueChange={(value: 'week' | 'month' | 'year' | 'all') => setStatsPeriod(value)}>
                  <SelectTrigger className="w-[120px] mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Tuần này</SelectItem>
                    <SelectItem value="month">Tháng này</SelectItem>
                    <SelectItem value="year">Năm nay</SelectItem>
                    <SelectItem value="all">Tất cả</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        {stats && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng doanh thu</p>
                    <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giá trị đơn trung bình</p>
                    <p className="text-2xl font-bold">{stats.averageOrderValue.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top sản phẩm bán chạy */}
      {stats && stats.topProducts && stats.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead className="text-right">Số lượng bán</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((product, index: number) => (
                  <TableRow key={product.productId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right">{product.revenue.toLocaleString('vi-VN')}đ</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Đang tải đơn hàng...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Bàn</TableHead>
                <TableHead>Chi tiết món ăn</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đặt món lúc</TableHead>
                <TableHead>Thanh toán lúc</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Không tìm thấy đơn hàng
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(-8)}</TableCell>
                    <TableCell>
                      {order.user ? (
                        <div className="space-y-1">
                          <p className="font-medium">{order.user.name || "Khách"}</p>
                          <p className="text-sm text-muted-foreground">{order.user.email}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium text-muted-foreground">Khách hàng</p>
                          <p className="text-sm text-muted-foreground">No account</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.tableNumber ? `Bàn ${order.tableNumber}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {order.orderProducts && order.orderProducts.length > 0 ? (
                        <div className="space-y-1 max-w-md">
                          {order.orderProducts.map((op) => {
                            const itemTotal = (op.product?.price || 0) * op.quantity
                            return (
                              <div key={op.id} className="text-sm border-b last:border-0 pb-1 last:pb-0">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium">{op.quantity}x {op.product?.name || "Không xác định"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(op.product?.price || 0).toLocaleString('vi-VN')}đ × {op.quantity}
                                    </p>
                                  </div>
                                  <p className="text-xs font-medium text-right whitespace-nowrap">
                                    {itemTotal.toLocaleString('vi-VN')}đ
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Không có sản phẩm</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">{order.total.toLocaleString('vi-VN')}đ</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status === 'PENDING' ? 'Chờ xử lý' : order.status === 'PROCESSING' ? 'Đang xử lý' : order.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.updatedAt && order.status === 'COMPLETED' ? (
                        <div className="text-sm">
                          <p>{new Date(order.updatedAt).toLocaleDateString('vi-VN')}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.updatedAt).toLocaleTimeString('vi-VN')}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Chưa thanh toán</span>
                      )}
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
                          <SelectItem value="PENDING">Đang chờ</SelectItem>
                          <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                          <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                          <SelectItem value="CANCELLED">Đã hủy</SelectItem>
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

