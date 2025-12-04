"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { useAuthStore } from "@/store/auth-store"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface ProductCardProps {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  stock: number | null
  categories?: Array<{
    category: {
      id: string
      name: string
    }
  }>
}

const getStockStatus = (stock: number | null): string => {
  if (stock !== null && stock !== -1) {
    return stock > 0 ? `Còn ${stock} sản phẩm` : "Hết hàng"
  }
  if (stock === -1) {
    return "Không giới hạn"
  }
  return "Không theo dõi"
}

const isOutOfStock = (stock: number | null): boolean => {
  return stock !== null && stock !== -1 && stock === 0
}

const getButtonText = (isAdding: boolean, outOfStock: boolean, isMobile: boolean): string => {
  if (isAdding) {
    return isMobile ? "Đã thêm!" : "Đã thêm! ✓"
  }
  if (outOfStock) {
    return isMobile ? "Hết" : "Hết hàng"
  }
  return isMobile ? "Thêm" : "Thêm vào giỏ"
}

export function ProductCard({ id, name, description, price, image, stock, categories }: Readonly<ProductCardProps>) {
  const addToCart = useCartStore((state) => state.addToCart)
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const [isAdding, setIsAdding] = useState(false)
  const { toast } = useToast()

  const checkTableSelection = (): boolean => {
    const hasCheckIn = localStorage.getItem('currentTable')
    if (!hasCheckIn) {
      toast({
        variant: "destructive",
        title: "Chưa chọn bàn",
        description: "Vui lòng quét mã QR hoặc chọn bàn trước khi thêm món!",
      })
      return false
    }
    return true
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!checkTableSelection()) return
    if (isOutOfStock(stock)) return
    
    setIsAdding(true)
    addToCart({
      productId: id,
      name,
      price,
      image,
      stock: stock ?? null,
    })
    
    setTimeout(() => setIsAdding(false), 300)
  }

  const stockStatus = getStockStatus(stock)
  const outOfStock = isOutOfStock(stock)

  return (
    <Link href={`/${id}`}>
      <Card className="group relative p-0 overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer bg-card hover:border-primary/50 h-full flex flex-col">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
        
        <CardHeader className="p-0 relative z-10 shrink-0">
          <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-linear-to-br from-muted to-muted/50">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-linear-to-br from-muted to-muted/50">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Không có hình ảnh</div>
                </div>
              </div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                <span className="text-white font-bold text-xl px-4 py-2 bg-red-500/80 rounded-lg">Hết hàng</span>
              </div>
            )}
            {categories && categories.length > 0 && (
              <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1 max-w-[80%]">
                {categories.map((pc) => (
                  <Badge key={pc.category.id} variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-md">
                    {pc.category.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3 relative z-10 bg-card grow flex flex-col">
          <div className="space-y-1 grow">
            <h3 className="font-bold text-lg sm:text-xl line-clamp-2 group-hover:text-primary transition-colors min-h-12">
              {name}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t mt-auto">
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                {price.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {stockStatus}
              </span>
            </div>
          </div>
        </CardContent>

        {!isAdmin() && (
          <CardFooter className="p-4 sm:p-5 pt-0 relative z-10 bg-card shrink-0">
            <Button
              onClick={handleAddToCart}
              disabled={outOfStock || isAdding}
              className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              size="lg"
            >
              <ShoppingCart className={`mr-2 h-4 w-4 transition-transform ${isAdding ? 'scale-150 rotate-12' : 'group-hover/btn:scale-110 group-hover/btn:-rotate-12'}`} />
              <span className="hidden sm:inline">
                {getButtonText(isAdding, outOfStock, false)}
              </span>
              <span className="sm:hidden">
                {getButtonText(isAdding, outOfStock, true)}
              </span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}

