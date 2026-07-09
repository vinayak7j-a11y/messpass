import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    await connectDB()
    const messId = new URL(req.url).searchParams.get('messId')
    if (!messId) return NextResponse.json({ error: 'messId required' }, { status: 400 })

    const mess = await Mess.findOne({ messId })
    if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })

    let status = mess.subscriptionStatus || 'active'

const now = new Date()

let daysRemaining = null
let inGracePeriod = false
let graceEndsAt = null

if (mess.subscriptionExpiresAt) {
  daysRemaining = Math.ceil(
    (new Date(mess.subscriptionExpiresAt).getTime() - now.getTime()) /
    (1000 * 60 * 60 * 24)
  )

  if (status === 'active' && mess.subscriptionExpiresAt < now) {
    status = 'expired'
    await Mess.findOneAndUpdate(
      { messId },
      { subscriptionStatus: 'expired' }
    )
  }

  if (status === 'expired') {
    graceEndsAt = new Date(
      new Date(mess.subscriptionExpiresAt).getTime() +
      48 * 60 * 60 * 1000
    )

    if (now < graceEndsAt) {
      inGracePeriod = true
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
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
