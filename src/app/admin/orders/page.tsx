"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { AdminGuard } from "@/components/auth/admin-guard"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, TrendingUp, FileDown, Printer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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

type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all'

const getOrderStatusName = (status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'): string => {
  if (status === 'PENDING') return 'Chờ xử lý'
  if (status === 'PROCESSING') return 'Đang xử lý'
  if (status === 'COMPLETED') return 'Hoàn thành'
  return 'Đã hủy'
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('month')
  const [exportPeriod, setExportPeriod] = useState<StatsPeriod>('month')
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)


  useEffect(() => {
    loadOrders()
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, statsPeriod])

  async function loadOrders() {
    try {
      setLoading(true)
      const url = statusFilter === "ALL" ? "/api/orders" : `/api/orders?status=${statusFilter}`
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
      const queryString = periodParam ? `?period=${periodParam}` : ''
      const { apiGet } = await import('@/lib/api-client')
      const res = await apiGet(`/api/orders/stats${queryString}`)
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
      // Khi status là COMPLETED hoặc CANCELLED, đảm bảo updatedAt được cập nhật
      const { apiPut } = await import('@/lib/api-client')
      const res = await apiPut(`/api/orders/${orderId}`, { 
        status,
        // Force update updatedAt khi thanh toán hoặc hủy
        ...((status === 'COMPLETED' || status === 'CANCELLED') && { 
          updatedAt: new Date().toISOString() 
        })
      })

      if (!res.ok) {
        // Parse error message from API response
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData?.error?.message || "Không thể cập nhật trạng thái đơn hàng."
        
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: errorMessage,
        })
        return
      }

      await loadOrders()
      await loadStats()
      
      // Reload selected order nếu đang mở
      if (selectedOrder && selectedOrder.id === orderId) {
        const { apiGet } = await import('@/lib/api-client')
        const updatedRes = await apiGet(`/api/orders/${orderId}`)
        const updatedData = await updatedRes.json()
        if (updatedData.success) {
          setSelectedOrder(updatedData.data)
        }
      }
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái đơn hàng.",
      })
    } catch (error) {
      console.error("Failed to update order:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.",
      })
    }
  }

  function openOrderDetail(order: Order) {
    console.log('Opening order detail for:', order.id)
    setSelectedOrder(order)
    setOrderDialogOpen(true)
    console.log('Dialog should open, orderDialogOpen:', orderDialogOpen)
  }

  function generateOrderInvoiceHTML(order: Order) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn - Đơn #${order.id.slice(-8)}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
            .info { margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <p>Mã đơn: #${order.id.slice(-8)}</p>
            <p>Ngày in: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          
          <div class="info">
            <p><strong>Khách hàng:</strong> ${order.user ? (order.user.name || order.user.email) : 'Khách hàng'}</p>
            ${order.user?.email ? `<p><strong>Email:</strong> ${order.user.email}</p>` : ''}
            <p><strong>Bàn số:</strong> ${order.tableNumber ? `Bàn ${order.tableNumber}` : 'N/A'}</p>
            <p><strong>Trạng thái:</strong> ${getOrderStatusName(order.status)}</p>
            <p><strong>Đặt món lúc:</strong> ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
            ${order.updatedAt ? `<p><strong>Thanh toán lúc:</strong> ${new Date(order.updatedAt).toLocaleString('vi-VN')}</p>` : '<p><strong>Thanh toán lúc:</strong> Chưa thanh toán</p>'}
          </div>

          <table>
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Tên món</th>
                <th style="padding: 10px; text-align: center;">SL</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderProducts && order.orderProducts.length > 0 ? order.orderProducts.map((op: OrderProduct) => {
                const itemTotal = (op.product?.price || 0) * op.quantity
                return `
                  <tr>
                    <td style="padding: 8px;">${op.product?.name || "Không xác định"}</td>
                    <td style="padding: 8px; text-align: center;">${op.quantity}</td>
                    <td style="padding: 8px; text-align: right;">${(op.product?.price || 0).toLocaleString('vi-VN')}đ</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${itemTotal.toLocaleString('vi-VN')}đ</td>
                  </tr>
                `
              }).join('') : '<tr><td colspan="4" style="padding: 8px; text-align: center;">Không có món nào</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #000;">TỔNG CỘNG:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #000;">${order.total.toLocaleString('vi-VN')}đ</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `
  }

  function openInvoiceWindow(order: Order, onLoad?: () => void) {
    const invoiceHTML = generateOrderInvoiceHTML(order)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      // eslint-disable-next-line deprecation/deprecation
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        onLoad?.()
      }
    }
  }

  function printOrderInvoice(order: Order) {
    openInvoiceWindow(order)
  }

  function exportOrderToPDF(order: Order) {
    openInvoiceWindow(order, () => {
      // Sau khi in, có thể download PDF bằng cách save từ browser
    })
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
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      }
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
      toast({
        variant: "destructive",
        title: "Không có dữ liệu",
        description: `Không có đơn hàng nào trong khoảng thời gian đã chọn (${exportPeriod}).`,
      })
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
        getOrderStatusName(order.status),
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
    const periodSuffix = exportPeriod === 'all' ? '' : `_${exportPeriod}`
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders${periodSuffix}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    link.remove()
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

  return (
    <AdminGuard>
      <div className="flex flex-col space-y-6 sm:space-y-8 w-full px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Quản lý đơn hàng</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Xem và quản lý tất cả đơn hàng của nhà hàng
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
          <Select value={exportPeriod} onValueChange={(value: StatsPeriod) => setExportPeriod(value)}>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-lg sm:text-xl">Top 10 sản phẩm bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[50px]">STT</TableHead>
                      <TableHead className="min-w-[200px]">Tên sản phẩm</TableHead>
                      <TableHead className="text-right min-w-[120px]">Số lượng bán</TableHead>
                      <TableHead className="text-right min-w-[150px]">Doanh thu</TableHead>
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
              </div>
            </div>
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
          <div className="overflow-auto max-h-[calc(100vh-520px)] -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[100px]">Mã đơn</TableHead>
                    <TableHead className="min-w-[150px]">Khách hàng</TableHead>
                    <TableHead className="min-w-[80px]">Bàn</TableHead>
                    <TableHead className="min-w-[200px]">Chi tiết món ăn</TableHead>
                    <TableHead className="min-w-[100px]">Tổng tiền</TableHead>
                    <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Đặt món lúc</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Thanh toán lúc</TableHead>
                    <TableHead className="min-w-[140px]">Hành động</TableHead>
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
                    <TableCell>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openOrderDetail(order)
                        }}
                        className="font-medium text-primary hover:underline cursor-pointer"
                      >
                        {order.id.slice(-8)}
                      </button>
                    </TableCell>
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
                        {getOrderStatusName(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <p>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
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
                )
              ))}
            </TableBody>
          </Table>
          </div>
          </div>
        </Card>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id.slice(-8)}</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn hàng này
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Khách hàng</p>
                  <p className="font-semibold">
                    {selectedOrder.user ? (selectedOrder.user.name || selectedOrder.user.email) : 'Khách hàng'}
                  </p>
                  {selectedOrder.user?.email && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.user.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Bàn số</p>
                  <p className="font-semibold">
                    {selectedOrder.tableNumber ? `Bàn ${selectedOrder.tableNumber}` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getOrderStatusName(selectedOrder.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tổng tiền</p>
                  <p className="font-semibold text-lg text-primary">
                    {selectedOrder.total.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Đặt món lúc</p>
                  <p className="font-semibold">
                    {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Thanh toán lúc</p>
                  <p className="font-semibold">
                    {selectedOrder.updatedAt 
                      ? new Date(selectedOrder.updatedAt).toLocaleString('vi-VN')
                      : 'Chưa thanh toán'}
                  </p>
                </div>
              </div>

              {/* Order Products */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Chi tiết món ăn</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên món</TableHead>
                      <TableHead className="text-center">Số lượng</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.orderProducts && selectedOrder.orderProducts.length > 0 ? (
                      selectedOrder.orderProducts.map((op: OrderProduct) => {
                        const itemTotal = (op.product?.price || 0) * op.quantity
                        return (
                          <TableRow key={op.id}>
                            <TableCell className="font-medium">
                              {op.product?.name || 'Không xác định'}
                            </TableCell>
                            <TableCell className="text-center">{op.quantity}</TableCell>
                            <TableCell className="text-right">
                              {(op.product?.price || 0).toLocaleString('vi-VN')}đ
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {itemTotal.toLocaleString('vi-VN')}đ
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Không có sản phẩm
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold text-lg">
                        TỔNG CỘNG:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg text-primary">
                        {selectedOrder.total.toLocaleString('vi-VN')}đ
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Update Status */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-4">
                  <Label>Cập nhật trạng thái:</Label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Đang chờ</SelectItem>
                      <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2 w-full justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => selectedOrder && printOrderInvoice(selectedOrder)}>
                  <Printer className="mr-2 h-4 w-4" />
                  In hóa đơn
                </Button>
                <Button variant="outline" onClick={() => selectedOrder && exportOrderToPDF(selectedOrder)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Xuất PDF
                </Button>
              </div>
              <Button onClick={() => setOrderDialogOpen(false)}>Đóng</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminGuard>
  )
}

