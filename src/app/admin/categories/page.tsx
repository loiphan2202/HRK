"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit2, Trash2, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface Category {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function AdminCategoriesPage() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialog, setEditDialog] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: string | null }>({
    open: false,
    categoryId: null,
  })
  const [categoryName, setCategoryName] = useState("")

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createCategory() {
    try {
      if (!categoryName.trim()) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Tên danh mục là bắt buộc.",
        })
        return
      }

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMessage = error.error?.message || error.error || error.message || "Failed to create category"
        throw new Error(errorMessage)
      }

      setCategoryName("")
      setDialogOpen(false)
      await loadCategories()
      toast({
        title: "Thành công",
        description: "Đã tạo danh mục mới.",
      })
    } catch (error: unknown) {
      console.error("Failed to create category:", error)
      const message = error instanceof Error ? error.message : "Không thể tạo danh mục"
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: message,
      })
    }
  }

  async function updateCategory(id: string, name: string) {
    try {
      if (!name.trim()) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Tên danh mục là bắt buộc.",
        })
        return
      }

      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMessage = error.error?.message || error.error || error.message || "Failed to update category"
        throw new Error(errorMessage)
      }

      setEditDialog({ open: false, category: null })
      await loadCategories()
      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục.",
      })
    } catch (error: unknown) {
      console.error("Failed to update category:", error)
      const message = error instanceof Error ? error.message : "Không thể cập nhật danh mục"
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: message,
      })
    }
  }

  async function deleteCategory(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        const errorMessage = error.error?.message || error.error || error.message || "Failed to delete category"
        throw new Error(errorMessage)
      }

      setDeleteDialog({ open: false, categoryId: null })
      await loadCategories()
      toast({
        title: "Thành công",
        description: "Đã xóa danh mục.",
      })
    } catch (error: unknown) {
      console.error("Failed to delete category:", error)
      const message = error instanceof Error ? error.message : "Không thể xóa danh mục"
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: message,
      })
    }
  }

  if (isLoading || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 w-full px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Quản lý danh mục</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Quản lý danh mục sản phẩm của nhà hàng
        </p>
      </div>
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm danh mục mới</DialogTitle>
              <DialogDescription>
                Tạo danh mục mới cho sản phẩm
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Tên danh mục</Label>
                <Input
                  id="categoryName"
                  placeholder="Nhập tên danh mục"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      createCategory()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={createCategory} disabled={!categoryName.trim()}>
                Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading categories...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên danh mục</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Không có danh mục nào. Tạo danh mục đầu tiên!
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Mở menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setEditDialog({ open: true, category })}
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteDialog({ open: true, categoryId: category.id })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
            <DialogDescription>
              Cập nhật tên danh mục
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editCategoryName">Tên danh mục</Label>
              <Input
                id="editCategoryName"
                defaultValue={editDialog.category?.name || ""}
                onChange={(e) => {
                  if (editDialog.category) {
                    setEditDialog({
                      open: true,
                      category: { ...editDialog.category, name: e.target.value },
                    })
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editDialog.category) {
                    e.preventDefault()
                    updateCategory(editDialog.category.id, editDialog.category.name)
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, category: null })}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (editDialog.category) {
                  updateCategory(editDialog.category.id, editDialog.category.name)
                }
              }}
              disabled={!editDialog.category?.name.trim()}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, categoryId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Danh mục sẽ bị xóa vĩnh viễn.
              Các sản phẩm sử dụng danh mục này cần được cập nhật.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-red-50 hover:bg-red-700"
              onClick={() => {
                if (deleteDialog.categoryId) {
                  deleteCategory(deleteDialog.categoryId)
                }
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

