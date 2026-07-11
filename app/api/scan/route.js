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

const istNow = new Date(
  now.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata'
  })
)

const hour = istNow.getHours()

const mealType = hour < 17 ? 'lunch' : 'dinner'

// Start and end of the current IST day
const startOfDay = new Date(istNow)
startOfDay.setHours(0, 0, 0, 0)

const endOfDay = new Date(istNow)
endOfDay.setHours(23, 59, 59, 999)

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
    const scanTimestamp = istNow
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
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
