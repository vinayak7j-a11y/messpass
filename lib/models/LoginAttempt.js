import mongoose from 'mongoose'

const LoginAttemptSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  attempts: { type: Number, default: 1 },
  firstAttempt: { type: Date, default: Date.now, expires: 86400 },
  blockedUntil: { type: Date, default: null }
})

export default mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', LoginAttemptSchema)
