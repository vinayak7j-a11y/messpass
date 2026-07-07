import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import LoginAttempt from '@/lib/models/LoginAttempt'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function normalizePhone(phone) {
  return (phone || '').replace(/\s+/g, '').replace(/[-()]/g, '').trim()
}

const MAX_ATTEMPTS = 5
const BLOCK_MINUTES = 15

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const phone = normalizePhone(body.phone)
    const password = body.password || ''

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password required' }, { status: 400 })
    }

    let attemptRecord = await LoginAttempt.findOne({ phone })

    if (attemptRecord?.blockedUntil && attemptRecord.blockedUntil > new Date()) {
      const minutesLeft = Math.ceil((attemptRecord.blockedUntil - new Date()) / 60000)
      return NextResponse.json({ error: 'Too many failed attempts. Try again in ' + minutesLeft + ' minute(s).' }, { status: 429 })
    }

    const mess = await Mess.findOne({ phone })
    if (!mess) {
      return NextResponse.json({ error: 'No mess found with this number' }, { status: 404 })
    }

    if (mess.blocked) {
      return NextResponse.json({ error: 'This account has been suspended. Contact support.' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, mess.password)

    if (!valid) {
      if (attemptRecord) {
        attemptRecord.attempts += 1
        if (attemptRecord.attempts >= MAX_ATTEMPTS) {
          attemptRecord.blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60000)
        }
        await attemptRecord.save()
      } else {
        await LoginAttempt.create({ phone, attempts: 1 })
      }
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }

    if (attemptRecord) await LoginAttempt.deleteOne({ phone })

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
        subscriptionStatus: mess.subscriptionStatus || 'active',
        subscriptionPlan: mess.subscriptionPlan || null,
        subscriptionExpiresAt: mess.subscriptionExpiresAt || null
      }
    })

  } catch (err) {
    console.error('LOGIN ERROR:', err.message)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
