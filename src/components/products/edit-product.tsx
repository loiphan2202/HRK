"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"


interface EditProductProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

interface Category {
  id: string
  name: string
}

export function EditProduct({ open, onOpenChange, product, onSuccess }: EditProductProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadCategories()
      // Load selected categories từ product
      if (product?.categories) {
        setSelectedCategoryIds(product.categories.map(pc => pc.category.id))
      } else {
        setSelectedCategoryIds([])
      }
    }
  }, [open, product])

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
    if (!product) return

    setLoading(true)
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Thêm các categoryIds đã chọn vào formData
    selectedCategoryIds.forEach(categoryId => {
      formData.append('categoryIds', categoryId)
    })

    // Kiểm tra xem có file mới không
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length === 0) {
      // Nếu không có file mới, xóa trường image khỏi formData
      formData.delete('image');
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();
      
      if (!res.ok || !result.success) {
        const errorMessage = result.error?.message || "Failed to update product";
        console.error('Update error:', result.error);
        throw new Error(errorMessage);
      }

      onSuccess()
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Make changes to your product here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={product?.description || ""}
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
                          id={`edit-category-${cat.id}`}
                          checked={selectedCategoryIds.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                          disabled={loading}
                        />
                        <Label
                          htmlFor={`edit-category-${cat.id}`}
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
                defaultValue={product?.price}
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
                defaultValue={product?.stock ?? ""}
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
                accept="image/jpeg,image/png,image/gif,image/webp"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}