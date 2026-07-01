import mongoose from 'mongoose'

const AuditLogSchema = new mongoose.Schema({
  messId: { type: String, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String, required: true },
  action: { type: String, enum: ['+1', '-1'], required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
})

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)
