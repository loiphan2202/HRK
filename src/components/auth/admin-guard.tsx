"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"

interface AdminGuardProps {
  readonly children: React.ReactNode
}

/**
 * Component to protect admin routes
 * Redirects to home if user is not admin
 */
export function AdminGuard({ children }: Readonly<AdminGuardProps>) {
  const isAdmin = useAuthStore((state) => state.isAdmin)
  const isLoading = useAuthStore((state) => state.isLoading)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  if (isLoading || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  return <>{children}</>
}

