import mongoose from 'mongoose'

const MessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  tagline: { type: String, default: '' },
  logo: { type: String, default: '' },
  messId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  paid: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Mess || mongoose.model('Mess', MessSchema)
