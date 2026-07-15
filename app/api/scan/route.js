import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import { NextResponse } from 'next/server'

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const messId = body.messId
    const mobile = normalizePhone(body.mobile)

    const customer = await Customer.findOne({ messId, mobile })
    if (!customer) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    if (customer.status === 'pending') return NextResponse.json({ error: 'pending', customer })
    if (customer.status === 'rejected') return NextResponse.json({ error: 'rejected', customer })
    if (customer.onHold) return NextResponse.json({ error: 'on_hold', customer })

    if (customer.planExpiresAt && new Date() > customer.planExpiresAt && customer.status !== 'expired') {
      customer.status = 'expired'
      customer.remainingMeals = 0
      await customer.save()
    }

    if (customer.remainingMeals <= 0 || customer.status === 'expired') {
      return NextResponse.json({ error: 'expired', customer })
    }
// Current server time (UTC)
const now = new Date()

// Current IST time (UTC +5:30)
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
const istTime = new Date(now.getTime() + IST_OFFSET_MS)

const hour = istTime.getUTCHours()
const mealType = hour < 17 ? 'lunch' : 'dinner'

// Beginning of today's IST day (converted back to UTC)
const startOfDay = new Date(
  Date.UTC(
    istTime.getUTCFullYear(),
    istTime.getUTCMonth(),
    istTime.getUTCDate(),
    0,
    0,
    0,
    0
  ) - IST_OFFSET_MS
)

// End of today's IST day (converted back to UTC)
const endOfDay = new Date(
  Date.UTC(
    istTime.getUTCFullYear(),
    istTime.getUTCMonth(),
    istTime.getUTCDate(),
    23,
    59,
    59,
    999
  ) - IST_OFFSET_MS
)
    

const existingMeal = await MealRecord.findOne({
  customerId: customer._id,
  mealType,
  timestamp: {
    $gte: startOfDay,
    $lte: endOfDay
  }
})

if (existingMeal) {
  return NextResponse.json({
    error: 'duplicate',
    customer,
    lastMeal: existingMeal
  })
}

    customer.usedMeals += 1
    customer.remainingMeals -= 1
    await customer.save()

    const mealNumber = customer.usedMeals
    const scanTimestamp = now
    await MealRecord.create({
      customerId: customer._id,
      messId,
      mealNumber,
      mealType,
      timestamp: scanTimestamp
    })

    return NextResponse.json({
      success: true,
      customer,
      mealNumber,
      mealType,
      remainingMeals: customer.remainingMeals,
      totalMeals: customer.totalMeals,
      timestamp: scanTimestamp
    })
  } catch (err) {
  console.error(err)

  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  )
} 
}