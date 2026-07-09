import mongoose from 'mongoose'

const SubscriptionPaymentSchema = new mongoose.Schema({
  messId: { type: String, required: true },

  // NEW
  type: {
    type: String,
    enum: ['registration', 'renewal'],
    default: 'registration'
  },

  plan: {
    type: String,
    enum: ['monthly', 'quarterly'],
    required: true
  },

  amount: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  approvedAt: {
    type: Date,
    default: null
  }
})

export default mongoose.models.SubscriptionPayment ||
mongoose.model('SubscriptionPayment', SubscriptionPaymentSchema)