"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShoppingCart, ArrowLeft, Plus, Minus } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${id}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch product:", error)
    return null
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string)
    }
  }, [params.id])

  async function loadProduct(id: string) {
    try {
      setLoading(true)
      const data = await getProduct(id)
      setProduct(data)
    } catch (error) {
      console.error("Failed to load product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return

    setIsAdding(true)
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      })
    }
    setTimeout(() => setIsAdding(false), 300)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-8 w-full max-w-6xl">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="w-fit"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              No Image Available
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
            <p className="text-3xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </p>
          </div>

          {product.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Stock:</span>
            <span className={`text-sm ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
              {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
            </span>
          </div>

          {product.stock > 0 && (
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2 border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setQuantity(Math.max(1, Math.min(value, product.stock)))
                      }}
                      className="w-20 text-center border-0"
                      min="1"
                      max={product.stock}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  <ShoppingCart className={`mr-2 h-5 w-5 transition-transform ${isAdding ? 'scale-150' : ''}`} />
                  {isAdding ? "Added!" : `Add to Cart (${quantity})`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

