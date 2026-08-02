import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getBaseUrl } from '@/lib/utils/url';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';

/**
 * Email Service
 * Handles email verification and notifications using SMTP
 */

// Create SMTP transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️ SMTP not configured. Emails will be logged to console only.');
    return null;
  }

  // Remove spaces from password (common copy-paste issue)
  const cleanPassword = process.env.SMTP_PASSWORD.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPassword,
    },
  });
};

export class EmailService {
  /**
   * Generate verification token
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create email verification token
   */
  static async createVerificationToken(userId: string, email: string) {
    await connectDB();

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Delete any existing verification tokens for this user
    await VerificationToken.deleteMany({
      userId,
      type: 'email_verification',
    });

    // Create new token
    await VerificationToken.create({
      userId,
      email,
      token,
      type: 'email_verification',
      expiresAt,
    });

    return token;
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(email: string, token: string) {
    const baseUrl = getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    const transporter = createTransporter();

    const emailContent = {
      from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - Gpowerpay',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Gpowerpay! 🎉</h1>
            </div>
            <div class="content">
              <p>Thank you for signing up! Please verify your email address to activate your account.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              <p><strong>This link expires in 24 hours.</strong></p>
              <p>If you didn't create an account with Gpowerpay, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Gpowerpay!\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.`,
    };

    // If SMTP is configured, send real email
    if (transporter) {
      try {
        await transporter.sendMail(emailContent);
        console.log(`✅ Verification email sent to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Email send failed:', error);
        // Fall back to console logging
      }
    }

    // Fallback: Log to console (for development or when SMTP not configured)
    console.log('='.repeat(80));
    console.log('📧 EMAIL VERIFICATION');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`\nVerification Link:\n${verificationUrl}`);
    console.log('\nThis link expires in 24 hours.');
    console.log('='.repeat(80));

    return true;
  }

  /**
   * Verify email token
   */
  static async verifyEmail(token: string) {
    await connectDB();

    // Find token
    const verificationToken = await VerificationToken.findOne({
      token,
      type: 'email_verification',
    });

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    // Check if expired
    if (verificationToken.expiresAt < new Date()) {
      await VerificationToken.deleteOne({ _id: verificationToken._id });
      throw new Error('Verification token has expired');
    }

    // Update user
    const user = await User.findById(verificationToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Delete token
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    return user;
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string) {
    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Create new token
    const token = await this.createVerificationToken(String(user._id), user.email);

    // Send email
    await this.sendVerificationEmail(user.email, token);

    return true;
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(email: string, orderNumber: string, orderTotal: number) {
    const transporter = createTransporter();

    const emailContent = {
      from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `Order Confirmation #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <p>Thank you for your order!</p>
              <div class="order-details">
                <h2>Order #${orderNumber}</h2>
                <p><strong>Total:</strong> ₦${orderTotal.toFixed(2)}</p>
              </div>
              <p>We'll send you another email once your order ships.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Order Confirmed!\n\nOrder Number: ${orderNumber}\nTotal: ₦${orderTotal.toFixed(2)}\n\nThank you for your order!`,
    };

    if (transporter) {
      try {
        await transporter.sendMail(emailContent);
        console.log(`✅ Order confirmation sent to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Email send failed:', error);
      }
    }

    // Fallback to console
    console.log('='.repeat(80));
    console.log('📧 ORDER CONFIRMATION');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Order: #${orderNumber} - ₦${orderTotal.toFixed(2)}`);
    console.log('='.repeat(80));

    return true;
  }

  /**
   * Send order status update email
   */
  static async sendOrderStatusUpdate(
    email: string,
    orderNumber: string,
    status: string
  ) {
    const transporter = createTransporter();

    const emailContent = {
      from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `Order ${orderNumber} - Status Updated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Status Update 📦</h1>
            </div>
            <div class="content">
              <p>Your order status has been updated:</p>
              <div class="status">
                <h2>Order #${orderNumber}</h2>
                <p><strong>Status:</strong> ${status}</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Order Status Update\n\nOrder #${orderNumber}\nStatus: ${status}`,
    };

    if (transporter) {
      try {
        await transporter.sendMail(emailContent);
        console.log(`✅ Status update sent to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Email send failed:', error);
      }
    }

    // Fallback to console
    console.log('='.repeat(80));
    console.log('📧 ORDER STATUS UPDATE');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Order: #${orderNumber} - Status: ${status}`);
    console.log('='.repeat(80));

    return true;
  }
}

/**
 * Send order status email with custom message
 */
export async function sendOrderStatusEmail(input: {
  to: string;
  userName: string;
  orderNumber: string;
  orderId: string;
  confirmationCode?: string;
  status: string;
  message: string;
}) {
  const transporter = createTransporter();

  const statusEmojis: Record<string, string> = {
    in_store: '📦',
    on_the_way: '🚚',
    delivered: '✅',
    processing: '⏳',
    completed: '✅',
  };

  const emoji = statusEmojis[input.status] || '📦';

  const confirmationCodeHtml = input.confirmationCode
    ? `
      <div style="background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #92400E; font-weight: 600; font-size: 14px;">📋 Confirmation Code</p>
        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #78350F; letter-spacing: 0.2em; font-family: monospace;">${input.confirmationCode}</p>
        <p style="margin: 8px 0 0 0; color: #92400E; font-size: 12px;">Share this code with your delivery rider</p>
      </div>
    `
    : '';

  const confirmationCodeText = input.confirmationCode
    ? `\n\nCONFIRMATION CODE: ${input.confirmationCode}\nShare this code with your delivery rider.\n`
    : '';

  const emailContent = {
    from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: input.to,
    subject: `${emoji} Order #${input.orderNumber} Update`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} Order Update</h1>
          </div>
          <div class="content">
            <p>Hi ${input.userName},</p>
            ${confirmationCodeHtml}
            <div class="message-box">
              <h2>Order #${input.orderNumber}</h2>
              <p>${input.message}</p>
            </div>
            <p style="text-align: center;">
              <a href="${getBaseUrl()}/orders/${input.orderId}" class="button">View Order Details</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${input.userName},\n\nOrder #${input.orderNumber} Update:\n${input.message}${confirmationCodeText}\n\nView your order at: ${getBaseUrl()}/orders`,
  };

  if (transporter) {
    try {
      await transporter.sendMail(emailContent);
      console.log(`✅ Order status email sent to ${input.to}`);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw error;
    }
  }

  // Fallback to console
  console.log('='.repeat(80));
  console.log(`📧 ORDER STATUS EMAIL - ${emoji}`);
  console.log('='.repeat(80));
  console.log(`To: ${input.to}`);
  console.log(`Order: #${input.orderNumber}`);
  if (input.confirmationCode) {
    console.log(`Confirmation Code: ${input.confirmationCode}`);
  }
  console.log(`Message: ${input.message}`);
  console.log('='.repeat(80));

  return true;
}
