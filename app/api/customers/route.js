import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import Plan from '@/lib/models/Plan'
import { NextResponse } from 'next/server'

export async function GET(req) {
  await connectDB()
  const url = new URL(req.url)
  const messId = url.searchParams.get('messId')
  const status = url.searchParams.get('status')
  const query = { messId }
  if (status) query.status = status
  const customers = await Customer.find(query).populate('planId').sort({ createdAt: -1 })
  return NextResponse.json({ customers })
}

export async function PATCH(req) {
  await connectDB()
  const body = await req.json()
  const { customerId, status, renewPlanId } = body

  if (renewPlanId) {
    const Plan = (await import('@/lib/models/Plan')).default
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
    return NextResponse.json({ customer })
  }

  const customer = await Customer.findByIdAndUpdate(customerId, { status }, { new: true })
  return NextResponse.json({ customer })
}
