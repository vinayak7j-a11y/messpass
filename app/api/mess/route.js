import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(req) {
  await connectDB()
  const messId = new URL(req.url).searchParams.get('messId')
  const mess = await Mess.findOne({ messId }).select('-password')
  if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
  return NextResponse.json({ mess })
}

export async function PATCH(req) {
  await connectDB()
  const body = await req.json()
  const { messId, name, ownerName, phone, address, tagline, newPassword } = body

  const updates = {}
  if (name) updates.name = name
  if (ownerName) updates.ownerName = ownerName
  if (phone) updates.phone = phone
  if (address) updates.address = address
  if (tagline !== undefined) updates.tagline = tagline
  if (newPassword) updates.password = await bcrypt.hash(newPassword, 10)

  const mess = await Mess.findOneAndUpdate({ messId }, updates, { new: true }).select('-password')
  if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
  return NextResponse.json({ mess })
}
