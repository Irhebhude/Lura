import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';
import { EBook, CurrencyCode, Order } from '../types';
import { formatPrice, saveOrder, getCurrentUser } from '../services/storage';

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
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const user = getCurrentUser();
  const finalEmail = user?.email || email;
  const finalName = user?.name || name;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalEmail.trim()) return;
    setLoading(true);

    setTimeout(() => {
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        bookId: book.id,
        bookTitle: book.title,
        bookCover: book.coverImage,
        authorName: book.authorName,
        buyerEmail: finalEmail,
        buyerName: finalName || 'Customer',
        amountPaid: book.priceUSD,
        currency,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Card (Demo)',
        downloadToken: `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        status: 'completed',
      };

      saveOrder(newOrder);
      setOrder(newOrder);
      setComplete(true);
      setLoading(false);

      onSuccess(newOrder);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
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
                  <p className="text-xs text-neutral-400">Instant encrypted payment</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-4">
              {/* Book Summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/40">
                <img src={book.coverImage} alt="" className="w-12 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{book.title}</p>
                  <p className="text-[10px] text-neutral-400">{book.authorName}</p>
                </div>
                <span className="text-sm font-bold text-white">{formatPrice(book.priceUSD, currency)}</span>
              </div>

              {!user && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
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
                    <p className="text-[10px] text-neutral-500 mt-1">Download link will be sent to this email.</p>
                  </div>
                </>
              )}

              {user && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300">
                  Signing in as <strong>{user.email}</strong>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/40 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Book Price</span>
                  <span className="text-white">{formatPrice(book.priceUSD, currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Processing Fee</span>
                  <span className="text-emerald-400">$0.00</span>
                </div>
                <div className="border-t border-neutral-800/60 pt-2 flex justify-between text-xs font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-white">{formatPrice(book.priceUSD, currency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>256-bit encrypted • Secure checkout • Demo mode</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <>
                    <span>Complete Purchase — {formatPrice(book.priceUSD, currency)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white font-serif mb-2">Purchase Complete!</h3>
            <p className="text-xs text-neutral-400 mb-6">
              {order?.buyerEmail && `A download link has been sent to ${order.buyerEmail}. `}
              You can start reading immediately.
            </p>
            <div className="flex gap-3">
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
        )}
      </div>
    </div>
  );
};
