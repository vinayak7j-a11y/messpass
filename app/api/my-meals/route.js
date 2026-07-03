import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import { NextResponse } from 'next/server'

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

export async function GET(req) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const messId = url.searchParams.get('messId')
    const mobileRaw = url.searchParams.get('mobile')

    if (!messId || !mobileRaw) {
      return NextResponse.json({ error: 'messId and mobile required' }, { status: 400 })
    }

    const mobile = normalizePhone(mobileRaw)
    const customer = await Customer.findOne({ messId, mobile })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const meals = await MealRecord.find({ customerId: customer._id }).sort({ mealNumber: 1 })

    return NextResponse.json({
      customer: {
        name: customer.name,
        totalMeals: customer.totalMeals,
        usedMeals: customer.usedMeals,
        remainingMeals: customer.remainingMeals,
        status: customer.status
      },
      meals: meals.map(m => ({
        mealNumber: m.mealNumber,
        mealType: m.mealType,
        timestamp: m.timestamp
      }))
    })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
