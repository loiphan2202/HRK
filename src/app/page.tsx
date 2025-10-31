"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/products/product-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

type Category = 'APPETIZER' | 'MAIN_COURSE' | 'DESSERT' | 'BEVERAGE' | 'SOUP' | 'SALAD'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  category?: Category
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch("/api/products")
  const data = await res.json()
  return data.data || []
}

const categories: Category[] = ['APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SOUP', 'SALAD']

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | "ALL">("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    let filtered = products
    
    // Filter by category
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }
    
    // Filter by search query
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

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Shop</h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          Browse our collection of products. Find what you're looking for with our search feature.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {(searchQuery || selectedCategory !== "ALL") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("ALL")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("ALL")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.replace('_', ' ')}
            </Button>
          ))}
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
          <p className="text-lg font-semibold mb-2">No products found</p>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search terms"
              : "No products available at the moment"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
