"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Category {
  id: string
  name: string
}

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

interface CreateProductProps {
  onProductCreated?: (product: Product) => void
}

export function CreateProduct({ onProductCreated }: CreateProductProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  async function loadCategories() {
    try {
      setLoadingCategories(true)
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget;
    setLoading(true)
    const formData = new FormData(form)

    // Thêm các categoryIds đã chọn vào formData
    selectedCategoryIds.forEach(categoryId => {
      formData.append('categoryIds', categoryId)
    })

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!res.ok) {
        const error = await res.json();
        console.error('Create error:', error);
        throw new Error(error.message || "Failed to create product");
      }

      const result = await res.json()
      
      // Store form reference before closing dialog
      form.reset();
      setSelectedCategoryIds([])
      
      // Gọi callback nếu có
      if (onProductCreated && result.success) {
        onProductCreated(result.data)
      }
      
      // Finally close the dialog
      setOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
    } finally {
      setLoading(false)
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm</DialogTitle>
          <DialogDescription>
            Thêm sản phẩm mới vào danh mục. Nhấn tạo khi hoàn thành.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Product name"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Product description"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label>Danh mục (Có thể chọn nhiều)</Label>
              {loadingCategories ? (
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm items-center">
                  Đang tải danh mục...
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 p-3 rounded-md border border-input bg-background">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có danh mục nào</p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${cat.id}`}
                          checked={selectedCategoryIds.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                          disabled={loading}
                        />
                        <Label
                          htmlFor={`category-${cat.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {cat.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Tồn kho (Để trống hoặc -1 = không giới hạn)</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="0 hoặc -1 (không giới hạn)"
                min="-1"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Để trống = không theo dõi stock, -1 = không giới hạn, số &gt;= 0 = số lượng cụ thể
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}