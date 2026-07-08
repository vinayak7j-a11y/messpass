import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import Plan from '@/lib/models/Plan'
import AuditLog from '@/lib/models/AuditLog'
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

    const mess = await Mess.findOne({ messId })
    if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })

    const existingPending = await SubscriptionPayment.findOne({ messId, status: 'pending' })
    if (existingPending) {
      return NextResponse.json({ success: true, payment: existingPending, amount: existingPending.amount })
    }

    const amount = PLAN_PRICES[plan]
    const payment = await SubscriptionPayment.create({ messId, plan, amount })
    await Mess.findOneAndUpdate({ messId }, { subscriptionPlan: plan })

    return NextResponse.json({ success: true, payment, amount })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const payments = await SubscriptionPayment.find({ status: 'pending' }).sort({ createdAt: -1 })
    return NextResponse.json({ payments })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
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

    const mess = await Mess.findOne({ messId: payment.messId })

    if (action === 'reject') {
      payment.status = 'rejected'
      await payment.save()

      // A mess is only ever "reject-able" while it never had a real active subscription.
      // If it never became active even once, the registration itself was never legitimate — remove it entirely.
      if (mess && mess.subscriptionStatus === 'pending_payment') {
        await Mess.deleteOne({ messId: payment.messId })
        await Customer.deleteMany({ messId: payment.messId })
        await MealRecord.deleteMany({ messId: payment.messId })
        await Plan.deleteMany({ messId: payment.messId })
        await AuditLog.deleteMany({ messId: payment.messId })
        return NextResponse.json({ success: true, payment, messDeleted: true })
      }

      return NextResponse.json({ success: true, payment, messDeleted: false })
    }

    if (!mess) {
      return NextResponse.json({ error: 'Mess account no longer exists' }, { status: 404 })
    }

    payment.status = 'approved'
    payment.approvedAt = new Date()
    await payment.save()

    const days = PLAN_DAYS[payment.plan]
    const now = new Date()
    const baseDate = (mess.subscriptionExpiresAt && mess.subscriptionExpiresAt > now) ? mess.subscriptionExpiresAt : now
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000)

    await Mess.findOneAndUpdate(
      { messId: payment.messId },
      { subscriptionStatus: 'active', subscriptionExpiresAt: newExpiry }
    )

    return NextResponse.json({ success: true, payment, newExpiry })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
