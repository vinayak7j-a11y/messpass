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
  try {
    await connectDB()
    const body = await req.json()
    const messId = body.messId
    const name = (body.name || '').trim()
    const totalMeals = Number(body.totalMeals)
    const price = Number(body.price)

    if (!messId || !name || !totalMeals || !price) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (totalMeals <= 0 || price <= 0) {
      return NextResponse.json({ error: 'Meals and price must be greater than 0' }, { status: 400 })
    }

    const plan = await Plan.create({ messId, name, totalMeals, price })
    return NextResponse.json({ plan }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

export async function DELETE(req) {
  await connectDB()
  const id = new URL(req.url).searchParams.get('id')
  await Plan.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
