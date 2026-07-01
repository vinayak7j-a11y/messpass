import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function generateMessId(name) {
  const clean = name.toUpperCase().replace(/\s+/g, '_').slice(0, 15)
  const rand = Math.floor(Math.random() * 900) + 100
  return `${clean}_${rand}`
}

export async function POST(req) {
  try {
    await connectDB()
    const { name, ownerName, phone, address, tagline, password } = await req.json()

    if (!name || !ownerName || !phone || !address || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const existing = await Mess.findOne({ phone })
    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 })
    }

    const messId = generateMessId(name)
    const hashedPassword = await bcrypt.hash(password, 10)

    const mess = await Mess.create({
      name, ownerName, phone, address,
      tagline: tagline || '',
      messId,
      password: hashedPassword
    })

    return NextResponse.json({ 
      success: true, 
      messId: mess.messId,
      message: 'Mess registered successfully'
    }, { status: 201 })

  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
