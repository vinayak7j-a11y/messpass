import mongoose from 'mongoose'

const MealRecordSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  messId: { type: String, required: true },
  mealNumber: { type: Number, required: true },
  mealType: { type: String, enum: ['lunch', 'dinner', 'other'] },
  timestamp: { type: Date, default: Date.now }
})

export default mongoose.models.MealRecord || mongoose.model('MealRecord', MealRecordSchema)
