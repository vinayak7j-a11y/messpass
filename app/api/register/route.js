import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import Plan from '@/lib/models/Plan'
import Customer from '@/lib/models/Customer'
import { NextResponse } from 'next/server'

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

export async function GET(req) {
  await connectDB()
  const url = new URL(req.url)
  const messId = url.searchParams.get('messId')
  const mobileRaw = url.searchParams.get('mobile')

  if (mobileRaw) {
    const mobile = normalizePhone(mobileRaw)
    const customer = await Customer.findOne({ messId, mobile })
    return NextResponse.json({ customer: customer || null })
  }

  const mess = await Mess.findOne({ messId })
  if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
  const plans = await Plan.find({ messId, isActive: true })
  return NextResponse.json({ mess, plans })
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const messId = body.messId
    const name = (body.name || '').trim()
    const mobile = normalizePhone(body.mobile)
    const planId = body.planId

    if (!messId || !name || !mobile || !planId) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (mobile.length < 10) {
      return NextResponse.json({ error: 'Enter a valid mobile number' }, { status: 400 })
    }

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
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
