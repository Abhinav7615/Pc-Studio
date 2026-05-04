import mongoose, { Document, Schema } from 'mongoose';

interface SupportMessage {
  sender: 'customer' | 'admin' | 'system';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  subject: string;
  category: 'ticket' | 'cancellation' | 'shipping' | 'general-support';
  description: string;
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  relatedOrder?: mongoose.Types.ObjectId;
  messages: SupportMessage[];
  assignedTo?: mongoose.Types.ObjectId;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags?: string[];
}

const SupportMessageSchema = new Schema<SupportMessage>({
  sender: {
    type: String,
    enum: ['customer', 'admin', 'system'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ['ticket', 'cancellation', 'shipping', 'general-support'],
      default: 'general-support',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'waiting-customer', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    relatedOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    messages: [SupportMessageSchema],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Index for faster queries
SupportTicketSchema.index({ customer: 1, status: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ relatedOrder: 1 });

const SupportTicket = mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
