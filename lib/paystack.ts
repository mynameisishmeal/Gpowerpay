/**
 * Paystack Integration
 * Handles payment initialization and verification
 */

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo (₦1 = 100 kobo)
  reference: string;
  currency?: string;
  metadata?: Record<string, any>;
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

export class PaystackService {
  private static publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
  private static secretKey = process.env.PAYSTACK_SECRET_KEY!;

  /**
   * Initialize Paystack payment (client-side)
   */
  static initializePayment(config: PaystackConfig) {
    if (typeof window === 'undefined') {
      throw new Error('Paystack can only be initialized on the client side');
    }

    // @ts-ignore - PaystackPop is loaded via script
    const handler = window.PaystackPop.setup({
      key: this.publicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency || 'NGN',
      ref: config.reference,
      metadata: config.metadata,
      callback: (response: any) => {
        if (config.onSuccess) {
          config.onSuccess(response);
        }
      },
      onClose: () => {
        if (config.onCancel) {
          config.onCancel();
        }
      },
    });

    handler.openIframe();
  }

  /**
   * Generate payment reference
   */
  static generateReference(prefix: string = 'PAY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Verify payment (server-side)
   */
  static async verifyPayment(reference: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      return data.data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }

  /**
   * Convert Naira to Kobo
   */
  static toKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  /**
   * Convert Kobo to Naira
   */
  static toNaira(kobo: number): number {
    return kobo / 100;
  }
}
