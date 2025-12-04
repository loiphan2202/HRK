"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
  stock: number | null // null = no tracking, -1 = unlimited, >=0 = actual stock
}

interface CartState {
  items: CartItem[]
  addToCart: (product: Omit<CartItem, "quantity">) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product: Omit<CartItem, "quantity">) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.productId
          )
          
          if (existingItem) {
            // Check stock limit (only if stock is tracked and not unlimited)
            const newQuantity = existingItem.quantity + 1
            if (product.stock !== null && product.stock !== -1 && newQuantity > product.stock) {
              return state // Don't add if exceeds stock
            }
            return {
              items: state.items.map((item) =>
                item.productId === product.productId
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
            }
          }
          
          return {
            items: [...state.items, { ...product, quantity: 1 }],
          }
        })
      },

      removeFromCart: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        
        set((state) => ({
          items: state.items.map((item) => {
            if (item.productId === productId) {
              // Check stock limit (only if stock is tracked and not unlimited)
              if (item.stock !== null && item.stock !== -1) {
                const newQuantity = Math.min(quantity, item.stock)
                return { ...item, quantity: newQuantity }
              }
              // No limit if stock is null or -1 (unlimited)
              return { ...item, quantity }
            }
            return item
          }),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: "cart-storage",
    }
  )
)

