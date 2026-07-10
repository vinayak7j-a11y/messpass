import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import PendingRegistration from '@/lib/models/PendingRegistration'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

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

    const existingMess = await Mess.findOne({ phone })
    if (existingMess) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 })
    }

    const existingPending = await PendingRegistration.findOne({ phone })
    if (existingPending) {
      if (!existingPending.activationToken) {
        existingPending.activationToken = crypto.randomBytes(24).toString('hex')
        await existingPending.save()
      }
      return NextResponse.json({
        success: true,
        pending: {
          messId: existingPending.messId,
          name: existingPending.name,
          phone: existingPending.phone,
          token: existingPending.activationToken
        }
      }, { status: 200 })
    }

    const messId = generateMessId(name)
    const hashedPassword = await bcrypt.hash(password, 10)
    const activationToken = crypto.randomBytes(24).toString('hex')

    const pending = await PendingRegistration.create({
      name, ownerName, phone, address, tagline,
      messId,
      password: hashedPassword,
      activationToken
    })

    return NextResponse.json({
      success: true,
      pending: {
        messId: pending.messId,
        name: pending.name,
        phone: pending.phone,
        token: pending.activationToken
      }
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
