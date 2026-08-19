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
   * Generate verification token (crypto string)
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a 6-digit numeric OTP
   */
  static generateNumericOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async createVerificationToken(userId: string, email: string, type: 'email_verification' | 'email_change' | 'email_change_auth' = 'email_verification') {
    await connectDB();

    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    // Delete any existing verification tokens of this type for this user
    await VerificationToken.deleteMany({
      userId,
      type,
    });

    // Create new token
    await VerificationToken.create({
      userId,
      email,
      token,
      type,
      expiresAt,
    });

    return token;
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(email: string, token: string) {
    const baseUrl = await getBaseUrl();
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
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
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
   * Send email change verification email
   */
  static async sendEmailChangeVerification(email: string, token: string) {
    const baseUrl = await getBaseUrl();
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    const transporter = createTransporter();

    const emailContent = {
      from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your New Email - Gpowerpay',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Change Request 📧</h1>
            </div>
            <div class="content">
              <p>You have requested to change your email address for your Gpowerpay account.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify New Email</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
              <p><strong>This link expires in 24 hours.</strong></p>
              <p>If you didn't request this change, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Email Change Request\n\nPlease verify your new email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.`,
    };

    if (transporter) {
      try {
        await transporter.sendMail(emailContent);
        console.log(`✅ Email change verification sent to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Email send failed:', error);
      }
    }

    // Fallback to console
    console.log('='.repeat(80));
    console.log('📧 EMAIL CHANGE VERIFICATION');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`\nVerification Link:\n${verificationUrl}`);
    console.log('='.repeat(80));

    return true;
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, token: string, type?: string) {
    const baseUrl = await getBaseUrl();
    const typeParam = type ? `&type=${type}` : '';
    const resetUrl = `${baseUrl}/reset-password?token=${token}${typeParam}`;
    const transporter = createTransporter();

    const emailContent = {
      from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password - Gpowerpay',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request 🔑</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your password for your Gpowerpay account.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Password Reset Request\n\nPlease reset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.`,
    };

    // If SMTP is configured, send real email
    if (transporter) {
      try {
        await transporter.sendMail(emailContent);
        console.log(`✅ Password reset email sent to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Email send failed:', error);
      }
    }

    // Fallback: Log to console (for development)
    console.log('='.repeat(80));
    console.log('📧 PASSWORD RESET EMAIL');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: ${emailContent.subject}`);
    console.log(`\nReset Link:\n${resetUrl}`);
    console.log('\nThis link expires in 1 hour.');
    console.log('='.repeat(80));

    return true;
  }

  /**
   * Verify email token (for both new signups and email changes)
   */
  static async verifyEmail(token: string) {
    await connectDB();

    // Find token
    const verificationToken = await VerificationToken.findOne({
      token,
      type: { $in: ['email_verification', 'email_change'] },
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

    if (verificationToken.type === 'email_change') {
      if (!user.pendingEmail) {
        throw new Error('No pending email change found for this account');
      }
      
      const { default: EmailHistory } = await import('@/models/EmailHistory');
      await EmailHistory.create({
        userId: user._id,
        oldEmail: user.email,
        newEmail: user.pendingEmail,
        changedBy: 'user'
      });

      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
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
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
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
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
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

  /**
   * Send 6-digit OTP for email change authorization to current email
   */
  static async sendEmailChangeAuthOTP(email: string, otp: string) {
    const transporter = createTransporter();

    const emailContent = {
      from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Security Code to Change Email - Gpowerpay',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
        </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Security Code 🔐</h1>
            </div>
            <div class="content">
              <p>You requested to change the email address associated with your Gpowerpay account.</p>
              <p>Please enter the following 6-digit code to authorize this change:</p>
              <div class="otp-box">${otp}</div>
              <p><strong>This code expires in 15 minutes.</strong></p>
              <p>If you did not request this, please secure your account immediately.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Security Code Request\n\nYour 6-digit code to change your email is: ${otp}\n\nThis code expires in 15 minutes.`,
    };

    if (transporter) {
      try {
        await transporter.sendMail(emailContent);
        console.log(`✅ Security OTP sent to ${email}`);
        return true;
      } catch (error) {
        console.error('❌ Email send failed:', error);
      }
    }

    // Fallback to console
    console.log('='.repeat(80));
    console.log('🔐 SECURITY OTP FOR EMAIL CHANGE');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`\nOTP Code: ${otp}`);
    console.log('='.repeat(80));

    return true;
  }

  /**
   * Verify numeric OTP token
   */
  static async verifyNumericOTP(userId: string, otp: string, type: 'email_change_auth') {
    await connectDB();
    const verificationToken = await VerificationToken.findOne({
      userId,
      token: otp,
      type
    });

    if (!verificationToken) {
      throw new Error('Invalid verification code');
    }

    if (verificationToken.expiresAt < new Date()) {
      await VerificationToken.deleteOne({ _id: verificationToken._id });
      throw new Error('Verification code has expired');
    }

    // Delete token so it can't be used again
    await VerificationToken.deleteOne({ _id: verificationToken._id });
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
  actionPath?: string;
  actionText?: string;
}) {
  const transporter = createTransporter();
  const baseUrl = await getBaseUrl();

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

  const linkUrl = input.actionPath ? `${baseUrl}${input.actionPath}` : `${baseUrl}/orders/${input.orderId}`;
  const linkText = input.actionText || 'View Order Details';

  const emailContent = {
    from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: input.to,
    subject: `${emoji} Order #${input.orderNumber} Update`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
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
              <a href="${linkUrl}" class="button">${linkText}</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${input.userName},\n\nOrder #${input.orderNumber} Update:\n${input.message}${confirmationCodeText}\n\n${linkText}: ${linkUrl}`,
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

/**
 * Send low stock alert email to admins
 */
export async function sendLowStockAlertEmail(emails: string[], productName: string, currentStock: number) {
  const transporter = createTransporter();
  const baseUrl = await getBaseUrl();

  const emailContent = {
    from: `Gpowerpay <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: emails.join(', '),
    subject: `⚠️ Low Stock Alert: ${productName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #2563eb; color: #ffffff; padding: 32px 40px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; color: #ffffff !important; }
          .content { padding: 40px; background: #ffffff; }
          .message-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 16px; margin: 24px 0; text-align: center; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.2s; }
          .footer { text-align: center; padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .order-details { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .order-details th, .order-details td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .order-details th { font-weight: 600; color: #4b5563; background-color: #f8fafc; }
          .total-row { font-weight: bold; font-size: 18px; color: #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <p>Admin Alert,</p>
            <div class="alert-box">
              <h2>${productName}</h2>
              <p>Current Stock Level: <strong>${currentStock}</strong></p>
            </div>
            <p>Please restock this item soon to avoid running out of inventory.</p>
            <p style="text-align: center;">
              <a href="${baseUrl}/admin/products" class="button">Manage Inventory</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Gpowerpay. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Admin Alert:\n\nLow Stock for ${productName}.\nCurrent stock: ${currentStock}.\n\nPlease restock soon.`,
  };

  if (transporter) {
    try {
      await transporter.sendMail(emailContent);
      console.log(`✅ Low stock alert email sent to ${emails.length} admins`);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      throw error;
    }
  }

  // Fallback to console
  console.log('='.repeat(80));
  console.log('📧 LOW STOCK ALERT EMAIL');
  console.log('='.repeat(80));
  console.log(`To: ${emails.join(', ')}`);
  console.log(`Product: ${productName} - Stock: ${currentStock}`);
  console.log('='.repeat(80));

  return true;
}
