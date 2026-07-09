import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import PendingRegistration from '@/lib/models/PendingRegistration'
import SubscriptionPayment from '@/lib/models/SubscriptionPayment'
import { NextResponse } from 'next/server'

const PLAN_PRICES = { monthly: 149, quarterly: 349 }
const PLAN_DAYS = { monthly: 30, quarterly: 90 }

function checkAdmin(req) {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const { messId, plan } = body

    if (!messId || !plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: 'Valid messId and plan required' }, { status: 400 })
    }

    const pending = await PendingRegistration.findOne({ messId })
    const existingMess = await Mess.findOne({ messId })

    if (!pending && !existingMess) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const existingPending = await SubscriptionPayment.findOne({ messId, status: 'pending' })
    if (existingPending) {
      return NextResponse.json({ success: true, payment: existingPending, amount: existingPending.amount })
    }

    const amount = PLAN_PRICES[plan]
    const payment = await SubscriptionPayment.create({ messId, plan, amount })

    return NextResponse.json({ success: true, payment, amount })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    await connectDB()

    const url = new URL(req.url)
    const messId = url.searchParams.get('messId')

    // Shop: Check its own pending payment
    if (messId) {
      const payment = await SubscriptionPayment.findOne({
        messId,
        status: 'pending'
      }).sort({ createdAt: -1 })

      return NextResponse.json({ payment: payment || null })
    }

    // Admin: Get all pending payments
    if (!checkAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payments = await SubscriptionPayment
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })

    return NextResponse.json({ payments })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const { paymentId, action } = body

    if (!paymentId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'paymentId and valid action required' }, { status: 400 })
    }

    const payment = await SubscriptionPayment.findById(paymentId)
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    if (action === 'reject') {
      payment.status = 'rejected'
      await payment.save()
      // Reject just deletes the unpaid pending registration if it was never a real account
      await PendingRegistration.deleteOne({ messId: payment.messId })
      return NextResponse.json({ success: true, payment })
    }

    // APPROVE
    payment.status = 'approved'
    payment.approvedAt = new Date()
    await payment.save()

    const days = PLAN_DAYS[payment.plan]
    const now = new Date()

    let mess = await Mess.findOne({ messId: payment.messId })

    if (!mess) {
      // First-time approval — this is when the real Mess account actually gets created
      const pending = await PendingRegistration.findOne({ messId: payment.messId })
      if (!pending) {
        return NextResponse.json({ error: 'Pending registration no longer exists' }, { status: 404 })
      }

      const newExpiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      mess = await Mess.create({
        name: pending.name,
        ownerName: pending.ownerName,
        phone: pending.phone,
        address: pending.address,
        tagline: pending.tagline,
        messId: pending.messId,
        password: pending.password,
        subscriptionStatus: 'active',
        subscriptionPlan: payment.plan,
        subscriptionExpiresAt: newExpiry
      })

      await PendingRegistration.deleteOne({ messId: payment.messId })

      return NextResponse.json({ success: true, payment, newExpiry, messCreated: true })
    }

    // Renewal for an existing active/expired mess
    const baseDate = (mess.subscriptionExpiresAt && mess.subscriptionExpiresAt > now) ? mess.subscriptionExpiresAt : now
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

    await Mess.findOneAndUpdate(
      { messId: payment.messId },
      { subscriptionStatus: 'active', subscriptionExpiresAt: newExpiry, subscriptionPlan: payment.plan }
    )

    return NextResponse.json({ success: true, payment, newExpiry, messCreated: false })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
