"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

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

export function ProductCard({ id, name, description, price, image, stock, categories }: ProductCardProps) {
  const { addToCart } = useCart()
  const { isAdmin } = useAuth()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Chỉ chặn nếu stock được theo dõi và bằng 0
    if (stock !== null && stock !== -1 && stock === 0) return
    
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

  return (
    <Link href={`/${id}`}>
      <Card className="group relative p-0 overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer bg-card hover:border-primary/50 h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
        
        <CardHeader className="p-0 relative z-10 flex-shrink-0">
          <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">Không có hình ảnh</div>
                </div>
              </div>
            )}
            {stock !== null && stock !== -1 && stock === 0 && (
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

        <CardContent className="p-4 sm:p-5 space-y-3 relative z-10 bg-card flex-grow flex flex-col">
          <div className="space-y-1 flex-grow">
            <h3 className="font-bold text-lg sm:text-xl line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem]">
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
                {stock !== null && stock !== -1 
                  ? (stock > 0 ? `Còn ${stock} sản phẩm` : "Hết hàng") 
                  : stock === -1 
                  ? "Không giới hạn" 
                  : "Không theo dõi"}
              </span>
            </div>
          </div>
        </CardContent>

        {!isAdmin() && (
          <CardFooter className="p-4 sm:p-5 pt-0 relative z-10 bg-card flex-shrink-0">
            <Button
              onClick={handleAddToCart}
              disabled={(stock !== null && stock !== -1 && stock === 0) || isAdding}
              className="w-full group/btn bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              size="lg"
            >
              <ShoppingCart className={`mr-2 h-4 w-4 transition-transform ${isAdding ? 'scale-150 rotate-12' : 'group-hover/btn:scale-110 group-hover/btn:-rotate-12'}`} />
              <span className="hidden sm:inline">
                {isAdding ? "Đã thêm! ✓" : (stock !== null && stock !== -1 && stock === 0) ? "Hết hàng" : "Thêm vào giỏ"}
              </span>
              <span className="sm:hidden">
                {isAdding ? "Đã thêm!" : (stock !== null && stock !== -1 && stock === 0) ? "Hết" : "Thêm"}
              </span>
            </Button>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}

