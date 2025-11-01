"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Table {
  id: string
  number: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadAvailableTables()
  }, [])

  async function loadAvailableTables() {
    try {
      setLoadingTables(true)
      const res = await fetch("/api/tables")
      const data = await res.json()
      if (data.success) {
        // Lấy tất cả bàn, không chỉ bàn trống
        setAvailableTables(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load tables:", error)
    } finally {
      setLoadingTables(false)
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    
    if (!selectedTableId) {
      alert("Vui lòng chọn bàn để đặt món!")
      return
    }

    const selectedTable = availableTables.find(t => t.id === selectedTableId)
    if (!selectedTable) {
      alert("Bàn đã không còn khả dụng. Vui lòng chọn bàn khác.")
      await loadAvailableTables()
      return
    }

    // Kiểm tra bàn có đang trống không
    if (selectedTable.status !== 'AVAILABLE') {
      alert("Bàn đã được sử dụng. Vui lòng chọn bàn khác.")
      await loadAvailableTables()
      return
    }

    // Kiểm tra bàn có đang check-in không
    const hasCheckIn = localStorage.getItem('currentTable')
    let checkInTableNumber: number | null = null
    try {
      if (hasCheckIn) {
        const checkInData = JSON.parse(hasCheckIn)
        checkInTableNumber = checkInData.tableNumber
      }
    } catch {
      // Ignore
    }
    if (checkInTableNumber === selectedTable.number) {
      alert("Bàn này đã được check-in. Vui lòng chọn bàn khác.")
      return
    }

    const tableNum = selectedTable.number

    setIsCheckingOut(true)
    try {
      // Get user ID if logged in
      const userStr = localStorage.getItem("user")
      let userId: string | undefined = undefined
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          userId = user.id
        } catch {
          // Ignore
        }
      }

      // Create order via API (không cần token cho khách hàng chọn bàn trống)
      const orderData = {
        ...(userId && { userId }),
        tableNumber: tableNum,
        products: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        let errorMessage = "Đặt món thất bại"
        try {
          const text = await response.text()
          if (text) {
            try {
              const errorData = JSON.parse(text)
              errorMessage = errorData.error?.message || errorData.error || errorMessage
            } catch {
              errorMessage = text || response.statusText || errorMessage
            }
          } else {
            errorMessage = response.statusText || errorMessage
          }
        } catch {
          // If response is not readable, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Clear cart after successful order placement
      clearCart()
      
      // Reload available tables
      await loadAvailableTables()
      setSelectedTableId("")
      
      alert("Đặt món thành công! Admin sẽ xử lý đơn hàng của bạn.")
      
      // Redirect to home if not logged in, otherwise to orders
      if (userId) {
        router.push("/orders")
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Checkout failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Đặt món thất bại. Vui lòng thử lại."
      alert(errorMessage)
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[60vh]">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Giỏ hàng của bạn trống</h2>
          <p className="text-muted-foreground">
            Thêm một số sản phẩm vào giỏ hàng để bắt đầu.
          </p>
        </div>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Giỏ hàng</h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="border-2">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                        Không có hình ảnh
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <Link href={`/shop/${item.productId}`}>
                        <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-primary mt-1">
                        {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            updateQuantity(item.productId, value)
                          }}
                          className="w-16 text-center border-0 h-8"
                          min="1"
                          max={item.stock !== null && item.stock !== -1 ? item.stock : undefined}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.stock !== null && item.stock !== -1 && item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4 border-2">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn bàn *</Label>
                {loadingTables ? (
                  <div className="grid grid-cols-5 gap-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="aspect-square border-2 border-dashed rounded-lg animate-pulse bg-muted" />
                    ))}
                  </div>
                ) : availableTables.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Không có bàn nào</p>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5 max-h-60 overflow-y-auto p-1">
                    {availableTables.map((table) => {
                      const isAvailable = table.status === 'AVAILABLE'
                      const isOccupied = table.status === 'OCCUPIED'
                      const isSelected = selectedTableId === table.id
                      
                      // Kiểm tra xem bàn này có đang được check-in không
                      let isCheckedIn = false
                      try {
                        const checkInData = localStorage.getItem('currentTable')
                        if (checkInData) {
                          const parsed = JSON.parse(checkInData)
                          if (parsed.tableNumber === table.number) {
                            isCheckedIn = true
                          }
                        }
                      } catch {
                        // Ignore
                      }
                      
                      // Chỉ cho phép chọn bàn trống và chưa check-in
                      const canSelect = isAvailable && !isCheckedIn
                      
                      return (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => {
                            if (canSelect) {
                              // Nếu click vào bàn đã chọn, hủy chọn
                              if (isSelected) {
                                setSelectedTableId("")
                              } else {
                                setSelectedTableId(table.id)
                              }
                            }
                          }}
                          disabled={!canSelect}
                          className={`
                            aspect-square border-2 rounded-md transition-all duration-200
                            flex flex-col items-center justify-center font-semibold text-sm
                            ${isSelected 
                              ? 'border-primary bg-primary/10 scale-105 shadow-lg ring-2 ring-primary/20' 
                              : canSelect
                              ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:scale-105 cursor-pointer dark:bg-green-950/50 dark:border-green-400'
                              : isCheckedIn
                              ? 'border-blue-500 bg-blue-50 cursor-not-allowed opacity-60 dark:bg-blue-950/50 dark:border-blue-400'
                              : isOccupied
                              ? 'border-red-500 bg-red-50 cursor-not-allowed opacity-60 dark:bg-red-950/50 dark:border-red-400'
                              : 'border-yellow-500 bg-yellow-50 cursor-not-allowed opacity-60 dark:bg-yellow-950/50 dark:border-yellow-400'
                            }
                          `}
                          title={
                            isCheckedIn
                              ? `Bàn ${table.number} - Đã check-in`
                              : isAvailable 
                              ? `Bàn ${table.number} - Trống` 
                              : isOccupied 
                              ? `Bàn ${table.number} - Đang sử dụng` 
                              : `Bàn ${table.number} - Đã đặt trước`
                          }
                        >
                          <span className={`
                            text-base font-bold
                            ${isSelected 
                              ? 'text-primary' 
                              : canSelect 
                              ? 'text-green-700 dark:text-green-300' 
                              : isCheckedIn
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-red-700 dark:text-red-300'
                            }
                          `}>
                            {table.number}
                          </span>
                          {!canSelect && (
                            <span className="text-xs mt-1 opacity-75">
                              {isCheckedIn ? 'Đã check-in' : isOccupied ? 'Đang dùng' : 'Đã đặt'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded"></span>
                    Trống
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded"></span>
                    Đã check-in
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded"></span>
                    Đang dùng
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded"></span>
                    Đã đặt
                  </span>
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Sản phẩm ({items.reduce((sum, item) => sum + item.quantity, 0)})
                </span>
                <span>{getTotal().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{getTotal().toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut || !selectedTableId || !availableTables.find(t => t.id === selectedTableId && t.status === 'AVAILABLE')}
              >
                {isCheckingOut ? "Đang xử lý..." : "Đặt món"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                Xóa giỏ hàng
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

