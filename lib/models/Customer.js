import mongoose from 'mongoose'

const CustomerSchema = new mongoose.Schema({
  messId: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  customerType: { type: String, enum: ['subscription', 'daily'], default: 'subscription' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  totalMeals: { type: Number, default: 0 },
  usedMeals: { type: Number, default: 0 },
  remainingMeals: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'active', 'expired', 'rejected'], default: 'pending' },
  loyaltyMeals: { type: Number, default: 0 },
  loyaltyRewardAvailable: { type: Boolean, default: false },
  lastScanWindow: { type: String, default: null },
  lastScanDate: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema)
