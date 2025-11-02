"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { ShoppingCart, User, LogOut, Settings, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { getItemCount } = useCart()
  const { user, logout, isLoading, isAdmin } = useAuth()
  const itemCount = getItemCount()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Mục điều hướng dựa trên vai trò
  const navigation = user && isAdmin() 
    ? [
        { name: "Sản phẩm", href: "/admin/products" },
        { name: "Danh mục", href: "/admin/categories" },
        { name: "Bàn", href: "/admin/tables" },
        { name: "Đơn hàng", href: "/admin/orders" },
      ]
    : user
    ? [
        { name: "Đơn hàng", href: "/orders" },
      ]
    : []

  const handleLogout = () => {
    logout()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center px-4">
        <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-black dark:bg-black text-white dark:text-black font-bold text-lg">
                    <Image src="/vercel.svg" alt="logo" width={32} height={32} />
                  </div>
                  <span>Menu</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4 mt-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "px-3 py-2 rounded-md text-base font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                {user && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2",
                          pathname === "/settings"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        Cài đặt
                      </Link>
                      {!isAdmin() && (
                        <Link
                          href="/orders"
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2",
                            pathname === "/orders"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <User className="h-4 w-4" />
                          Đơn hàng của tôi
                        </Link>
                      )}
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2",
                            pathname === "/admin"
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Settings className="h-4 w-4" />
                          Trang quản trị
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-black dark:bg-black text-white dark:text-black font-bold text-lg">
              <Image src="/vercel.svg" alt="logo" width={32} height={32} />
            </div>
            <span className="font-bold text-lg hidden sm:inline">HRK</span>
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          {!isAdmin() && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
                <span className="sr-only">Giỏ hàng</span>
              </Button>
            </Link>
          )}
          
          {!isLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || user.email}
                          width={32}
                          height={32}
                          className="rounded-full object-cover aspect-square"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="sr-only">Menu người dùng</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Trang quản trị
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Đăng nhập</span>
                      <span className="sm:hidden">Đăng nhập</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">Đăng ký</span>
                      <span className="sm:hidden">ĐK</span>
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
          
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}