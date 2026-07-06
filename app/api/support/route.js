import { connectDB } from '@/lib/mongodb'
import SupportTicket from '@/lib/models/SupportTicket'
import { NextResponse } from 'next/server'

function checkAdmin(req) {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const { messId, messName, phone, subject, message } = body

    if (!messId || !messName || !phone || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const ticket = await SupportTicket.create({ messId, messName, phone, subject, message })
    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const tickets = await SupportTicket.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ tickets })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const { ticketId, status } = body
    if (!ticketId || !status) return NextResponse.json({ error: 'ticketId and status required' }, { status: 400 })
    const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true })
    return NextResponse.json({ ticket })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
