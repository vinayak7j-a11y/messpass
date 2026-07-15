import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import { NextResponse } from 'next/server'

function checkAdmin(req) {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

export async function GET(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()

    const messes = await Mess.find({}).select('-password').sort({ createdAt: -1 })

    const messesWithStats = await Promise.all(messes.map(async (m) => {
      const totalCustomers = await Customer.countDocuments({ messId: m.messId })
      const activeCustomers = await Customer.countDocuments({ messId: m.messId, status: 'active' })
      const totalMeals = await MealRecord.countDocuments({ messId: m.messId })

      const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
      const istNow = new Date(Date.now() + IST_OFFSET_MS)
      const startOfDay = new Date(
        Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0) - IST_OFFSET_MS
      )
      const mealsToday = await MealRecord.countDocuments({ messId: m.messId, timestamp: { $gte: startOfDay } })

      return {
        _id: m._id,
        messId: m.messId,
        name: m.name,
        ownerName: m.ownerName,
        phone: m.phone,
        address: m.address,
        blocked: m.blocked || false,
        createdAt: m.createdAt,
        totalCustomers,
        activeCustomers,
        totalMeals,
        mealsToday
      }
    }))

    return NextResponse.json({ messes: messesWithStats })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const body = await req.json()
    const { messId, blocked } = body

    if (!messId || typeof blocked !== 'boolean') {
      return NextResponse.json({ error: 'messId and blocked required' }, { status: 400 })
    }

    const mess = await Mess.findOneAndUpdate({ messId }, { blocked }, { new: true }).select('-password')
    if (!mess) return NextResponse.json({ error: 'Mess not found' }, { status: 404 })
    return NextResponse.json({ mess })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const messId = new URL(req.url).searchParams.get('messId')
    if (!messId) return NextResponse.json({ error: 'messId required' }, { status: 400 })

    const Plan = (await import('@/lib/models/Plan')).default
    const AuditLog = (await import('@/lib/models/AuditLog')).default

    await Mess.deleteOne({ messId })
    await Customer.deleteMany({ messId })
    await MealRecord.deleteMany({ messId })
    await Plan.deleteMany({ messId })
    await AuditLog.deleteMany({ messId })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
