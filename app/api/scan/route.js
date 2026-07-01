import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import { NextResponse } from 'next/server'

export async function POST(req) {
  await connectDB()
  const { messId, mobile } = await req.json()

  const customer = await Customer.findOne({ messId, mobile })
  if (!customer) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (customer.status === 'pending') return NextResponse.json({ error: 'pending', customer })
  if (customer.status === 'rejected') return NextResponse.json({ error: 'rejected', customer })

  if (customer.remainingMeals <= 0) {
    return NextResponse.json({ error: 'expired', customer })
  }

  const hour = new Date().getHours()
  const mealType = hour < 16 ? 'lunch' : 'dinner'
  const today = new Date().toDateString()

  const lastMeal = await MealRecord.findOne({ customerId: customer._id }).sort({ timestamp: -1 })
  if (lastMeal) {
    const lastDate = new Date(lastMeal.timestamp).toDateString()
    if (lastDate === today && lastMeal.mealType === mealType) {
      return NextResponse.json({ error: 'duplicate', customer, lastMeal })
    }
  }

  customer.usedMeals += 1
  customer.remainingMeals -= 1
  await customer.save()

  const mealNumber = customer.usedMeals
  await MealRecord.create({
    customerId: customer._id,
    messId,
    mealNumber,
    mealType,
    timestamp: new Date()
  })

  return NextResponse.json({
    success: true,
    customer,
    mealNumber,
    mealType,
    remainingMeals: customer.remainingMeals,
    totalMeals: customer.totalMeals
  })
}
