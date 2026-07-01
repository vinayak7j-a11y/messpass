import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import Plan from '@/lib/models/Plan'
import Customer from '@/lib/models/Customer'
import { NextResponse } from 'next/server'

export async function GET(req) {
  await connectDB()
  const url = new URL(req.url)
  const messId = url.searchParams.get('messId')
  const mobile = url.searchParams.get('mobile')

  if (mobile) {
    const customer = await Customer.findOne({ messId, mobile })
    return NextResponse.json({ customer: customer || null })
  }

  const mess = await Mess.findOne({ messId })
  if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
  const plans = await Plan.find({ messId, isActive: true })
  return NextResponse.json({ mess, plans })
}

export async function POST(req) {
  await connectDB()
  const { messId, name, mobile, planId } = await req.json()
  const existing = await Customer.findOne({ messId, mobile })
  if (existing) return NextResponse.json({ error: 'Mobile number already registered' }, { status: 400 })
  const plan = await Plan.findById(planId)
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  const customer = await Customer.create({
    messId, name, mobile, planId,
    totalMeals: plan.totalMeals,
    remainingMeals: plan.totalMeals,
    status: 'pending'
  })
  return NextResponse.json({ success: true, customer }, { status: 201 })
}
