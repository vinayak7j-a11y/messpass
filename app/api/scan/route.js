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

    if (customer.remainingMeals <= 0) {
      return NextResponse.json({ error: 'expired', customer })
    }
// Calculate current time in Indian Standard Time (IST)
const now = new Date()

const istOffsetMs = 5.5 * 60 * 60 * 1000
const istNow = new Date(now.getTime() + istOffsetMs)

const hour = istNow.getUTCHours()

const mealType = hour < 17 ? 'lunch' : 'dinner'

// Start of current IST day (converted back to UTC)
const startOfDay = new Date(istNow)
startOfDay.setUTCHours(0, 0, 0, 0)
startOfDay.setTime(startOfDay.getTime() - istOffsetMs)

// End of current IST day (converted back to UTC)
const endOfDay = new Date(istNow)
endOfDay.setUTCHours(23, 59, 59, 999)
endOfDay.setTime(endOfDay.getTime() - istOffsetMs)
    

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