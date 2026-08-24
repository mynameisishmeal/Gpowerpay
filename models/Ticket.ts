import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicketMessage {
  _id?: string;
  sender: mongoose.Types.ObjectId;
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketId: string;
  customer: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedOrder?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const TicketSchema = new Schema<ITicket>({
  ticketId: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  relatedOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  messages: [TicketMessageSchema]
}, {
  timestamps: true
});

// Indexes for faster queries
TicketSchema.index({ customer: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ ticketId: 1 });
TicketSchema.index({ createdAt: -1 });

// Generate a unique ticket ID before saving for the first time
TicketSchema.pre('validate', async function(next) {
  if (this.isNew && !this.ticketId) {
    // Generate an ID like TKT-12345678
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    this.ticketId = `TKT-${randomNum}`;
  }
  next();
});

const Ticket: Model<ITicket> = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;