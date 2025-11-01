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
import { useAuth } from "@/contexts/auth-context"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number | null
  image: string | null
  categories?: Array<{
    category: {
      id: string
      name: string
    }
  }>
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
  const { isAdmin } = useAuth()
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
    if (!product) return
    
    // Chỉ kiểm tra stock nếu có tracking (stock !== null && stock >= 0)
    const hasStock = product.stock === null || product.stock === -1 || product.stock > 0
    if (!hasStock) return

    setIsAdding(true)
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock || 0,
      })
    }
    setTimeout(() => setIsAdding(false), 300)
  }

  // Tính max quantity có thể chọn
  const getMaxQuantity = () => {
    if (!product) return 1
    if (product.stock === null || product.stock === -1) return 99 // Không giới hạn
    return product.stock
  }

  const canAddToCart = () => {
    if (!product) return false
    if (product.stock === null) return true // Không theo dõi
    if (product.stock === -1) return true // Không giới hạn
    return product.stock > 0
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
        <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về cửa hàng
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
        Quay lại
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
              Không có hình ảnh
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{product.name}</h1>
              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((pc) => (
                    <span key={pc.category.id} className="px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground rounded-full">
                      {pc.category.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-primary">
              {product.price.toLocaleString('vi-VN')}đ
            </p>
          </div>

          {product.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Mô tả</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Tồn kho:</span>
            <span className={`text-sm ${
              product.stock === null || product.stock === -1 || (product.stock !== null && product.stock > 0) 
                ? "text-green-600" 
                : "text-red-600"
            }`}>
              {product.stock === null 
                ? "Không theo dõi" 
                : product.stock === -1 
                ? "Không giới hạn" 
                : product.stock > 0 
                ? `Còn ${product.stock} sản phẩm` 
                : "Hết hàng"}
            </span>
          </div>

          {!isAdmin() && canAddToCart() && (
            <Card className="border-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Số lượng:</span>
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
                        setQuantity(Math.max(1, Math.min(value, getMaxQuantity())))
                      }}
                      className="w-20 text-center border-0"
                      min="1"
                      max={getMaxQuantity()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(Math.min(getMaxQuantity(), quantity + 1))}
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
                  {isAdding ? "Đã thêm!" : `Thêm vào giỏ (${quantity})`}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

