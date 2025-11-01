"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package2, ShoppingCart, Table, Tags } from "lucide-react"

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [user, isLoading, isAdmin, router])

  if (isLoading || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Trang quản trị</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý sản phẩm, đơn hàng và bàn
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/products">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Sản phẩm
              </CardTitle>
              <CardDescription>
                Quản lý danh mục sản phẩm, danh mục và tồn kho
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Đơn hàng
              </CardTitle>
              <CardDescription>
                Xem và quản lý tất cả đơn hàng, cập nhật trạng thái
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/tables">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Bàn
              </CardTitle>
              <CardDescription>
                Quản lý bàn và tạo mã QR
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/categories">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Danh mục
              </CardTitle>
              <CardDescription>
                Quản lý danh mục sản phẩm
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}

