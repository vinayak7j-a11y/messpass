import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    await connectDB()
    const messId = new URL(req.url).searchParams.get('messId')
    if (!messId) return NextResponse.json({ error: 'messId required' }, { status: 400 })

    const mess = await Mess.findOne({ messId }).select('-password')
    if (!mess) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
