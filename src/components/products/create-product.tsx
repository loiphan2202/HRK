"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Upload, X } from "lucide-react"
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
import Image from "next/image"

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

export function CreateProduct({ onProductCreated }: Readonly<CreateProductProps>) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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
      const { apiPost } = await import('@/lib/api-client')
      const res = await apiPost("/api/products", formData)

      if (!res.ok) {
        const error = await res.json();
        console.error('Create error:', error);
        throw new Error(error.message || "Failed to create product");
      }

      const result = await res.json()
      
      // Store form reference before closing dialog
      form.reset();
      setSelectedCategoryIds([])
      setImagePreview(null)
      
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

  function handleFileSelect(file: File | null) {
    if (!file) {
      setImagePreview(null)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Set file to input
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    handleFileSelect(file)
  }

  function clearImage() {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setImagePreview(null)
      setSelectedCategoryIds([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [open])

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
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-6 transition-colors
                  ${isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }
                  ${imagePreview ? 'border-solid' : ''}
                `}
              >
                {imagePreview ? (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearImage}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">
                        {isDragging ? 'Thả ảnh vào đây' : 'Kéo thả ảnh vào đây hoặc click để chọn'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF, WebP (tối đa 5MB)
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      Chọn ảnh
                    </Button>
                  </div>
                )}
                <Input
                  ref={fileInputRef}
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  disabled={loading}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
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