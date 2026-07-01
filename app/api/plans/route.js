import { connectDB } from '@/lib/mongodb'
import Plan from '@/lib/models/Plan'
import { NextResponse } from 'next/server'

export async function GET(req) {
  await connectDB()
  const messId = new URL(req.url).searchParams.get('messId')
  const plans = await Plan.find({ messId, isActive: true })
  return NextResponse.json({ plans })
}

export async function POST(req) {
  await connectDB()
  const { messId, name, totalMeals, price } = await req.json()
  const plan = await Plan.create({ messId, name, totalMeals: Number(totalMeals), price: Number(price) })
  return NextResponse.json({ plan }, { status: 201 })
}

export async function DELETE(req) {
  await connectDB()
  const id = new URL(req.url).searchParams.get('id')
  await Plan.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
