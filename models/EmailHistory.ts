import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailHistory extends Document {
  userId: mongoose.Types.ObjectId | string;
  oldEmail: string;
  newEmail: string;
  changedBy: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const EmailHistorySchema = new Schema<IEmailHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    oldEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    newEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    changedBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmailHistorySchema.index({ userId: 1 });
EmailHistorySchema.index({ oldEmail: 1 });
EmailHistorySchema.index({ newEmail: 1 });
EmailHistorySchema.index({ createdAt: -1 });

const EmailHistory: Model<IEmailHistory> = mongoose.models.EmailHistory || mongoose.model<IEmailHistory>('EmailHistory', EmailHistorySchema);

export default EmailHistory;
