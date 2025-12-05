'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Disable static generation for error page
export const dynamic = 'force-dynamic'

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string }
  reset: () => void
}>) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-4xl font-bold mb-4">500</h1>
      <p className="text-muted-foreground mb-6 text-center">
        Đã xảy ra lỗi. Vui lòng thử lại sau.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Thử lại</Button>
        <Link href="/">
          <Button variant="outline">Về trang chủ</Button>
        </Link>
      </div>
    </div>
  )
}

