import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    await connectDB()
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }

    const mess = await Mess.findOne({ phone })
    if (!mess) {
      return NextResponse.json({ error: 'No mess found with this number' }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, mess.password)
    if (!valid) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      mess: {
        id: mess._id,
        messId: mess.messId,
        name: mess.name,
        ownerName: mess.ownerName,
        phone: mess.phone,
        address: mess.address,
        tagline: mess.tagline
      }
    })

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
