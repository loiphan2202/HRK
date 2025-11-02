"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    } else if (user) {
      setName(user.name || "")
      setEmail(user.email)
      setAvatar(user.image || null)
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('name', name)
      formData.append('email', email)

      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Không thể cập nhật avatar")
      }

      // Cập nhật local storage
      const updatedUser = { ...user, image: data.data.image }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setAvatar(data.data.image)
      
      setMessage({ type: "success", text: "Avatar đã được cập nhật!" })
      
      // Reload để cập nhật UI
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật avatar"
      setMessage({ type: "error", text: message })
    } finally {
      setIsUploadingAvatar(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to update profile")
      }

      // Update local storage
      const updatedUser = { ...user, name, email }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      
      setMessage({ type: "success", text: "Profile updated successfully!" })
      window.location.reload()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      setMessage({ type: "error", text: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Quản lý cài đặt tài khoản và tùy chọn của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ</CardTitle>
          <CardDescription>
            Cập nhật thông tin hồ sơ của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <label htmlFor="avatar-upload" className="cursor-pointer relative group">
              {avatar ? (
                <div className="relative w-16 h-16 overflow-hidden">
                  <Image
                    src={avatar}
                    alt={user.name || user.email}
                    width={64}
                    height={64}
                    className="rounded-full object-cover w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">Thay đổi</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl group-hover:opacity-80 transition-opacity">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingAvatar}
                onChange={handleAvatarUpload}
              />
            </label>
            <div>
              <p className="font-medium">{user.name || "Người dùng"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 text-sm rounded-md mb-4 ${
                message.type === "success"
                  ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                  : "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>
            <Button type="submit" disabled={isSaving || isUploadingAvatar}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

