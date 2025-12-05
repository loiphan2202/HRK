"use client"

import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface Table {
  id: string
  number: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
}

const TABLE_SKELETON_KEYS = Array.from({ length: 10 }, (_, i) => `table-skeleton-${i}`)

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const removeFromCart = useCartStore((state) => state.removeFromCart)
  const getTotal = useCartStore((state) => state.getTotal)
  const clearCart = useCartStore((state) => state.clearCart)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string>("")
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(true)
  const [hasCheckIn, setHasCheckIn] = useState(false)
  const [checkedInTableNumber, setCheckedInTableNumber] = useState<number | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check for existing check-in data on mount
    try {
      const checkInData = localStorage.getItem('currentTable')
      if (checkInData) {
        const parsed = JSON.parse(checkInData)
        setHasCheckIn(true)
        setCheckedInTableNumber(parsed.tableNumber)
      }
    } catch {
      // Ignore
    }
    
    loadAvailableTables()
  }, [])

  useEffect(() => {
    // Tự động chọn bàn đã check-in khi tables được load
    if (availableTables.length > 0 && !selectedTableId && hasCheckIn && checkedInTableNumber) {
      const checkedInTable = availableTables.find(t => t.number === checkedInTableNumber)
      if (checkedInTable) {
        setSelectedTableId(checkedInTable.id)
      }
    }
  }, [availableTables, selectedTableId, hasCheckIn, checkedInTableNumber])

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

  const getCheckInData = (): { tableId?: string; tableNumber?: number; token?: string } | null => {
    try {
      const checkInStorage = localStorage.getItem('currentTable')
      if (checkInStorage) {
        return JSON.parse(checkInStorage)
      }
    } catch {
      // Ignore
    }
    return null
  }

  const getUserId = (): string | undefined => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        return typeof user.id === 'string' ? user.id : String(user.id)
      }
    } catch {
      // Ignore
    }
    return undefined
  }

  const validateTableSelection = (): { valid: boolean; table?: Table } => {
    if (!selectedTableId) {
      toast({
        variant: "destructive",
        title: "Chưa chọn bàn",
        description: "Vui lòng chọn bàn để đặt món!",
      })
      return { valid: false }
    }

    const selectedTable = availableTables.find(t => t.id === selectedTableId)
    if (!selectedTable) {
      toast({
        variant: "destructive",
        title: "Bàn không khả dụng",
        description: "Bàn đã không còn khả dụng. Vui lòng chọn bàn khác.",
      })
      return { valid: false }
    }

    return { valid: true, table: selectedTable }
  }

  const validateTableAvailability = (
    table: Table,
    checkInData: { tableId?: string; tableNumber?: number; token?: string } | null
  ): boolean => {
    const isCheckedInTable = Boolean(checkInData && checkInData.tableNumber === table.number)
    if (!isCheckedInTable && table.status !== 'AVAILABLE') {
      toast({
        variant: "destructive",
        title: "Bàn không khả dụng",
        description: "Bàn đã được sử dụng. Vui lòng chọn bàn khác.",
      })
      return false
    }
    return true
  }

  const createOrderData = (
    userId: string | undefined,
    tableNumber: number,
    isCheckedInTable: boolean,
    checkInData: { tableId?: string; tableNumber?: number; token?: string } | null
  ) => {
    return {
      ...(userId && { userId }),
      tableNumber,
      ...(isCheckedInTable && checkInData?.token && { tableToken: checkInData.token }),
      products: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }
  }

  const parseErrorResponse = async (response: Response): Promise<string> => {
    let errorMessage = "Đặt món thất bại"
    try {
      const text = await response.text()
      if (text) {
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.error?.message || errorData.error || errorMessage
        } catch {
          errorMessage = text
        }
      } else {
        errorMessage = response.statusText || errorMessage
      }
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    return errorMessage
  }

  const handleSuccessfulCheckout = async (
    isCheckedInTable: boolean,
    userId: string | undefined
  ) => {
    clearCart()
    
    if (!isCheckedInTable) {
      setSelectedTableId("")
    }
    
    await loadAvailableTables()
    
    toast({
      title: "Đặt món thành công!",
      description: "Admin sẽ xử lý đơn hàng của bạn.",
    })
    
    if (userId) {
      router.push("/orders")
    } else {
      router.push("/")
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    
    const validation = validateTableSelection()
    if (!validation.valid || !validation.table) return

    const checkInData = getCheckInData()
    const isCheckedInTable = Boolean(checkInData && checkInData.tableNumber === validation.table.number)
    
    if (!validateTableAvailability(validation.table, checkInData)) {
      await loadAvailableTables()
      return
    }

    setIsCheckingOut(true)
    try {
      const userId = getUserId()
      const orderData = createOrderData(
        userId,
        validation.table.number,
        isCheckedInTable,
        checkInData
      )

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorMessage = await parseErrorResponse(response)
        throw new Error(errorMessage)
      }

      await handleSuccessfulCheckout(isCheckedInTable, userId)
    } catch (error) {
      console.error("Checkout failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Đặt món thất bại. Vui lòng thử lại."
      toast({
        variant: "destructive",
        title: "Đặt món thất bại",
        description: errorMessage,
      })
    } finally {
      setIsCheckingOut(false)
    }
  }

  const renderTableSelection = () => {
    if (loadingTables) {
      return (
        <div className="grid grid-cols-5 gap-2">
          {TABLE_SKELETON_KEYS.map((key) => (
            <div key={key} className="aspect-square border-2 border-dashed rounded-lg animate-pulse bg-muted" />
          ))}
        </div>
      )
    }

    if (availableTables.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">Không có bàn nào</p>
      )
    }

    return (
      <>
        {hasCheckIn && checkedInTableNumber && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-500 rounded-md text-center dark:bg-blue-950/50 dark:border-blue-400">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              Bạn đã check-in vào Bàn {checkedInTableNumber} - Không thể thay đổi
            </p>
          </div>
        )}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1.5 max-h-60 overflow-y-auto p-1">
          {availableTables.map((table) => {
            const isAvailable = table.status === 'AVAILABLE'
            const isOccupied = table.status === 'OCCUPIED'
            const isSelected = selectedTableId === table.id
            const isCheckedInTable = hasCheckIn && checkedInTableNumber === table.number
            
            // Nếu đã check-in, disable tất cả các bàn khác; nếu chưa check-in, chỉ cho phép chọn bàn AVAILABLE
            const isClickable = hasCheckIn 
              ? isCheckedInTable // Nếu đã check-in, chỉ có thể click vào bàn đã check-in
              : isAvailable // Nếu chưa check-in, có thể chọn bàn AVAILABLE
            
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => {
                  if (isClickable) {
                    if (isSelected && !isCheckedInTable) {
                      setSelectedTableId("")
                    } else if (!isSelected) {
                      setSelectedTableId(table.id)
                    }
                  }
                }}
                disabled={!isClickable}
                className={`
                  aspect-square border-2 rounded-md transition-all duration-200
                  flex flex-col items-center justify-center font-semibold text-sm
                  ${isSelected && isCheckedInTable
                    ? 'border-blue-500 bg-blue-100 scale-105 shadow-lg ring-2 ring-blue-200 dark:bg-blue-900 dark:border-blue-400' 
                    : isSelected 
                    ? 'border-primary bg-primary/10 scale-105 shadow-lg ring-2 ring-primary/20' 
                    : isCheckedInTable
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400'
                    : isAvailable
                    ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:scale-105 cursor-pointer dark:bg-green-950/50 dark:border-green-400'
                    : isOccupied
                    ? 'border-red-500 bg-red-50 cursor-not-allowed opacity-60 dark:bg-red-950/50 dark:border-red-400'
                    : 'border-yellow-500 bg-yellow-50 cursor-not-allowed opacity-60 dark:bg-yellow-950/50 dark:border-yellow-400'
                  }
                  ${!isClickable && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={
                  isCheckedInTable
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
                  ${isSelected && isCheckedInTable
                    ? 'text-blue-700 dark:text-blue-300'
                    : isSelected 
                    ? 'text-primary' 
                    : isCheckedInTable
                    ? 'text-blue-600 dark:text-blue-400'
                    : isAvailable
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                  }
                `}>
                  {table.number}
                </span>
                {isCheckedInTable && isSelected && (
                  <span className="text-xs mt-1 opacity-75 text-blue-600 dark:text-blue-400">
                    Đã check-in
                  </span>
                )}
                {!isAvailable && !isCheckedInTable && (
                  <span className="md:hidden text-xs mt-1 opacity-75">
                    {isOccupied ? 'Đang dùng' : 'Đã đặt'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
          {hasCheckIn && checkedInTableNumber && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded"></span>
              <span className="hidden sm:inline">Đã check-in</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded"></span>
            <span className="hidden sm:inline">Trống</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded"></span>
            <span className="hidden sm:inline">Đang dùng</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded"></span>
            <span className="hidden sm:inline">Đã đặt</span>
          </span>
        </p>
      </>
    )
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
    <div className="flex flex-col space-y-6 sm:space-y-8 w-full px-4 sm:px-6 lg:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Giỏ hàng</h1>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Tiếp tục mua sắm</span>
            <span className="sm:hidden">Quay lại</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="border-2">
              <CardContent className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-md overflow-hidden border">
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
                    <div className="min-w-0">
                      <Link href={`/${item.productId}`}>
                        <h3 className="font-semibold text-base sm:text-lg hover:text-primary transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-base sm:text-lg font-bold text-primary mt-1">
                        {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 sm:mt-4">
                      <div className="flex items-center gap-1 sm:gap-2 border rounded-md">
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
                            const value = Number.parseInt(e.target.value) || 0
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
          <Card className="lg:sticky lg:top-4 border-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Chọn bàn *
                </Label>
                {renderTableSelection()}
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
                disabled={isCheckingOut || !selectedTableId}
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

