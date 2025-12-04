"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Edit2, MoreHorizontal, Trash, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditProduct } from "@/components/products/edit-product"
import { useAuthStore } from "@/store/auth-store"
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  categories?: Array<{
    category: {
      id: string
      name: string
    }
  }>
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch("/api/products")
  const data = await res.json()
  return data.data
}

interface Category {
  id: string
  name: string
}

const LOADING_SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => `product-skeleton-${i}`)

const getStockDisplay = (stock: number | null): string | number => {
  if (stock === null) {
    return "Không theo dõi"
  }
  if (stock === -1) {
    return "Không giới hạn"
  }
  return stock
}

export function ProductList() {
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })

  // Load products and categories on mount
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  // Lắng nghe sự kiện product-created để update state ngay lập tức
  useEffect(() => {
    function handleProductCreated(event: CustomEvent) {
      const newProduct = event.detail
      // Thêm product mới vào state ngay lập tức
      setProducts(prev => [newProduct, ...prev])
    }

    globalThis.addEventListener('product-created', handleProductCreated as EventListener)
    return () => {
      globalThis.removeEventListener('product-created', handleProductCreated as EventListener)
    }
  }, [])

  // Filter products when search or category changes
  useEffect(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((product) => {
        if (selectedCategory === "NO_CATEGORY") {
          return !product.categories || product.categories.length === 0
        }
        return product.categories?.some(pc => pc.category.id === selectedCategory) || false
      })
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
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  async function deleteProduct(id: string) {
    // Optimistic update
    const previousProducts = [...products]
    setProducts(products.filter(p => p.id !== id))
    
    try {
      const { apiDelete } = await import('@/lib/api-client')
      const res = await apiDelete(`/api/products/${id}`)
      if (!res.ok) throw new Error("Failed to delete product")
      setDeleteDialog({ open: false, productId: null })
    } catch (error) {
      // Revert on failure
      setProducts(previousProducts)
      console.error('Failed to delete product:', error)
      // You could add a toast notification here
    }
  }

  async function handleEdit(updatedProduct: Product) {
    // Optimistic update
    const previousProducts = [...products]
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
    
    try {
      await loadProducts() // Refresh to get the latest data
      setEditDialog({ open: false, product: null })
    } catch (error) {
      // Revert on failure
      setProducts(previousProducts)
      console.error('Failed to update product:', error)
      // You could add a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[80px]">Image</TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[200px] hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">Price</TableHead>
                  <TableHead className="text-right min-w-[80px]">Stock</TableHead>
                  {isAdmin() && (
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {LOADING_SKELETON_KEYS.map((key) => (
                  <TableRow key={key} className="animate-pulse">
                    <TableCell>
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-[200px] rounded bg-muted" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="h-4 w-[300px] rounded bg-muted" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-[60px] rounded bg-muted ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-4 w-10 rounded bg-muted ml-auto" />
                    </TableCell>
                    {isAdmin() && (
                      <TableCell>
                        <div className="h-8 w-[100px] rounded bg-muted ml-auto" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-4">
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
              <SelectTrigger className="w-full sm:w-[200px]">
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

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[80px]">Image</TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[200px] hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">Price</TableHead>
                  <TableHead className="text-right min-w-[80px]">Stock</TableHead>
                  {isAdmin() && (
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin() ? 6 : 5} className="text-center text-muted-foreground">
                      Không tìm thấy sản phẩm.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate hidden md:table-cell">
                        {product.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.price.toLocaleString('vi-VN')}đ
                      </TableCell>
                      <TableCell className="text-right">
                        {getStockDisplay(product.stock)}
                      </TableCell>
                      {isAdmin() && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditDialog({ open: true, product })}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, productId: product.id })}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, productId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-red-50 hover:bg-red-700"
              onClick={() => deleteDialog.productId && deleteProduct(deleteDialog.productId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditProduct
        open={editDialog.open}
        onOpenChange={(open: boolean) => setEditDialog({ open, product: null })}
        product={editDialog.product}
        onSuccess={() => handleEdit(editDialog.product!)}
      />
    </>
  )
}