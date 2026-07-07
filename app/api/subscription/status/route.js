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

    if (status === 'active' && mess.subscriptionExpiresAt && mess.subscriptionExpiresAt < new Date()) {
      status = 'expired'
      await Mess.findOneAndUpdate({ messId }, { subscriptionStatus: 'expired' })
    }

    return NextResponse.json({
      subscriptionStatus: status,
      subscriptionExpiresAt: mess.subscriptionExpiresAt
    })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
