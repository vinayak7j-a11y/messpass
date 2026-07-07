import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function generateMessId(name) {
  const clean = name.toUpperCase().replace(/\s+/g, '_').slice(0, 15)
  const rand = Math.floor(Math.random() * 900) + 100
  return clean + '_' + rand
}

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const name = (body.name || '').trim()
    const ownerName = (body.ownerName || '').trim()
    const phone = normalizePhone(body.phone)
    const address = (body.address || '').trim()
    const tagline = (body.tagline || '').trim()
    const password = body.password || ''

    if (!name || !ownerName || !phone || !address || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (phone.length < 10) {
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await Mess.findOne({ phone })
    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 })
    }

    const messId = generateMessId(name)
    const hashedPassword = await bcrypt.hash(password, 10)

    const mess = await Mess.create({
      name, ownerName, phone, address, tagline,
      messId,
      password: hashedPassword,
      subscriptionStatus: 'pending_payment',
      subscriptionPlan: null,
      subscriptionExpiresAt: null
    })

    return NextResponse.json({
      success: true,
      mess: {
        id: mess._id,
        messId: mess.messId,
        name: mess.name,
        ownerName: mess.ownerName,
        phone: mess.phone,
        address: mess.address,
        tagline: mess.tagline,
        subscriptionStatus: mess.subscriptionStatus
      }
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
