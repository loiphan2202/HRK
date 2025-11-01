import { NextRequest, NextResponse } from 'next/server'
import { OrderStatsServiceTypeORM } from '@/server/services/order-stats-service-typeorm'
import { ErrorHandler } from '@/server/errors/error-handler'

const statsService = new OrderStatsServiceTypeORM()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'week' | 'month' | 'year' | null
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateStr) {
      startDate = new Date(startDateStr)
    }
    if (endDateStr) {
      endDate = new Date(endDateStr)
    }

    const stats = await statsService.getStats({
      period: period || undefined,
      startDate,
      endDate,
    })

    return NextResponse.json({ success: true, data: stats })
  } catch (error: unknown) {
    return ErrorHandler.handle(error)
  }
}

