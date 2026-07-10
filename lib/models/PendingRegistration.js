import mongoose from 'mongoose'

const PendingRegistrationSchema = new mongoose.Schema({
  messId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  tagline: { type: String, default: '' },
  password: { type: String, required: true },
  activationToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 604800 }
})

export default mongoose.models.PendingRegistration || mongoose.model('PendingRegistration', PendingRegistrationSchema)
