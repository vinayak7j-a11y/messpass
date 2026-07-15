import { connectDB } from '@/lib/mongodb'
import Plan from '@/lib/models/Plan'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    await connectDB()
    const messId = new URL(req.url).searchParams.get('messId')
    if (!messId) return NextResponse.json({ error: 'messId required' }, { status: 400 })
    const plans = await Plan.find({ messId, isActive: true })
    return NextResponse.json({ plans })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json()
    const messId = body.messId
    const name = (body.name || '').trim()
    const totalMeals = Number(body.totalMeals)
    const price = Number(body.price)
    const hasValidity = body.validityDays !== undefined && body.validityDays !== null && body.validityDays !== ''
    const validityDays = hasValidity ? Number(body.validityDays) : null
    if (!messId || !name || !totalMeals || !price) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (totalMeals <= 0 || price <= 0) {
      return NextResponse.json({ error: 'Meals and price must be greater than 0' }, { status: 400 })
    }
    if (hasValidity && (!Number.isInteger(validityDays) || validityDays <= 0)) {
      return NextResponse.json({ error: 'Validity must be a whole number of days greater than 0' }, { status: 400 })
    }
    const plan = await Plan.create({ messId, name, totalMeals, price, validityDays })
    return NextResponse.json({ plan }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    await connectDB()
    const body = await req.json()
    const id = body.id
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const update = {}
    if (body.name !== undefined) update.name = (body.name || '').trim()
    if (body.totalMeals !== undefined) update.totalMeals = Number(body.totalMeals)
    if (body.price !== undefined) update.price = Number(body.price)
    if (body.validityDays !== undefined) {
      const hasValidity = body.validityDays !== null && body.validityDays !== ''
      update.validityDays = hasValidity ? Number(body.validityDays) : null
    }

    if (update.totalMeals !== undefined && (!update.totalMeals || update.totalMeals <= 0)) {
      return NextResponse.json({ error: 'Meals must be greater than 0' }, { status: 400 })
    }
    if (update.price !== undefined && (!update.price || update.price <= 0)) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }
    if (update.validityDays !== undefined && update.validityDays !== null && (!Number.isInteger(update.validityDays) || update.validityDays <= 0)) {
      return NextResponse.json({ error: 'Validity must be a whole number of days greater than 0' }, { status: 400 })
    }

    const plan = await Plan.findByIdAndUpdate(id, update, { new: true })
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    return NextResponse.json({ plan })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    await connectDB()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await Plan.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
