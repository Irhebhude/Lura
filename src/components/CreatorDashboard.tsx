import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, DollarSign, BookOpen, Eye, ShoppingCart, PlusCircle,
  Globe, Wallet, BarChart3, Building2, CheckCircle2, AlertCircle, Pencil,
  ArrowDownRight, ArrowUpRight, Clock, XCircle, RefreshCw, Loader2, CreditCard,
} from 'lucide-react';
import { EBook, CurrencyCode, LedgerEntry } from '../types';
import {
  formatPrice, getAuthor, getOrders, getWithdrawals, requestWithdrawal,
  updateBankDetails, verifyBankAccount, getWalletInfo,
  getLedger, getPlatformConfig, fetchBanksForCurrency, BankOption,
} from '../services/storage';
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
  const withdrawals = useMemo(() => getWithdrawals(), [books]);
  const platformConfig = useMemo(() => getPlatformConfig(), []);
  const [wallet, setWallet] = useState<ReturnType<typeof getWalletInfo> extends Promise<infer T> ? T : never>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [showLedger, setShowLedger] = useState(false);

  // Bank form state
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankCurrency, setBankCurrency] = useState<CurrencyCode>(author.bankDetails?.currency as CurrencyCode || currency || 'NGN');
  const [bankList, setBankList] = useState<BankOption[]>([]);
  const [bankForm, setBankForm] = useState({
    bankName: author.bankDetails?.bankName || '',
    accountNumber: author.bankDetails?.accountNumber || '',
    accountName: author.bankDetails?.accountName || author.name || '',
    bankCode: author.bankDetails?.bankCode || '',
  });
  const [bankMsg, setBankMsg] = useState<string | null>(null);
  const [bankVerifying, setBankVerifying] = useState(false);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const loadWallet = useCallback(async () => {
    const w = await getWalletInfo();
    if (w) setWallet(w);
  }, []);

  const loadLedger = useCallback(async () => {
    const l = await getLedger({ limit: 30 });
    setLedger(l);
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet, books]);

  const totalSales = wallet?.totalSales || author.totalSales || 0;
  const totalEarningsNgn = wallet?.totalEarningsNgn || 0;
  const availableBalanceNgn = wallet?.availableBalanceNgn || 0;
  const totalCommissionPaidNgn = wallet?.totalCommissionPaidNgn || 0;
  const totalWithdrawnNgn = wallet?.totalWithdrawnNgn || 0;
  const totalWithdrawalFeesNgn = wallet?.totalWithdrawalFeesNgn || 0;
  const creatorBooks = books.filter((b) => b.authorId === author.id);
  const recentOrders = orders.slice(0, 5);

  // Load banks when currency changes or bank form opens
  useEffect(() => {
    if (showBankForm && bankCurrency) {
      fetchBanksForCurrency(bankCurrency).then(banks => setBankList(banks));
    }
  }, [showBankForm, bankCurrency]);

  // Bank verification via Paystack
  const handleVerifyBank = async () => {
    if (!bankForm.accountNumber || !bankForm.bankCode) {
      setBankMsg('Please select a bank and enter your account number.');
      return;
    }
    if (bankForm.accountNumber.length < 8) {
      setBankMsg('Account number must be at least 8 digits.');
      return;
    }

    setBankVerifying(true);
    setBankMsg(null);

    const result = await verifyBankAccount(bankForm.accountNumber, bankForm.bankCode, bankCurrency);

    if (result.success && result.accountName) {
      setBankForm(prev => ({
        ...prev,
        accountName: result.accountName!,
      }));
      setBankMsg(`✓ Account verified: ${result.accountName}`);
    } else {
      setBankMsg(result.message || 'Could not verify account. Please check your details.');
    }
    setBankVerifying(false);
  };

  const handleSaveBankDetails = () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      setBankMsg('Please verify your account first to confirm the account name.');
      return;
    }
    updateBankDetails({
      bankName: bankForm.bankName,
      accountNumber: bankForm.accountNumber,
      accountName: bankForm.accountName,
      bankCode: bankForm.bankCode,
      currency: bankCurrency,
      verified: true,
      verifiedAt: new Date().toISOString(),
    });
    setBankMsg('Bank details saved successfully!');
    setShowBankForm(false);
  };

  // Withdrawal with confirmation
  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawMsg('Enter a valid amount.');
      return;
    }
    const minWithdraw = platformConfig.minWithdrawal * (CURRENCIES[currency]?.rate || 1);
    const maxWithdraw = platformConfig.maxWithdrawal * (CURRENCIES[currency]?.rate || 1);
    if (amt < minWithdraw) {
      setWithdrawMsg(`Minimum withdrawal is ${formatPrice(platformConfig.minWithdrawal, currency)}.`);
      return;
    }
    if (amt > maxWithdraw) {
      setWithdrawMsg(`Maximum withdrawal is ${formatPrice(platformConfig.maxWithdrawal, currency)}.`);
      return;
    }
    if (amt > availableBalanceNgn) {
      setWithdrawMsg('Insufficient balance.');
      return;
    }
    setShowWithdrawConfirm(true);
  };

  const handleConfirmWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawMsg(null);
    const amt = parseFloat(withdrawAmount);
    const result = await requestWithdrawal(amt, currency);
    setWithdrawMsg(result.message);
    if (result.success) {
      setWithdrawAmount('');
      setShowWithdrawConfirm(false);
      loadWallet();
      loadLedger();
    }
    setWithdrawing(false);
  };

  const getLedgerIcon = (type: LedgerEntry['type']) => {
    switch (type) {
      case 'sale_credit': return <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />;
      case 'commission_debit': return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
      case 'withdrawal': return <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />;
      case 'withdrawal_fee': return <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />;
      case 'refund': return <RefreshCw className="w-3.5 h-3.5 text-orange-400" />;
      default: return <DollarSign className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  const getStatusBadge = (status: LedgerEntry['status'] | string) => {
    switch (status) {
      case 'completed': return <span className="text-emerald-400">✓</span>;
      case 'pending': return <Clock className="w-3 h-3 text-amber-400" />;
      case 'processing': return <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />;
      case 'failed': return <XCircle className="w-3 h-3 text-rose-400" />;
      case 'reversed': return <RefreshCw className="w-3 h-3 text-orange-400" />;
      default: return null;
    }
  };

  const withdrawalFee = platformConfig.withdrawalFee;
  const withdrawAmountNgn = parseFloat(withdrawAmount) || 0;
  const withdrawNetNgn = withdrawAmountNgn - withdrawalFee;

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
          { label: `Total Earnings (${currency})`, value: formatPrice(totalEarningsNgn / (CURRENCIES[currency]?.rate || 1), currency), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Published Books', value: creatorBooks.length.toString(), icon: BookOpen, color: 'text-purple-400' },
          { label: `Available Balance (${currency})`, value: formatPrice(availableBalanceNgn / (CURRENCIES[currency]?.rate || 1), currency), icon: Wallet, color: 'text-amber-400' },
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

      {/* Commission & Fees Info */}
      <div className="mb-6 p-3 rounded-xl bg-neutral-900 border border-neutral-800/60 flex flex-wrap gap-4 text-[11px] text-neutral-400">
        <span>Platform commission: <strong className="text-white">{platformConfig.commissionPercent}%</strong></span>
        <span>•</span>
        <span>Withdrawal fee: <strong className="text-white">{formatPrice(platformConfig.withdrawalFee, currency)}</strong></span>
        <span>•</span>
        <span>Total commission paid: <strong className="text-amber-400">{formatPrice(totalCommissionPaidNgn / (CURRENCIES[currency]?.rate || 1), currency)}</strong></span>
        <span>•</span>
        <span>Total withdrawn: <strong className="text-indigo-400">{formatPrice(totalWithdrawnNgn / (CURRENCIES[currency]?.rate || 1), currency)}</strong></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdraw Panel */}
        <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-amber-400" /> Wallet & Withdraw
          </h3>
          <div className="bg-neutral-950 rounded-xl p-4 mb-4 border border-neutral-800/40">
            <p className="text-[11px] text-neutral-400 mb-1">Available Balance ({currency})</p>
            <p className="text-2xl font-bold text-white">{formatPrice(availableBalanceNgn / (CURRENCIES[currency]?.rate || 1), currency)}</p>
            <p className="text-[10px] text-neutral-500 mt-1">{platformConfig.commissionPercent}% commission • Payouts in {currency}</p>
          </div>

          {/* Bank Details Section */}
          {!author.bankDetails?.accountNumber && !showBankForm && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-300">Add bank details to withdraw</p>
                  <p className="text-[10px] text-amber-400/70 mt-0.5">You need to verify your bank account before withdrawing.</p>
                </div>
              </div>
              <button
                onClick={() => setShowBankForm(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors"
              >
                Add Bank Details
              </button>
            </div>
          )}

          {author.bankDetails?.accountNumber && !showBankForm && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-[11px] font-medium text-emerald-300">{author.bankDetails.bankName}</p>
                    <p className="text-[10px] text-emerald-400/70">••••{author.bankDetails.accountNumber.slice(-4)} • {author.bankDetails.accountName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBankForm(true)}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                  title="Edit bank details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {showBankForm && (
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/40 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Bank Details
                </p>
                <button
                  onClick={() => { setShowBankForm(false); setBankMsg(null); }}
                  className="text-[11px] text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Payout Currency *</label>
                <select
                  value={bankCurrency}
                  onChange={(e) => {
                    setBankCurrency(e.target.value as CurrencyCode);
                    setBankForm({ ...bankForm, bankName: '', bankCode: '' });
                    setBankMsg(null);
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {Object.entries(CURRENCIES).map(([code, cfg]) => (
                    <option key={code} value={code} className="bg-neutral-900">{cfg.symbol} {code} — {cfg.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Bank *</label>
                <select
                  value={bankForm.bankName}
                  onChange={(e) => {
                    const selected = bankList.find(b => b.name === e.target.value);
                    setBankForm({ ...bankForm, bankName: e.target.value, bankCode: selected?.code || '' });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="" className="bg-neutral-900">Select your bank</option>
                  {bankList.map(b => (
                    <option key={b.code} value={b.name} className="bg-neutral-900">{b.name}</option>
                  ))}
                </select>
                {bankList.length === 0 && bankCurrency && (
                  <p className="text-[9px] text-neutral-500 mt-1">Loading banks for {bankCurrency}...</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Account Number *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                    placeholder="0123456789"
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleVerifyBank}
                    disabled={bankVerifying || !bankForm.accountNumber || !bankForm.bankCode}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {bankVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">Account Name</label>
                <input
                  type="text"
                  value={bankForm.accountName}
                  readOnly={!!bankMsg?.includes('✓')}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  placeholder="Auto-verified name"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveBankDetails}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Save Bank Details
              </button>

              {bankMsg && (
                <p className={`text-[11px] ${bankMsg.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{bankMsg}</p>
              )}
            </div>
          )}

          {/* Withdraw Form */}
          <div className="flex gap-2 mb-3">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Amount in ${currency}`}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleWithdraw}
              disabled={!author.bankDetails?.accountNumber}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Withdraw
            </button>
          </div>

          {withdrawMsg && (
            <p className={`text-[11px] mb-2 ${withdrawMsg.includes('success') || withdrawMsg.includes('initiated') ? 'text-emerald-400' : 'text-rose-400'}`}>{withdrawMsg}</p>
          )}

          {/* Recent Withdrawals */}
          {withdrawals.length > 0 && (
            <div className="mt-4 border-t border-neutral-800/60 pt-4">
              <p className="text-[11px] text-neutral-400 mb-2">Recent Withdrawals</p>
              {withdrawals.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-1.5 text-[11px]">
                  <span className="text-neutral-300">{CURRENCIES[w.currency]?.symbol || '$'}{w.amountLocal.toLocaleString()}</span>
                  <span className={`capitalize ${
                    w.status === 'successful' ? 'text-emerald-400' :
                    w.status === 'failed' ? 'text-rose-400' :
                    'text-amber-400'
                  }`}>{w.status}</span>
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

          {/* Ledger Toggle */}
          <button
            onClick={() => { setShowLedger(!showLedger); if (!showLedger) loadLedger(); }}
            className="w-full mt-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" /> {showLedger ? 'Hide' : 'View'} Ledger
          </button>

          {/* Ledger */}
          {showLedger && (
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
              {ledger.length === 0 ? (
                <p className="text-[10px] text-neutral-500">No transactions yet.</p>
              ) : (
                ledger.map((entry) => (
                  <div key={entry.id} className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {getLedgerIcon(entry.type)}
                        <span className="text-[10px] text-neutral-300 capitalize">{entry.type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(entry.status)}
                        <span className={`text-[11px] font-semibold ${entry.direction === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {entry.direction === 'credit' ? '+' : '-'}{CURRENCIES[entry.currency]?.symbol || '$'}{entry.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-neutral-500 mt-0.5 truncate">{entry.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-neutral-950/80 backdrop-blur-md">
          <div className="w-full sm:max-w-sm bg-neutral-900 border border-neutral-800 sm:rounded-2xl shadow-2xl p-6 rounded-t-2xl sm:rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4">Confirm Withdrawal</h3>

            <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/40 space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Withdrawal Amount</span>                  <span className="text-white font-semibold">{formatPrice(withdrawAmountNgn / (CURRENCIES[currency]?.rate || 1), currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Withdrawal Fee</span>
                <span className="text-rose-400">-{formatPrice(withdrawalFee, currency)}</span>
              </div>
              <div className="border-t border-neutral-800/60 pt-2 flex justify-between text-xs font-bold">
                <span className="text-white">You Will Receive</span>
                <span className="text-emerald-400">{formatPrice(withdrawNetNgn / (CURRENCIES[currency]?.rate || 1), currency)}</span>
              </div>
            </div>

            <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800/40 mb-4 text-[11px]">
              <p className="text-neutral-400">Destination:</p>
              <p className="text-white font-medium">{author.bankDetails?.bankName} ••••{author.bankDetails?.accountNumber?.slice(-4)}</p>
              <p className="text-neutral-400">{author.bankDetails?.accountName}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithdraw}
                disabled={withdrawing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {withdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
