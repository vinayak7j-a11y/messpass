import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const phone = normalizePhone(body.phone)
    const name = (body.name || '').trim().toLowerCase()
    const newPassword = body.newPassword || ''

    if (!phone || !name || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const mess = await Mess.findOne({ phone })
    if (!mess) {
      return NextResponse.json({ error: 'No mess found with this phone number' }, { status: 404 })
    }

    if (mess.name.trim().toLowerCase() !== name) {
      return NextResponse.json({ error: 'Mess name does not match our records' }, { status: 401 })
    }

    mess.password = await bcrypt.hash(newPassword, 10)
    await mess.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
