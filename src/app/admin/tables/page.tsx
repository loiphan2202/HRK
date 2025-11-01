"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, QrCode, CreditCard, Printer, FileDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState("")
  const [creatingQr, setCreatingQr] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedQr, setSelectedQr] = useState<{ image: string; url: string; tableNumber: number } | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
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
    } catch (error) {
      console.error("Failed to create table:", error)
      alert("Failed to create table. Table number may already exist.")
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
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      alert("Failed to generate QR code")
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
    setPaymentDialogOpen(true)
  }

  async function handlePayment() {
    if (!selectedTable || tableOrders.length === 0) return

    setProcessingPayment(true)
    try {
      // Update all orders to COMPLETED
      await Promise.all(
        tableOrders.map(order =>
          fetch(`/api/orders/${order.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "COMPLETED" }),
          })
        )
      )

      // Update table status to AVAILABLE
      await fetch(`/api/tables/${selectedTable.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AVAILABLE" }),
      })

      setPaymentDialogOpen(false)
      setSelectedTable(null)
      setTableOrders([])
      await loadTables()
      alert("Thanh toán thành công!")
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Thanh toán thất bại. Vui lòng thử lại.")
    } finally {
      setProcessingPayment(false)
    }
  }

  function printInvoice() {
    window.print()
  }

  function exportInvoiceToPDF() {
    const invoiceContent = document.getElementById('invoice-content')
    if (!invoiceContent || !selectedTable) return

    // Tính tổng
    const totals = calculateTotal()
    
    // Tạo HTML content cho hóa đơn với đầy đủ thông tin
    const invoiceHTML = `
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
          ${invoiceContent.innerHTML}
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
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Quản lý bàn</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý bàn nhà hàng và tạo mã QR
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số bàn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Mã QR</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                            width={64}
                            height={64}
                            className="object-contain border rounded cursor-pointer hover:opacity-80 transition-opacity"
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
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Chưa tạo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateQrCode(table.id)}
                          disabled={creatingQr === table.id}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          {creatingQr === table.id ? "Đang tạo..." : "Tạo QR"}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {table.status === 'OCCUPIED' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openPaymentDialog(table)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Thanh toán
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                  {tableOrders.map((order) => (
                    <div key={order.id} className="border-b pb-4 last:border-0 space-y-3">
                      {/* Order Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-base">Đơn #{order.id.slice(-8)}</p>
                            <Badge className={order.status === 'PENDING' ? 'bg-yellow-500' : order.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-green-500'}>
                              {order.status === 'PENDING' ? 'Chờ xử lý' : order.status === 'PROCESSING' ? 'Đang xử lý' : 'Hoàn thành'}
                            </Badge>
                          </div>
                          
                          {/* Customer Info */}
                          <div className="text-xs text-muted-foreground space-y-1 mb-2">
                            <p><span className="font-medium">Khách hàng:</span> {order.user ? (order.user.name || order.user.email) : 'Khách hàng'}</p>
                            {order.user?.email && <p><span className="font-medium">Email:</span> {order.user.email}</p>}
                            <p><span className="font-medium">Bàn số:</span> {order.tableNumber ? `Bàn ${order.tableNumber}` : 'N/A'}</p>
                            <p><span className="font-medium">Đặt món lúc:</span> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                            {order.updatedAt && order.status === 'COMPLETED' && (
                              <p><span className="font-medium">Thanh toán lúc:</span> {new Date(order.updatedAt).toLocaleString('vi-VN')}</p>
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
                  ))}
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
                    <Label>VAT (%)</Label>
                    <Input
                      type="number"
                      value={vat}
                      onChange={(e) => setVat(Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
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
    </div>
  )
}

