import mongoose from 'mongoose'

const PlanSchema = new mongoose.Schema({
  messId: { type: String, required: true },
  name: { type: String, required: true },
  totalMeals: { type: Number, required: true },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Plan || mongoose.model('Plan', PlanSchema)
