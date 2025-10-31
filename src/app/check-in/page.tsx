"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function CheckInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [table, setTable] = useState<{ number: number } | null>(null)
  const [checkedIn, setCheckedIn] = useState(false)

  useEffect(() => {
    if (token) {
      handleCheckIn(token)
    } else {
      setError("No token provided")
      setLoading(false)
    }
  }, [token])

  async function handleCheckIn(token: string) {
    try {
      setLoading(true)
      const res = await fetch("/api/tables/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in")
      }

      setTable(data.data.table)
      setCheckedIn(true)
      
      // Store table info in localStorage for checkout validation
      localStorage.setItem("currentTable", JSON.stringify({
        tableId: data.data.table.id,
        tableNumber: data.data.table.number,
        token: token,
      }))
    } catch (err: any) {
      setError(err.message || "Failed to check in")
    } finally {
      setLoading(false)
    }
  }

  function handleContinue() {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Checking in...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Check-in Failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (checkedIn && table) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Check-in Successful
            </CardTitle>
            <CardDescription>
              You have checked in to Table {table.number}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleContinue} className="w-full">
              Start Ordering
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

