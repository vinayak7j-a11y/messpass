import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import AuditLog from '@/lib/models/AuditLog'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    await connectDB()
    const { customerId, action, reason, messId } = await req.json()

    if (!customerId || !action || !reason || !messId) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (action !== '+1' && action !== '-1') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const customer = await Customer.findById(customerId)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    if (action === '+1') {
      customer.usedMeals = Math.max(0, customer.usedMeals - 1)
      customer.remainingMeals = Math.min(customer.totalMeals, customer.remainingMeals + 1)
    } else {
      if (customer.remainingMeals <= 0) {
        return NextResponse.json({ error: 'No meals remaining to deduct' }, { status: 400 })
      }
      customer.usedMeals += 1
      customer.remainingMeals -= 1
    }

    await customer.save()

    await AuditLog.create({
      messId,
      customerId: customer._id,
      customerName: customer.name,
      action,
      reason
    })

    return NextResponse.json({ success: true, customer })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    await connectDB()
    const messId = new URL(req.url).searchParams.get('messId')
    if (!messId) return NextResponse.json({ error: 'messId required' }, { status: 400 })
    const logs = await AuditLog.find({ messId }).sort({ timestamp: -1 }).limit(50)
    return NextResponse.json({ logs })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
