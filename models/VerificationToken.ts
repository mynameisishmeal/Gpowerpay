import mongoose, { Schema, Document } from 'mongoose';

/**
 * Email Verification Token Model
 * Stores tokens for email verification
 */

export interface IVerificationToken extends Document {
  userId: mongoose.Types.ObjectId | string;
  email: string;
  token: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
VerificationTokenSchema.index({ token: 1 });
VerificationTokenSchema.index({ userId: 1 });
VerificationTokenSchema.index({ email: 1 });
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

export default mongoose.models.VerificationToken || 
  mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
