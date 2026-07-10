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

   const paymentType = existingMess
  ? 'renewal'
  : 'registration'

const existingPending = await SubscriptionPayment.findOne({
  messId,
  status: 'pending',
  type: paymentType
})

if (existingPending) {
  return NextResponse.json({
    success: true,
    payment: existingPending,
    amount: existingPending.amount
  })
}

const amount = PLAN_PRICES[plan] 

const payment = await SubscriptionPayment.create({
  messId,
  type: paymentType,
  plan,
  amount
})
    
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

    // ==========================
    // SHOP REQUEST
    // ==========================
    if (messId) {
      const mess = await Mess.findOne({ messId })

      if (!mess) {
        return NextResponse.json(
          { error: 'Mess not found' },
          { status: 404 }
        )
      }

      const now = new Date()

      let status = mess.subscriptionStatus || 'active'
      let daysRemaining = null
      let inGracePeriod = false
      let graceEndsAt = null

      if (mess.subscriptionExpiresAt) {
        const expiry = new Date(mess.subscriptionExpiresAt)

        const diffMs = expiry.getTime() - now.getTime()
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        const graceEnd = new Date(
          expiry.getTime() + 48 * 60 * 60 * 1000
        )

        if (now > expiry) {
          status = 'expired'

          if (mess.subscriptionStatus !== 'expired') {
            await Mess.findOneAndUpdate(
              { messId },
              { subscriptionStatus: 'expired' }
            )
          }

          if (now <= graceEnd) {
            inGracePeriod = true
            graceEndsAt = graceEnd
          }
        }
      }

      return NextResponse.json({
        subscriptionStatus: status,
        subscriptionPlan: mess.subscriptionPlan,
        subscriptionExpiresAt: mess.subscriptionExpiresAt,
        daysRemaining,
        inGracePeriod,
        graceEndsAt
      })
    }

    // ==========================
    // ADMIN REQUEST
    // ==========================
    if (!checkAdmin(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
const payments = await SubscriptionPayment
  .find({ status: 'pending' })
  .sort({ createdAt: -1 })

const paymentsWithNames = await Promise.all(
  payments.map(async payment => {

    let messName = null

    const paymentData = {
      ...payment.toObject()
    }

    if (payment.type === 'registration') {

      const pending = await PendingRegistration.findOne({
        messId: payment.messId
      })

      messName = pending?.name || null

    } else {

      const mess = await Mess.findOne({
        messId: payment.messId
      })

      messName = mess?.name || null

      if (mess) {
        paymentData.currentPlan = mess.subscriptionPlan
        paymentData.currentExpiry = mess.subscriptionExpiresAt

        if (mess.subscriptionExpiresAt) {
          const diff =
            mess.subscriptionExpiresAt.getTime() - Date.now()

          paymentData.daysRemaining = Math.ceil(
            diff / (1000 * 60 * 60 * 24)
          )
        }
      }
    }

    paymentData.messName = messName

    return paymentData
  })
)

return NextResponse.json({
  payments: paymentsWithNames
})
    

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
      if (payment.type === 'registration') {
  await PendingRegistration.deleteOne({
    messId: payment.messId
  })
}
      return NextResponse.json({ success: true, payment })
    }

    // APPROVE
    const days = PLAN_DAYS[payment.plan]
    const now = new Date()

    let mess = await Mess.findOne({ messId: payment.messId })
    let pending = null

    if (payment.type === 'registration') {
      // Validate the pending registration still exists BEFORE committing to
      // marking this payment approved (it auto-deletes after 7 days via TTL
      // index, so a late approval could otherwise mark the payment 'approved'
      // while no account is ever created).
      pending = await PendingRegistration.findOne({ messId: payment.messId })
      if (!pending) {
        return NextResponse.json({ error: 'Pending registration no longer exists (registration window expired after 7 days) — ask the owner to register again' }, { status: 404 })
      }
    }

    payment.status = 'approved'
    payment.approvedAt = new Date()
    await payment.save()

    if (payment.type === 'registration') {
      // First-time approval — this is when the real Mess account actually gets created
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
        subscriptionExpiresAt: newExpiry,
        activationToken: pending.activationToken || null
      })

      await PendingRegistration.deleteOne({ messId: payment.messId })

      return NextResponse.json({ success: true, payment, newExpiry, messCreated: true })
    }

    // Renewal for an existing active/expired mess 
    const baseDate =
  (mess?.subscriptionExpiresAt &&
   mess.subscriptionExpiresAt > now) ? mess.subscriptionExpiresAt : now
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
