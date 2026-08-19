'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PaystackService } from '@/lib/paystack';
import { useAlert } from '@/lib/hooks/useAlert';

/**
 * Fund Wallet Button with Paystack Integration
 */

export function FundWalletButton({ onSuccess }: { onSuccess?: () => void }) {
  const { data: session } = useSession();
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFundWallet = () => {
    if (!session?.user?.email) {
      showAlert({
        type: 'error',
        message: 'Please log in to fund your wallet',
      });
      return;
    }

    const amountInNaira = parseFloat(amount);

    if (!amountInNaira || amountInNaira < 1000) {
      showAlert({
        type: 'warning',
        message: 'Minimum funding amount is ₦1,000',
      });
      return;
    }

    if (amountInNaira > 5000000) {
      showAlert({
        type: 'warning',
        message: 'Maximum funding amount is ₦5,000,000',
      });
      return;
    }

    setLoading(true);

    const reference = PaystackService.generateReference('FUND');

    // Close dialog BEFORE opening Paystack popup to avoid overlay blocking
    setOpen(false);

    // Small delay to ensure dialog closes before Paystack opens
    setTimeout(() => {
      PaystackService.initializePayment({
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: session.user?.email || '',
        amount: PaystackService.toKobo(amountInNaira),
        reference,
        metadata: {
          userId: session.user?.id || '',
          type: 'wallet_funding',
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: session.user?.name || 'Customer',
            },
          ],
        },
        onSuccess: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: response.reference,
                type: 'wallet_funding',
              }),
            });

            const data = await verifyResponse.json();

            if (data.success) {
              showAlert({
                type: 'success',
                message: 'Wallet funded successfully!',
              });
              setAmount('');
              if (onSuccess) onSuccess();
            } else {
              showAlert({
                type: 'error',
                message: 'Payment verification failed',
              });
            }
          } catch (error) {
            console.error('Verification error:', error);
            showAlert({
              type: 'error',
              message: 'An error occurred. Please contact support.',
            });
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
          showAlert({
            type: 'info',
            message: 'Payment cancelled',
          });
        },
      });
    }, 300); // 300ms delay for smooth dialog close animation
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-modern bg-green-600 hover:bg-green-700">
          <Wallet size={20} className="mr-2" />
          Fund Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Your Wallet</DialogTitle>
          <DialogDescription>
            Add money to your wallet using card, bank transfer, or USSD.
            Minimum: ₦1,000, Maximum: ₦5,000,000
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₦)
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1000}
              max={5000000}
              step={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              You will be charged ₦{amount || '0'}
            </p>
          </div>

          <Button
            onClick={handleFundWallet}
            disabled={!amount || loading}
            className="w-full btn-modern bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet size={20} className="mr-2" />
                Proceed to Payment
              </>
            )}
          </Button>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Payment methods available:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Card (Visa, Mastercard, Verve)</li>
              <li>• Bank Transfer</li>
              <li>• USSD</li>
              <li>• Mobile Money</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
