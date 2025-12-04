"use client"

import { useEffect } from "react"

/**
 * Component to clear table selection when user leaves/closes the website
 * This ensures users must re-select or check-in when they return
 */
export function ClearTableListener() {
  useEffect(() => {
    // Clear table selection when page is unloaded (user closes tab, navigates away, etc.)
    const handleBeforeUnload = () => {
      localStorage.removeItem('currentTable')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}

