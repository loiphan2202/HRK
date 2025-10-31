"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [tableNumber, setTableNumber] = useState<string>("")
  const router = useRouter()

  const handleCheckout = async () => {
    if (items.length === 0) return
    
    // Check if user has checked in with token
    const currentTableStr = localStorage.getItem("currentTable")
    if (!currentTableStr) {
      alert("Please check in using QR code first!")
      return
    }

    let currentTable
    try {
      currentTable = JSON.parse(currentTableStr)
    } catch (e) {
      alert("Invalid table session. Please check in again using QR code.")
      return
    }

    // Validate token
    const token = currentTable.token
    if (!token) {
      alert("Invalid table session. Please check in again using QR code.")
      return
    }

    // Verify token with backend
    const tokenCheckResponse = await fetch("/api/tables/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    if (!tokenCheckResponse.ok) {
      alert("Invalid or expired token. Please check in again using QR code.")
      localStorage.removeItem("currentTable")
      return
    }

    const tableNum = currentTable.tableNumber

    setIsCheckingOut(true)
    try {
      // Get user ID if logged in
      const token = localStorage.getItem("token")
      const userStr = localStorage.getItem("user")
      let userId: string | undefined = undefined
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          userId = user.id
        } catch (e) {
          // Ignore
        }
      }

      // Check table availability first
      const tableCheckResponse = await fetch(`/api/tables?number=${tableNum}`)
      if (tableCheckResponse.ok) {
        const tableData = await tableCheckResponse.json()
        if (tableData.data && tableData.data.status === 'OCCUPIED') {
          // Check if there are pending orders for this table
          const ordersResponse = await fetch(`/api/orders?tableNumber=${tableNum}&status=PENDING`)
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json()
            if (ordersData.data && ordersData.data.length > 0) {
              alert("Table is occupied with pending orders. Please choose another table or wait for payment.")
              setIsCheckingOut(false)
              return
            }
          }
        }
      }

      // Create order via API
      const orderData = {
        ...(userId && { userId }),
        tableNumber: tableNum,
        tableToken: token, // Include token for validation
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
        throw new Error("Failed to create order")
      }

      // Clear cart after successful checkout
      clearCart()
      
      // Clear table session after successful checkout
      localStorage.removeItem("currentTable")
      
      // Redirect to orders page
      router.push("/orders")
    } catch (error) {
      console.error("Checkout failed:", error)
      alert("Failed to complete checkout. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 min-h-[60vh]">
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Add some products to your cart to get started.
          </p>
        </div>
        <Link href="/shop">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Shopping Cart</h1>
        <Link href="/shop">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
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
                        No Image
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
                        ${item.price.toFixed(2)}
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
                          max={item.stock}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
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
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number *</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  placeholder="Enter table number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  min="1"
                  required
                  disabled={isCheckingOut}
                />
                <p className="text-xs text-muted-foreground">
                  Please enter your table number before checkout
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Items ({items.reduce((sum, item) => sum + item.quantity, 0)})
                </span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${getTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

