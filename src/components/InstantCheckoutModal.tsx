import React, { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, BookOpen, ArrowRight, Download, Loader2, AlertCircle } from 'lucide-react';
import { EBook, CurrencyCode, Order } from '../types';
import { formatPrice, initiatePayment, verifyPayment, getCurrentUser, downloadEbook, getPlatformConfig } from '../services/storage';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        metadata?: Record<string, unknown>;
        callback: (response: { reference: string; status: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

interface InstantCheckoutModalProps {
  book: EBook;
  currency: CurrencyCode;
  onClose: () => void;
  onSuccess: (order: Order) => void;
  onOpenReader: (book: EBook) => void;
}

export const InstantCheckoutModal: React.FC<InstantCheckoutModalProps> = ({
  book,
  currency,
  onClose,
  onSuccess,
  onOpenReader,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [complete, setComplete] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paystackReady, setPaystackReady] = useState(false);

  const user = getCurrentUser();
  const finalEmail = user?.email || email;
  const config = getPlatformConfig();

  // Load Paystack Inline JS
  useEffect(() => {
    if (window.PaystackPop) {
      setPaystackReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => setPaystackReady(true);
    script.onerror = () => {
      console.warn('Paystack JS failed to load — will use sandbox fallback');
      setPaystackReady(true); // Allow sandbox mode
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Calculate amounts in NGN
  const rate = 1500; // NGN/USD rate (should come from config)
  const grossAmountNgn = book.priceUSD * rate;
  const commissionNgn = grossAmountNgn * (config.commissionPercent / 100);
  const sellerNetNgn = grossAmountNgn - commissionNgn;

  const handleCheckout = useCallback(async () => {
    if (!finalEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize payment on backend
      const initResult = await initiatePayment({
        bookId: book.id,
        email: finalEmail,
        currency: 'NGN',
      });

      if (!initResult.success) {
        setError(initResult.message || 'Payment initialization failed.');
        setLoading(false);
        return;
      }

      // Sandbox mode: skip Paystack popup
      if (initResult.sandbox || !initResult.authorization_url) {
        setVerifying(true);
        const verifyResult = await verifyPayment(initResult.reference!);
        if (verifyResult.success && verifyResult.order) {
          setOrder(verifyResult.order);
          setComplete(true);
          onSuccess(verifyResult.order);
        } else {
          setError(verifyResult.message || 'Payment verification failed.');
        }
        setLoading(false);
        setVerifying(false);
        return;
      }

      // Live mode: open Paystack popup
      if (window.PaystackPop && initResult.access_code) {
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
          email: finalEmail,
          amount: grossAmountNgn * 100, // kobo
          currency: 'NGN',
          ref: initResult.reference,
          metadata: {
            orderId: initResult.order?.id,
            bookTitle: book.title,
            sellerName: book.authorName,
          },
          callback: async (response) => {
            setVerifying(true);
            try {
              const verifyResult = await verifyPayment(response.reference);
              if (verifyResult.success && verifyResult.order) {
                setOrder(verifyResult.order);
                setComplete(true);
                onSuccess(verifyResult.order);
              } else {
                setError(verifyResult.message || 'Payment verification failed. Check your email for confirmation.');
              }
            } catch {
              setError('Verification failed. Your payment may still be processing — check your email.');
            }
            setLoading(false);
            setVerifying(false);
          },
          onClose: () => {
            setLoading(false);
            setError('Payment cancelled.');
          },
        });
        handler.openIframe();
      } else {
        setError('Payment gateway not available. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }, [finalEmail, book, grossAmountNgn, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 sm:rounded-2xl shadow-2xl overflow-hidden text-neutral-100 rounded-t-2xl sm:rounded-2xl">
        {!complete ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-neutral-900 p-6 border-b border-neutral-800 relative">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-serif">Checkout</h2>
                  <p className="text-xs text-neutral-400">Secure payment powered by Paystack</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Book Summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/40">
                <img src={book.coverImage} alt="" className="w-12 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{book.title}</p>
                  <p className="text-[10px] text-neutral-400">by {book.authorName}</p>
                </div>
                <span className="text-sm font-bold text-white">{formatPrice(book.priceUSD, currency)}</span>
              </div>

              {/* Email (if not signed in) */}
              {!user && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Your download link will be sent to this email.</p>
                </div>
              )}

              {user && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300">
                  Paying as <strong>{user.email}</strong>
                </div>
              )}

              {/* Payment Breakdown */}
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/40 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Book Price</span>
                  <span className="text-white">₦{grossAmountNgn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Platform Fee ({config.commissionPercent}%)</span>
                  <span className="text-amber-400">₦{commissionNgn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Seller receives</span>
                  <span>₦{sellerNetNgn.toLocaleString()}</span>
                </div>
                <div className="border-t border-neutral-800/60 pt-2 flex justify-between text-xs font-bold">
                  <span className="text-white">You Pay</span>
                  <span className="text-white">₦{grossAmountNgn.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>256-bit encrypted • Secure checkout via Paystack</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || verifying || (!user && !email.trim())}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading || verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{verifying ? 'Verifying payment...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₦{grossAmountNgn.toLocaleString()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white font-serif mb-2">Payment Confirmed!</h3>
            <p className="text-xs text-neutral-400 mb-2">
              Your payment of ₦{grossAmountNgn.toLocaleString()} has been verified.
            </p>
            <p className="text-[10px] text-neutral-500 mb-6">
              {order?.buyerEmail && `A download link has been sent to ${order.buyerEmail}. `}
              You now have full access to this e-book.
            </p>
            <div className="flex flex-col gap-2">
              {book.ebookFileUrl && (
                <button
                  onClick={() => downloadEbook(book)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download E-Book
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenReader(book)}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> Read Now
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
