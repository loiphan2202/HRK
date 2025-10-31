"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, QrCode } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TableData {
  id: string
  number: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  qrCode: string | null
  token: string | null
}

export default function AdminTablesPage() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState("")
  const [creatingQr, setCreatingQr] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAdmin()) {
      router.push("/")
    }
  }, [isLoading, isAdmin, router])

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
    try {
      setLoading(true)
      const res = await fetch("/api/tables")
      const data = await res.json()
      setTables(data.data || [])
    } catch (error) {
      console.error("Failed to load tables:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createTable() {
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: parseInt(tableNumber) }),
      })

      if (!res.ok) throw new Error("Failed to create table")

      setTableNumber("")
      setDialogOpen(false)
      await loadTables()
    } catch (error) {
      console.error("Failed to create table:", error)
      alert("Failed to create table. Table number may already exist.")
    }
  }

  async function generateQrCode(tableId: string) {
    try {
      setCreatingQr(tableId)
      const res = await fetch(`/api/tables/${tableId}/qr`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to generate QR code")

      const data = await res.json()
      await loadTables()
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      alert("Failed to generate QR code")
    } finally {
      setCreatingQr(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-500"
      case "OCCUPIED": return "bg-red-500"
      case "RESERVED": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  if (isLoading || !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Tables Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage restaurant tables and generate QR codes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>
                Create a new table for the restaurant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  placeholder="Enter table number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createTable} disabled={!tableNumber}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading tables...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No tables found
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">Table {table.number}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(table.status)}>
                        {table.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {table.qrCode ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={table.qrCode}
                            alt={`QR Code for Table ${table.number}`}
                            className="w-16 h-16 object-contain border rounded"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateQrCode(table.id)}
                        disabled={creatingQr === table.id}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        {creatingQr === table.id ? "Generating..." : "Generate QR"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

