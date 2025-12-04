"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/store/auth-store"

/**
 * Component to initialize auth state and set token cookie for middleware
 */
export function AuthInitializer() {
  const token = useAuthStore((state) => state.token)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      // Set token in cookie if available (for middleware)
      if (token && globalThis.window !== undefined) {
        document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
      }
      initialized.current = true
    }
  }, [token])

  // Update cookie when token changes
  useEffect(() => {
    if (token && globalThis.window !== undefined) {
      document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
    } else if (!token && globalThis.window !== undefined) {
      // Clear cookie when token is removed
      document.cookie = 'auth-token=; path=/; max-age=0'
    }
  }, [token])

  return null
}

