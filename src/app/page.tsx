"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/products/product-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface Category {
  id: string
  name: string
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch("/api/products")
  const data = await res.json()
  return data.data || []
}

async function getCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories")
  const data = await res.json()
  return data.data || []
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  useEffect(() => {
    let filtered = products
    
    // Lọc theo danh mục
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((product) => {
        if (selectedCategory === "NO_CATEGORY") {
          return !product.categories || product.categories.length === 0
        }
        return product.categories?.some(pc => pc.category.id === selectedCategory) || false
      })
    }
    
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, products])

  async function loadProducts() {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Cửa Hàng</h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          Chào mừng quý khách tới nhà hàng của chúng tôi!
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                <SelectItem value="NO_CATEGORY">Không có danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchQuery || selectedCategory !== "ALL") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("ALL")
              }}
              className="whitespace-nowrap"
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-96 bg-muted animate-pulse rounded-lg border-2"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</p>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Thử điều chỉnh từ khóa tìm kiếm"
              : "Hiện tại không có sản phẩm nào"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Tìm thấy {filteredProducts.length} sản phẩm
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                image={product.image}
                stock={product.stock}
                categories={product.categories}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
