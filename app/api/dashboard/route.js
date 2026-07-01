import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import { NextResponse } from 'next/server'

export async function GET(req) {
  await connectDB()
  const messId = new URL(req.url).searchParams.get('messId')

  const total = await Customer.countDocuments({ messId })
  const active = await Customer.countDocuments({ messId, status: 'active' })
  const pending = await Customer.countDocuments({ messId, status: 'pending' })

  const startOfDay = new Date()
  startOfDay.setHours(0,0,0,0)
  const mealsToday = await MealRecord.countDocuments({ messId, timestamp: { $gte: startOfDay } })

  const recentMeals = await MealRecord.find({ messId, timestamp: { $gte: startOfDay } })
    .populate('customerId')
    .sort({ timestamp: -1 })
    .limit(10)

  return NextResponse.json({
    total, active, pending, mealsToday,
    recentMeals: recentMeals.map(m => ({
      name: m.customerId?.name || 'Unknown',
      mealType: m.mealType,
      timestamp: m.timestamp
    }))
  })
}
