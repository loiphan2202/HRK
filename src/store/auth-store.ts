"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = 'CUSTOMER' | 'ADMIN'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role?: UserRole
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  isAdmin: () => boolean
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      initialize: () => {
        // This will be called after rehydration
        set({ isLoading: false })
      },

      login: async (email: string, password: string) => {
        try {
          const response = await fetch("/api/users/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error?.message || "Login failed")
          }

          const { user: userData, token: userToken } = data.data
          
          set({
            user: userData as User,
            token: userToken,
          })
          
          localStorage.setItem("user", JSON.stringify(userData))
          localStorage.setItem("token", userToken)
          
          // Set token in cookie for middleware
          document.cookie = `auth-token=${userToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
        } catch (error) {
          console.error("Login error:", error)
          throw error
        }
      },

      register: async (email: string, password: string, name?: string) => {
        try {
          const response = await fetch("/api/users/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, name }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            throw new Error(data.error?.message || "Registration failed")
          }

          const { user: userData, token: userToken } = data.data
          
          set({
            user: userData as User,
            token: userToken,
          })
          
          localStorage.setItem("user", JSON.stringify(userData))
          localStorage.setItem("token", userToken)
          
          // Set token in cookie for middleware
          document.cookie = `auth-token=${userToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`
        } catch (error) {
          console.error("Registration error:", error)
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
        })
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        // Clear token cookie
        document.cookie = 'auth-token=; path=/; max-age=0'
      },

      isAdmin: () => {
        return get().user?.role === 'ADMIN'
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false
        }
      },
    }
  )
)

