"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, QrCode, CreditCard, Printer, FileDown, Edit2, Trash2, MoreHorizontal } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Copy } from "lucide-react"

interface TableData {
  id: string
  number: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  qrCode: string | null
  token: string | null
}

export default function AdminTablesPage() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState("")
  const [creatingQr, setCreatingQr] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedQr, setSelectedQr] = useState<{ image: string; url: string; tableNumber: number } | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [editDialog, setEditDialog] = useState<{ open: boolean; table: TableData | null }>({ open: false, table: null })
  const [editTableNumber, setEditTableNumber] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; table: TableData | null }>({ open: false, table: null })
  const [tableOrders, setTableOrders] = useState<Array<{
    id: string
    total: number
    status: string
    createdAt: string
    updatedAt?: string | null
    user?: {
      id: string
      name: string | null
      email: string
    } | null
    tableNumber: number | null
    orderProducts?: Array<{
      id: string
      quantity: number
      product?: {
        id: string
        name: string
        price: number
        description: string | null
        image: string | null
      } | null
    }> | null
  }>>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const [vat, setVat] = useState(10) // VAT %
  const [discount, setDiscount] = useState(0) // Discount amount
  const [processingPayment, setProcessingPayment] = useState(false)
  const [orderStatuses, setOrderStatuses] = useState<Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'>>({})
  const [defaultOrderStatus, setDefaultOrderStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'>('COMPLETED')

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
    try {
      setLoading(true)
      const res = await fetch("/api/tables")
      const data = await res.json()
      setTables(data.data || [])
    } catch (error) {
      console.error("Failed to load tables:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createTable() {
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: parseInt(tableNumber) }),
      })

      if (!res.ok) throw new Error("Failed to create table")

      setTableNumber("")
      setDialogOpen(false)
      await loadTables()
      toast({
        title: "Thành công",
        description: "Đã tạo bàn mới thành công.",
      })
    } catch (error) {
      console.error("Failed to create table:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo bàn. Số bàn có thể đã tồn tại.",
      })
    }
  }

  async function updateTable(id: string, number: number) {
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      })

      if (!res.ok) throw new Error("Failed to update table")

      setEditDialog({ open: false, table: null })
      setEditTableNumber("")
      await loadTables()
      toast({
        title: "Thành công",
        description: "Đã cập nhật bàn thành công.",
      })
    } catch (error) {
      console.error("Failed to update table:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật bàn. Số bàn có thể đã tồn tại.",
      })
    }
  }

  async function deleteTable(id: string) {
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete table")

      setDeleteDialog({ open: false, table: null })
      await loadTables()
      toast({
        title: "Thành công",
        description: "Đã xóa bàn thành công.",
      })
    } catch (error) {
      console.error("Failed to delete table:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa bàn.",
      })
    }
  }

  async function generateQrCode(tableId: string) {
    try {
      setCreatingQr(tableId)
      const res = await fetch(`/api/tables/${tableId}/qr`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to generate QR code")

      await res.json()
      await loadTables()
      toast({
        title: "Thành công",
        description: "Đã tạo mã QR thành công.",
      })
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo mã QR.",
      })
    } finally {
      setCreatingQr(null)
    }
  }

  async function loadTableOrders(tableNumber: number) {
    try {
      setLoadingOrders(true)
      // Load cả PENDING và PROCESSING orders để thanh toán
      const [pendingRes, processingRes] = await Promise.all([
        fetch(`/api/orders?tableNumber=${tableNumber}&status=PENDING`),
        fetch(`/api/orders?tableNumber=${tableNumber}&status=PROCESSING`)
      ])
      
      const pendingData = await pendingRes.json()
      const processingData = await processingRes.json()
      
      const allOrders = [
        ...(pendingData.success ? (pendingData.data || []) : []),
        ...(processingData.success ? (processingData.data || []) : [])
      ]
      
      setTableOrders(allOrders)
    } catch (error) {
      console.error("Failed to load table orders:", error)
      setTableOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  async function openPaymentDialog(table: TableData) {
    setSelectedTable(table)
    await loadTableOrders(table.number)
    // Initialize order statuses với default status hoặc giữ nguyên status hiện tại
    const initialStatuses: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'> = {}
    setOrderStatuses(initialStatuses)
    setPaymentDialogOpen(true)
  }

  async function handlePayment() {
    if (!selectedTable || tableOrders.length === 0) return

    setProcessingPayment(true)
    try {
      // Update orders với status được chọn (hoặc default status nếu không có)
      await Promise.all(
        tableOrders.map(order => {
          const statusToSet = orderStatuses[order.id] || defaultOrderStatus
          return fetch(`/api/orders/${order.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: statusToSet }),
          })
        })
      )

      // Chỉ update table status to AVAILABLE nếu tất cả orders đều COMPLETED hoặc CANCELLED
      const allCompletedOrCancelled = tableOrders.every(order => {
        const status = orderStatuses[order.id] || defaultOrderStatus
        return status === 'COMPLETED' || status === 'CANCELLED'
      })

      // Chỉ update table to AVAILABLE nếu tất cả orders đã hoàn thành hoặc hủy
      if (allCompletedOrCancelled) {
        await fetch(`/api/tables/${selectedTable.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "AVAILABLE" }),
        })
      }

      // Lưu statusCounts và statusText trước khi clear state
      const statusCounts = tableOrders.reduce((acc, order) => {
        const status = orderStatuses[order.id] || defaultOrderStatus
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const statusText = Object.entries(statusCounts)
        .map(([status, count]) => {
          const statusName = status === 'PENDING' ? 'Chờ xử lý' : 
                           status === 'PROCESSING' ? 'Đang xử lý' : 
                           status === 'COMPLETED' ? 'Hoàn thành' : 
                           'Đã hủy'
          return `${statusName} (${count})`
        })
        .join(', ')

      setPaymentDialogOpen(false)
      setSelectedTable(null)
      setTableOrders([])
      setOrderStatuses({})
      await loadTables()
      
      toast({
        title: "Cập nhật thành công!",
        description: `Đã cập nhật trạng thái đơn hàng: ${statusText}.`,
      })
    } catch (error) {
      console.error("Payment failed:", error)
      toast({
        variant: "destructive",
        title: "Thanh toán thất bại",
        description: "Vui lòng thử lại.",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  function printInvoice() {
    // Tạo window mới với HTML đầy đủ chi tiết món ăn
    const totals = calculateTotal()
    const invoiceHTML = generateInvoiceHTML(totals)
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  function generateInvoiceHTML(totals: { subtotal: number; vatAmount: number; total: number }) {
    if (!selectedTable) return ''
    
    // Tạo HTML cho chi tiết món ăn từ các orders
    const orderDetailsHTML = tableOrders.map((order) => {
      const orderItemsHTML = order.orderProducts && order.orderProducts.length > 0
        ? order.orderProducts.map((op: { id: string; quantity: number; product?: { id: string; name: string; price: number; description: string | null; image: string | null } | null }) => {
            const itemTotal = (op.product?.price || 0) * op.quantity
            return `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${op.product?.name || "Không xác định"}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${op.quantity}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(op.product?.price || 0).toLocaleString('vi-VN')}đ</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${itemTotal.toLocaleString('vi-VN')}đ</td>
              </tr>
            `
          }).join('')
        : '<tr><td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align: center;">Không có món nào</td></tr>'

      return `
        <div class="order-section">
          <h3 style="margin: 15px 0 10px 0; font-size: 16px; font-weight: bold;">Đơn #${order.id.slice(-8)}</h3>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">
            Khách hàng: ${order.user ? (order.user.name || order.user.email) : 'Khách hàng'} | 
            Đặt món: ${new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Tên món</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">SL</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Đơn giá</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Tổng đơn:</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${order.total.toLocaleString('vi-VN')}đ</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
    }).join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn - Bàn ${selectedTable.number}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
            .order-section { margin-bottom: 30px; page-break-inside: avoid; }
            .customer-info { margin: 15px 0; }
            .summary { border-top: 2px solid #000; padding-top: 15px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <p>Bàn số ${selectedTable.number}</p>
            <p>Ngày in: ${new Date().toLocaleString('vi-VN')}</p>
            ${tableOrders.length > 0 && tableOrders[0]?.user ? `
              <div class="customer-info">
                <p><strong>Khách hàng:</strong> ${tableOrders[0].user.name || tableOrders[0].user.email}</p>
                ${tableOrders[0].user.email ? `<p><strong>Email:</strong> ${tableOrders[0].user.email}</p>` : ''}
              </div>
            ` : '<p><strong>Khách hàng:</strong> Khách hàng</p>'}
          </div>
          <div class="order-details">
            ${orderDetailsHTML}
          </div>
          <div class="summary">
            <table>
              <tr>
                <td style="text-align: right; font-weight: bold; border: none;">Tạm tính:</td>
                <td style="text-align: right; border: none;">${totals.subtotal.toLocaleString('vi-VN')}đ</td>
              </tr>
              <tr>
                <td style="text-align: right; font-weight: bold; border: none;">VAT (${vat}%):</td>
                <td style="text-align: right; border: none;">${totals.vatAmount.toLocaleString('vi-VN')}đ</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td style="text-align: right; font-weight: bold; border: none;">Giảm giá:</td>
                <td style="text-align: right; border: none; color: red;">-${discount.toLocaleString('vi-VN')}đ</td>
              </tr>
              ` : ''}
              <tr>
                <td style="text-align: right; font-weight: bold; font-size: 18px; border: none; border-top: 2px solid #000; padding-top: 10px;">TỔNG CỘNG:</td>
                <td style="text-align: right; font-weight: bold; font-size: 18px; border: none; border-top: 2px solid #000; padding-top: 10px;">${totals.total.toLocaleString('vi-VN')}đ</td>
              </tr>
              <tr>
                <td style="text-align: right; border: none;">Phương thức thanh toán:</td>
                <td style="text-align: right; border: none;">${paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `
  }

  function exportInvoiceToPDF() {
    if (!selectedTable) return

    // Tính tổng
    const totals = calculateTotal()
    
    // Tạo HTML content cho hóa đơn với đầy đủ thông tin
    const invoiceHTML = generateInvoiceHTML(totals)
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
        // Sau khi in, có thể download PDF bằng cách save từ browser
      }
    }
  }

  const calculateTotal = () => {
    const subtotal = tableOrders.reduce((sum, order) => sum + order.total, 0)
    const vatAmount = (subtotal * vat) / 100
    const total = subtotal + vatAmount - discount
    return { subtotal, vatAmount, total }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-500"
      case "OCCUPIED": return "bg-red-500"
      case "RESERVED": return "bg-yellow-500"
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
    <div className="flex flex-col space-y-6 sm:space-y-8 w-full px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Quản lý bàn</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Quản lý bàn nhà hàng và tạo mã QR
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Thêm bàn
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm bàn mới</DialogTitle>
              <DialogDescription>
                Tạo bàn mới cho nhà hàng
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Số bàn</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  placeholder="Nhập số bàn"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={createTable} disabled={!tableNumber}>
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Đang tải bàn...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[100px]">Số bàn</TableHead>
                    <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                    <TableHead className="min-w-[100px]">Mã QR</TableHead>
                    <TableHead className="min-w-[100px] text-center">QR Code</TableHead>
                    <TableHead className="min-w-[100px] text-center">Chi tiết</TableHead>
                    <TableHead className="min-w-[80px] text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Không tìm thấy bàn
                      </TableCell>
                    </TableRow>
                  ) : (
                    tables.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell className="font-medium">Bàn {table.number}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(table.status)}>
                            {table.status === 'AVAILABLE' ? 'Trống' : 
                             table.status === 'OCCUPIED' ? 'Đang dùng' : 
                             'Đã đặt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {table.qrCode ? (
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={table.qrCode}
                                alt={`QR Code for Table ${table.number}`}
                                width={48}
                                height={48}
                                className="object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity hidden sm:block"
                                onClick={() => {
                                  if (table.token && table.qrCode) {
                                    // Construct URL from current origin
                                    const url = `${window.location.origin}/check-in?token=${table.token}`;
                                    setSelectedQr({
                                      image: table.qrCode,
                                      url: url,
                                      tableNumber: table.number,
                                    });
                                    setQrDialogOpen(true);
                                  }
                                }}
                              />
                              <span className="text-xs sm:hidden">✓</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Chưa tạo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateQrCode(table.id)}
                            disabled={creatingQr === table.id}
                            className="text-xs whitespace-nowrap"
                          >
                            <QrCode className="mr-1 h-3 w-3" />
                            {creatingQr === table.id ? "..." : "QR"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          {table.status === 'OCCUPIED' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openPaymentDialog(table)}
                              className="text-xs whitespace-nowrap"
                            >
                              <CreditCard className="mr-1 h-3 w-3" />
                              Chi tiết
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditDialog({ open: true, table })
                                  setEditTableNumber(table.number.toString())
                                }}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, table })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      )}

      {/* QR Code Popup Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - Table {selectedQr?.tableNumber}</DialogTitle>
            <DialogDescription>
              Scan this QR code or use the URL below to check in
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedQr && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedQr.image}
                  alt={`QR Code for Table ${selectedQr.tableNumber}`}
                  width={256}
                  height={256}
                  className="object-contain border rounded"
                />
                <div className="w-full space-y-2">
                  <Label>URL check-in</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={selectedQr.url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedQr.url);
                        // You could add a toast notification here
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setQrDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thanh toán - Bàn {selectedTable?.number}</DialogTitle>
            <DialogDescription>
              Xem đơn hàng và thực hiện thanh toán cho bàn này
            </DialogDescription>
          </DialogHeader>
          
          {loadingOrders ? (
            <div className="py-8 text-center text-muted-foreground">
              Đang tải đơn hàng...
            </div>
          ) : tableOrders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Không có đơn hàng nào cho bàn này
            </div>
          ) : (
            <div id="invoice-content" className="space-y-4">
              {/* Invoice Header - chỉ hiển thị khi in */}
              <div className="hidden mb-4 text-center border-b pb-4" data-print="show" style={{ display: 'none' }}>
                <h1 className="text-2xl font-bold">HÓA ĐƠN THANH TOÁN</h1>
                <p className="text-sm text-muted-foreground">Bàn số {selectedTable?.number}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ngày: {new Date().toLocaleDateString('vi-VN')} - {new Date().toLocaleTimeString('vi-VN')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center" data-print="hide">
                  <h3 className="font-semibold">Danh sách đơn hàng:</h3>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto border rounded-md p-4" style={{ maxHeight: 'auto' }}>
                  {tableOrders.map((order) => {
                    const currentStatus = orderStatuses[order.id] || order.status
                    return (
                    <div key={order.id} className="border-b pb-4 last:border-0 space-y-3">
                      {/* Order Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-base">Đơn #{order.id.slice(-8)}</p>
                            <Badge className={
                              currentStatus === 'PENDING' ? 'bg-yellow-500' : 
                              currentStatus === 'PROCESSING' ? 'bg-blue-500' : 
                              currentStatus === 'COMPLETED' ? 'bg-green-500' : 
                              'bg-red-500'
                            }>
                              {currentStatus === 'PENDING' ? 'Chờ xử lý' : 
                               currentStatus === 'PROCESSING' ? 'Đang xử lý' : 
                               currentStatus === 'COMPLETED' ? 'Hoàn thành' : 
                               'Đã hủy'}
                            </Badge>
                            {currentStatus !== order.status && (
                              <Badge variant="outline" className="text-xs">
                                Trước: {order.status === 'PENDING' ? 'Chờ xử lý' : 
                                        order.status === 'PROCESSING' ? 'Đang xử lý' : 
                                        order.status === 'COMPLETED' ? 'Hoàn thành' : 
                                        'Đã hủy'}
                              </Badge>
                            )}
                          </div>
                          {/* Status Selector */}
                          <div className="mt-2 flex items-center gap-2">
                            <Label className="text-xs">Trạng thái:</Label>
                            <Select 
                              value={orderStatuses[order.id] || defaultOrderStatus} 
                              onValueChange={(value: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => {
                                setOrderStatuses(prev => ({ ...prev, [order.id]: value }))
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                                <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Customer Info */}
                          <div className="text-xs text-muted-foreground space-y-1 mb-2">
                            <p><span className="font-medium">Khách hàng:</span> {order.user ? (order.user.name || order.user.email) : 'Khách hàng'}</p>
                            {order.user?.email && <p><span className="font-medium">Email:</span> {order.user.email}</p>}
                            <p><span className="font-medium">Bàn số:</span> {order.tableNumber ? `Bàn ${order.tableNumber}` : 'N/A'}</p>
                            <p><span className="font-medium">Đặt món lúc:</span> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                            {order.updatedAt && (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') && (
                              <p><span className="font-medium">
                                {currentStatus === 'COMPLETED' ? 'Thanh toán lúc:' : 'Hủy lúc:'}
                              </span> {new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{order.total.toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>

                      {/* Order Products */}
                      {order.orderProducts && order.orderProducts.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-semibold text-sm mb-2">Chi tiết món ăn:</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Tên món</th>
                                  <th className="text-center p-2">SL</th>
                                  <th className="text-right p-2">Đơn giá</th>
                                  <th className="text-right p-2">Thành tiền</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.orderProducts.map((op: { id: string; quantity: number; product?: { id: string; name: string; price: number; description: string | null; image: string | null } | null }) => {
                                  const itemTotal = (op.product?.price || 0) * op.quantity
                                  return (
                                    <tr key={op.id} className="border-b last:border-0">
                                      <td className="p-2">
                                        <div>
                                          <p className="font-medium">{op.product?.name || "Không xác định"}</p>
                                          {op.product?.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">{op.product.description}</p>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-2 text-center">{op.quantity}</td>
                                      <td className="p-2 text-right">{(op.product?.price || 0).toLocaleString('vi-VN')}đ</td>
                                      <td className="p-2 text-right font-medium">{itemTotal.toLocaleString('vi-VN')}đ</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="flex justify-end pt-2 border-t">
                            <div className="text-sm">
                              <p><span className="font-medium">Tổng tiền đơn:</span> <span className="font-bold text-primary">{order.total.toLocaleString('vi-VN')}đ</span></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phương thức thanh toán</Label>
                    <Select value={paymentMethod} onValueChange={(value: 'cash' | 'bank_transfer') => setPaymentMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Tiền mặt</SelectItem>
                        <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trạng thái mặc định</Label>
                    <Select 
                      value={defaultOrderStatus} 
                      onValueChange={(value: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => {
                        setDefaultOrderStatus(value)
                        // Áp dụng cho tất cả orders chưa có status riêng
                        const newStatuses: Record<string, 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'> = {}
                        tableOrders.forEach(order => {
                          if (!orderStatuses[order.id]) {
                            newStatuses[order.id] = value
                          }
                        })
                        setOrderStatuses(prev => ({ ...prev, ...newStatuses }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                        <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                        <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Áp dụng cho tất cả đơn hàng chưa có trạng thái riêng
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>VAT (%)</Label>
                    <Input
                      type="number"
                      value={vat}
                      onChange={(e) => setVat(Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giảm giá (đ)</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính:</span>
                    <span>{calculateTotal().subtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT ({vat}%):</span>
                    <span>{calculateTotal().vatAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Giảm giá:</span>
                      <span>-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{calculateTotal().total.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Phương thức: {paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter data-print="hide">
            <div className="flex gap-2 w-full justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={printInvoice} disabled={tableOrders.length === 0}>
                  <Printer className="mr-2 h-4 w-4" />
                  In hóa đơn
                </Button>
                <Button variant="outline" onClick={exportInvoiceToPDF} disabled={tableOrders.length === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Xuất PDF
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={processingPayment || tableOrders.length === 0}
                >
                  {processingPayment ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, table: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bàn</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin bàn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTableNumber">Số bàn</Label>
              <Input
                id="editTableNumber"
                type="number"
                placeholder="Nhập số bàn"
                value={editTableNumber}
                onChange={(e) => setEditTableNumber(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialog({ open: false, table: null })
                setEditTableNumber("")
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (editDialog.table) {
                  updateTable(editDialog.table.id, parseInt(editTableNumber))
                }
              }}
              disabled={!editTableNumber}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, table: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bàn sẽ bị xóa vĩnh viễn.
              {deleteDialog.table && deleteDialog.table.qrCode && " Mã QR của bàn này cũng sẽ bị xóa."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-red-50 hover:bg-red-700"
              onClick={() => {
                if (deleteDialog.table) {
                  deleteTable(deleteDialog.table.id)
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

