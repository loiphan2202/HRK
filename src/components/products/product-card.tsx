"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useState } from "react"

type Category = 'APPETIZER' | 'MAIN_COURSE' | 'DESSERT' | 'BEVERAGE' | 'SOUP' | 'SALAD'

interface ProductCardProps {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  stock: number
  category?: Category
}

export function ProductCard({ id, name, description, price, image, stock }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (stock === 0) return
    
    setIsAdding(true)
    addToCart({
      productId: id,
      name,
      price,
      image,
      stock,
    })
    
    setTimeout(() => setIsAdding(false), 300)
  }

  return (
    <Link href={`/${id}`}>
      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="p-0 relative">
          <div className="relative w-full h-64 overflow-hidden bg-muted">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            {stock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Out of Stock</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2 relative z-10">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className="text-2xl font-bold text-primary">
              ${price.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {stock > 0 ? `${stock} in stock` : "Out of stock"}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 relative z-10">
          <Button
            onClick={handleAddToCart}
            disabled={stock === 0 || isAdding}
            className="w-full group/btn"
            size="lg"
          >
            <ShoppingCart className={`mr-2 h-4 w-4 transition-transform ${isAdding ? 'scale-150' : 'group-hover/btn:scale-110'}`} />
            {isAdding ? "Added!" : stock > 0 ? "Add to Cart" : "Out of Stock"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

