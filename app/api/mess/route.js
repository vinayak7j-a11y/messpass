import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

export async function GET(req) {
  await connectDB()
  const messId = new URL(req.url).searchParams.get('messId')
  const mess = await Mess.findOne({ messId }).select('-password')
  if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
  return NextResponse.json({ mess })
}

export async function PATCH(req) {
  try {
    await connectDB()
    const body = await req.json()
    const messId = body.messId

    const updates = {}
    if (body.name) updates.name = body.name.trim()
    if (body.ownerName) updates.ownerName = body.ownerName.trim()
    if (body.phone) {
      const newPhone = normalizePhone(body.phone)
      const existing = await Mess.findOne({ phone: newPhone, messId: { $ne: messId } })
      if (existing) {
        return NextResponse.json({ error: 'This phone number is already used by another mess' }, { status: 400 })
      }
      updates.phone = newPhone
    }
    if (body.address) updates.address = body.address.trim()
    if (body.tagline !== undefined) updates.tagline = body.tagline.trim()
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      updates.password = await bcrypt.hash(body.newPassword, 10)
    }

    const mess = await Mess.findOneAndUpdate({ messId }, updates, { new: true }).select('-password')
    if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
    return NextResponse.json({ mess })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
