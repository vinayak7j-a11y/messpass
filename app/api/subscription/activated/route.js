import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    await connectDB()
    const url = new URL(req.url)
    const messId = url.searchParams.get('messId')
    const token = url.searchParams.get('token')
    if (!messId || !token) return NextResponse.json({ error: 'messId and token required' }, { status: 400 })

    const mess = await Mess.findOne({ messId })
    if (!mess) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!mess.activationToken || mess.activationToken !== token) {
      return NextResponse.json({ error: 'Invalid or already-used activation link' }, { status: 401 })
    }

    // Single-use: burn the token now that it's been redeemed
    mess.activationToken = null
    await mess.save()

    return NextResponse.json({
      mess: {
        id: mess._id,
        messId: mess.messId,
        name: mess.name,
        ownerName: mess.ownerName,
        phone: mess.phone,
        address: mess.address,
        tagline: mess.tagline,
        subscriptionStatus: mess.subscriptionStatus,
        subscriptionPlan: mess.subscriptionPlan,
        subscriptionExpiresAt: mess.subscriptionExpiresAt
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
