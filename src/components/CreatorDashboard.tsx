import React, { useMemo } from 'react';
import {
  TrendingUp, DollarSign, BookOpen, Eye, ShoppingCart, PlusCircle,
  Globe, ArrowUpRight, Wallet, BarChart3, Users,
} from 'lucide-react';
import { EBook, CurrencyCode } from '../types';
import { formatPrice, getAuthor, getOrders, getWithdrawals, requestWithdrawal } from '../services/storage';
import { CURRENCIES } from '../data/initialData';

interface CreatorDashboardProps {
  books: EBook[];
  currency: CurrencyCode;
  onOpenPublish: () => void;
  onSelectBook: (book: EBook) => void;
  onOpenGoogleSeo: (book: EBook) => void;
  onViewAuthorStore: (handle: string) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  books,
  currency,
  onOpenPublish,
  onSelectBook,
  onOpenGoogleSeo,
  onViewAuthorStore,
}) => {
  const author = useMemo(() => getAuthor(), [books]);
  const orders = useMemo(() => getOrders(), [books]);
  const withdrawals = useMemo(() => getWithdrawals(), []);
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [withdrawMsg, setWithdrawMsg] = React.useState<string | null>(null);

  const totalSales = author.totalSales || 0;
  const totalRevenue = author.totalRevenueUSD || 0;
  const payoutBalance = author.payoutBalanceUSD || 0;
  const creatorBooks = books.filter((b) => b.authorId === author.id);
  const recentOrders = orders.slice(0, 5);

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawMsg('Enter a valid amount.');
      return;
    }
    const result = await requestWithdrawal(amt, currency);
    setWithdrawMsg(result.message);
    if (result.success) setWithdrawAmount('');
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Creator Studio</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage your books, track sales, and withdraw earnings.</p>
        </div>
        <button
          onClick={onOpenPublish}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Publish New Book
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sales', value: totalSales.toLocaleString(), icon: ShoppingCart, color: 'text-indigo-400' },
          { label: 'Total Revenue', value: formatPrice(totalRevenue, currency), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Published Books', value: creatorBooks.length.toString(), icon: BookOpen, color: 'text-purple-400' },
          { label: 'Payout Balance', value: formatPrice(payoutBalance, currency), icon: Wallet, color: 'text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-neutral-900 border border-neutral-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-[11px] text-neutral-400">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdraw Panel */}
        <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-amber-400" /> Wallet & Withdraw
          </h3>
          <div className="bg-neutral-950 rounded-xl p-4 mb-4 border border-neutral-800/40">
            <p className="text-[11px] text-neutral-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-white">{formatPrice(payoutBalance, currency)}</p>
            <p className="text-[10px] text-neutral-500 mt-1">95% creator payout rate • Instant processing</p>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount in USD"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleWithdraw}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              Withdraw
            </button>
          </div>
          {withdrawMsg && (
            <p className="text-[11px] text-emerald-400">{withdrawMsg}</p>
          )}

          {/* Recent Withdrawals */}
          {withdrawals.length > 0 && (
            <div className="mt-4 border-t border-neutral-800/60 pt-4">
              <p className="text-[11px] text-neutral-400 mb-2">Recent Withdrawals</p>
              {withdrawals.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-1.5 text-[11px]">
                  <span className="text-neutral-300">{CURRENCIES[w.currency]?.symbol}{w.amountLocal.toLocaleString()}</span>
                  <span className="text-emerald-400 capitalize">{w.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Books */}
        <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-purple-400" /> My Published Books
          </h3>
          {creatorBooks.length === 0 ? (
            <p className="text-xs text-neutral-500">No books published yet.</p>
          ) : (
            <div className="space-y-3">
              {creatorBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/40 hover:border-neutral-700 transition-colors cursor-pointer"
                  onClick={() => onSelectBook(book)}
                >
                  <img src={book.coverImage} alt={book.title} className="w-10 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{book.title}</p>
                    <p className="text-[10px] text-neutral-400">{book.salesCount} sales • {formatPrice(book.priceUSD, currency)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenGoogleSeo(book); }}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-colors"
                    title="View SEO"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Recent Orders
          </h3>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-neutral-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/40">
                  <img src={order.bookCover} alt="" className="w-8 h-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white truncate">{order.bookTitle}</p>
                    <p className="text-[10px] text-neutral-400">{order.buyerName} • {order.date}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">{formatPrice(order.amountPaid, currency)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onViewAuthorStore(author.handle)}
            className="w-full mt-4 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View Public Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
