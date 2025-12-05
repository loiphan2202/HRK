import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6 text-center">
        Trang bạn tìm kiếm không tồn tại.
      </p>
      <Link href="/">
        <Button>Về trang chủ</Button>
      </Link>
    </div>
  )
}

