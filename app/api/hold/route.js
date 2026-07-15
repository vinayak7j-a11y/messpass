import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import AuditLog from '@/lib/models/AuditLog'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    await connectDB()
    const { customerId, messId, action, reason } = await req.json()

    if (!customerId || !messId || !action) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (action !== 'hold' && action !== 'resume') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const customer = await Customer.findById(customerId)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    if (action === 'hold') {
      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: 'A reason is required to put meals on hold' }, { status: 400 })
      }
      if (customer.onHold) {
        return NextResponse.json({ error: 'Already on hold' }, { status: 400 })
      }
      if (customer.status !== 'active') {
        return NextResponse.json({ error: 'Only active customers can be put on hold' }, { status: 400 })
      }

      customer.onHold = true
      customer.holdReason = reason.trim()
      customer.holdStartedAt = new Date()
      await customer.save()

      await AuditLog.create({
        messId,
        customerId: customer._id,
        customerName: customer.name,
        action: 'hold',
        reason: reason.trim()
      })

      return NextResponse.json({ success: true, customer })
    }

    // resume
    if (!customer.onHold) {
      return NextResponse.json({ error: 'Not currently on hold' }, { status: 400 })
    }

    const now = new Date()
    const heldMs = now.getTime() - new Date(customer.holdStartedAt).getTime()

    // Push the validity window back by exactly how long they were paused,
    // so a hold never costs the customer any of their remaining days.
    if (customer.planExpiresAt) {
      customer.planExpiresAt = new Date(new Date(customer.planExpiresAt).getTime() + heldMs)
    }

    const heldDays = Math.max(1, Math.round(heldMs / (24 * 60 * 60 * 1000)))
    const resumeReason = (reason && reason.trim()) || `Resumed after ${heldDays} day${heldDays === 1 ? '' : 's'} on hold`

    customer.onHold = false
    customer.holdReason = null
    customer.holdStartedAt = null
    await customer.save()

    await AuditLog.create({
      messId,
      customerId: customer._id,
      customerName: customer.name,
      action: 'resume',
      reason: resumeReason
    })

    return NextResponse.json({ success: true, customer })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
