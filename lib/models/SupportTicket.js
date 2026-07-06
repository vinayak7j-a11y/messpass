import mongoose from 'mongoose'

const SupportTicketSchema = new mongoose.Schema({
  messId: { type: String, required: true },
  messName: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema)
