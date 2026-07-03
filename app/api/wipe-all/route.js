import { connectDB } from '@/lib/mongodb'
import Mess from '@/lib/models/Mess'
import Plan from '@/lib/models/Plan'
import Customer from '@/lib/models/Customer'
import MealRecord from '@/lib/models/MealRecord'
import AuditLog from '@/lib/models/AuditLog'
import LoginAttempt from '@/lib/models/LoginAttempt'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  if (body.confirm !== 'yes-wipe-everything') {
    return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
  }

  await connectDB()

  const results = {
    messes: (await Mess.deleteMany({})).deletedCount,
    plans: (await Plan.deleteMany({})).deletedCount,
    customers: (await Customer.deleteMany({})).deletedCount,
    mealRecords: (await MealRecord.deleteMany({})).deletedCount,
    auditLogs: (await AuditLog.deleteMany({})).deletedCount,
    loginAttempts: (await LoginAttempt.deleteMany({})).deletedCount,
  }

  return NextResponse.json({ success: true, deleted: results })
}
