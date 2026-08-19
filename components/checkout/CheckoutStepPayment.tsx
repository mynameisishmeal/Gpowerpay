'use client';

import { useState, useEffect } from 'react';
import { Wallet, CreditCard, DollarSign, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliveryInfo, PaymentMethod } from '@/src/app/checkout/page';
import { useSession } from 'next-auth/react';
import { PaystackService } from '@/lib/paystack';
import { FundWalletButton } from '@/components/wallet/FundWalletButton';
import toast from 'react-hot-toast';

interface CheckoutStepPaymentProps {
  total: number;
  deliveryInfo: DeliveryInfo;
  onBack: () => void;
  onComplete: (payment: PaymentMethod) => void;
  processing?: boolean;
}

export function CheckoutStepPayment({
  total,
  deliveryInfo,
  onBack,
  onComplete,
  processing: externalProcessing = false,
}: CheckoutStepPaymentProps) {
  const { data: session } = useSession();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [paymentType, setPaymentType] = useState<'wallet' | 'paystack' | 'split' | null>(null);
  const [isInternalProcessing, setIsInternalProcessing] = useState(false);
  const [fundingWallet, setFundingWallet] = useState(false);

  const processingState = externalProcessing || isInternalProcessing;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchWalletBalance();
    }
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet/balance');
      const data = await response.json();
      if (data.success) {
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const hasSufficientBalance = walletBalance >= total;
  const deficit = total - walletBalance;

  const handlePayment = async () => {
    if (!paymentType || !session?.user?.email) return;

    try {
      const paymentMethod: PaymentMethod = { type: paymentType };

      // WALLET ONLY: No Paystack needed, create order directly
      if (paymentType === 'wallet') {
        setIsInternalProcessing(true);
        await onComplete(paymentMethod);
        setIsInternalProcessing(false);
        return;
      }

      // PAYSTACK or SPLIT: Open Paystack popup FIRST
      const amountToPay = paymentType === 'split' ? deficit : total;
      const reference = PaystackService.generateReference('GPJ');

      if (paymentType === 'split') {
        paymentMethod.walletAmount = walletBalance;
        paymentMethod.paystackAmount = deficit;
      }

      PaystackService.initializePayment({
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: session.user.email,
        amount: PaystackService.toKobo(amountToPay),
        reference,
        metadata: {
          customerId: session.user.id,
          customerName: session.user.name,
          paymentType,
        },
        onSuccess: async (response: any) => {
          console.log('✅ Paystack payment successful:', response);
          toast.success('Payment successful! Verifying...');
          
          paymentMethod.paymentReference = response.reference;

          setIsInternalProcessing(true);
          await onComplete(paymentMethod);
          setIsInternalProcessing(false);
        },
        onCancel: () => {
          console.log('❌ Payment cancelled');
          toast.error('Payment cancelled');
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsInternalProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Balance Display */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-blue-600" />
              <span className="font-medium text-gray-900">Your Wallet Balance</span>
            </div>
            {loadingBalance ? (
              <Loader2 size={20} className="animate-spin text-blue-600" />
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {formatPrice(walletBalance)}
              </span>
            )}
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Choose Payment Method</label>

          {/* Option 1: Pay from Wallet */}
          <div
            role="button"
            tabIndex={(!hasSufficientBalance || loadingBalance) ? -1 : 0}
            onClick={() => {
              if (!hasSufficientBalance || loadingBalance) return;
              setPaymentType('wallet');
            }}
            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
              paymentType === 'wallet'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${(!hasSufficientBalance || loadingBalance) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet
                  size={24}
                  className={paymentType === 'wallet' ? 'text-blue-600' : 'text-gray-400'}
                />
                <div>
                  <p className="font-semibold text-gray-900">Pay from Wallet</p>
                  <p className="text-sm text-gray-500">
                    {hasSufficientBalance
                      ? `Balance after: ${formatPrice(walletBalance - total)}`
                      : `Insufficient balance (short by ${formatPrice(deficit)})`}
                  </p>
                </div>
              </div>
              {hasSufficientBalance ? (
                <span className="text-green-600 font-medium text-sm">Available</span>
              ) : (
                <div onClick={(e) => e.stopPropagation()} className="cursor-default pointer-events-auto">
                  <FundWalletButton onSuccess={fetchWalletBalance} />
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Pay with Card (Paystack) */}
          <div
            role="button"
            tabIndex={loadingBalance ? -1 : 0}
            onClick={() => {
              if (loadingBalance) return;
              setPaymentType('paystack');
            }}
            className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
              paymentType === 'paystack'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${loadingBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <CreditCard
                size={24}
                className={paymentType === 'paystack' ? 'text-blue-600' : 'text-gray-400'}
              />
              <div>
                <p className="font-semibold text-gray-900">Pay with Card/Bank</p>
                <p className="text-sm text-gray-500">Powered by Paystack</p>
              </div>
            </div>
          </div>

          {/* Option 3: Split Payment */}
          {!hasSufficientBalance && walletBalance > 0 && (
            <div
              role="button"
              tabIndex={loadingBalance ? -1 : 0}
              onClick={() => {
                if (loadingBalance) return;
                setPaymentType('split');
              }}
              className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                paymentType === 'split'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${loadingBalance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <DollarSign
                  size={24}
                  className={paymentType === 'split' ? 'text-blue-600' : 'text-gray-400'}
                />
                <div>
                  <p className="font-semibold text-gray-900">Split Payment</p>
                  <p className="text-sm text-gray-500">
                    Wallet: {formatPrice(walletBalance)} + Card: {formatPrice(deficit)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Breakdown</h4>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Order Total:</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
          {paymentType === 'wallet' && hasSufficientBalance && (
            <div className="flex justify-between text-sm text-green-600">
              <span>From Wallet:</span>
              <span className="font-bold">-{formatPrice(total)}</span>
            </div>
          )}
          {paymentType === 'split' && (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>From Wallet:</span>
                <span className="font-medium">-{formatPrice(walletBalance)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>From Card:</span>
                <span className="font-medium">-{formatPrice(deficit)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!paymentType || processingState}
            className="flex-1 btn-modern bg-green-600 hover:bg-green-700"
          >
            {processingState ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              'Complete Payment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
