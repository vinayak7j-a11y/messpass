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
    const now = new Date()
    await Customer.updateMany(
      { messId, status: 'active', onHold: { $ne: true }, planExpiresAt: { $ne: null, $lte: now } },
      { status: 'expired', remainingMeals: 0 }
    )
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
      const now = new Date()
      const planExpiresAt = plan.validityDays ? new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000) : null
      const customer = await Customer.findByIdAndUpdate(
        customerId,
        {
          planId: renewPlanId,
          totalMeals: plan.totalMeals,
          usedMeals: 0,
          remainingMeals: plan.totalMeals,
          status: 'active',
          planStartedAt: now,
          planExpiresAt
        },
        { new: true }
      ).populate('planId')
      if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      return NextResponse.json({ customer })
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const update = { status }
    if (status === 'active') {
      const existing = await Customer.findById(customerId)
      if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      // Only (re)start the validity clock if it's not already running — approving
      // a customer who's already active shouldn't reset their clock.
      if (existing.status !== 'active') {
        const plan = existing.planId ? await Plan.findById(existing.planId) : null
        const now = new Date()
        update.planStartedAt = now
        update.planExpiresAt = plan?.validityDays ? new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000) : null
      }
    }

    const customer = await Customer.findByIdAndUpdate(customerId, update, { new: true })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    return NextResponse.json({ customer })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
