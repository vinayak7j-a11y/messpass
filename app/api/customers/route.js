import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import Plan from '@/lib/models/Plan'
import { NextResponse } from 'next/server'

const VALID_STATUSES = ['pending', 'active', 'expired', 'rejected']

export async function GET(req) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const messId = url.searchParams.get('messId')
    if (!messId) return NextResponse.json({ error: 'messId required' }, { status: 400 })
    const status = url.searchParams.get('status')
    const query = { messId }
    if (status) query.status = status
    const customers = await Customer.find(query).populate('planId').sort({ createdAt: -1 })
    return NextResponse.json({ customers })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    await connectDB()
    const body = await req.json()
    const { customerId, status, renewPlanId } = body

    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 })
    }

    if (renewPlanId) {
      const plan = await Plan.findById(renewPlanId)
      if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        {
          planId: renewPlanId,
          totalMeals: plan.totalMeals,
          usedMeals: 0,
          remainingMeals: plan.totalMeals,
          status: 'active'
        },
        { new: true }
      ).populate('planId')
      if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      return NextResponse.json({ customer })
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const customer = await Customer.findByIdAndUpdate(customerId, { status }, { new: true })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ customer })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
