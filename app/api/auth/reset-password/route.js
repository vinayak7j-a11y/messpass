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
    const name = (body.name || '').trim().toLowerCase()
    const newPassword = body.newPassword || ''

    if (!phone || !name || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const attemptKey = 'reset_' + phone
    let attemptRecord = await LoginAttempt.findOne({ phone: attemptKey })

    if (attemptRecord?.blockedUntil && attemptRecord.blockedUntil > new Date()) {
      const minutesLeft = Math.ceil((attemptRecord.blockedUntil - new Date()) / 60000)
      return NextResponse.json({ error: 'Too many attempts. Try again in ' + minutesLeft + ' minute(s).' }, { status: 429 })
    }

    const mess = await Mess.findOne({ phone })
    if (!mess) {
      return NextResponse.json({ error: 'No mess found with this phone number' }, { status: 404 })
    }

    if (mess.name.trim().toLowerCase() !== name) {
      if (attemptRecord) {
        attemptRecord.attempts += 1
        if (attemptRecord.attempts >= MAX_ATTEMPTS) {
          attemptRecord.blockedUntil = new Date(Date.now() + BLOCK_MINUTES * 60000)
        }
        await attemptRecord.save()
      } else {
        await LoginAttempt.create({ phone: attemptKey, attempts: 1 })
      }
      return NextResponse.json({ error: 'Mess name does not match our records' }, { status: 401 })
    }

    if (attemptRecord) await LoginAttempt.deleteOne({ phone: attemptKey })

    mess.password = await bcrypt.hash(newPassword, 10)
    await mess.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
