"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Edit2, MoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useAuth } from "@/contexts/auth-context"
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  categoryId: string
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch("/api/products")
  const data = await res.json()
  return data.data
}

export function ProductList() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
      // You could add a toast notification here
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id: string) {
    // Optimistic update
    const previousProducts = [...products]
    setProducts(products.filter(p => p.id !== id))
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              {isAdmin() && (
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`loading-${i}`} className="animate-pulse">
                <TableCell>
                  <div className="h-10 w-10 rounded-md bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-[200px] rounded bg-muted" />
                </TableCell>
                <TableCell>
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
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              {isAdmin() && (
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin() ? 6 : 5} className="text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
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
                <TableCell className="max-w-[300px] truncate">
                  {product.description}
                </TableCell>
                <TableCell className="text-right">
                  ${product.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                {isAdmin() && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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