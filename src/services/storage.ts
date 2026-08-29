import { EBook, AuthorProfile, Order, Review, Coupon, CurrencyCode, WithdrawalRequest, BankDetails, UserAccount, LedgerEntry, PlatformConfig } from '../types';
import { INITIAL_EBOOKS, INITIAL_AUTHOR, INITIAL_REVIEWS, INITIAL_COUPONS, CURRENCIES } from '../data/initialData';

// ── Password Hashing ────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const SUPPORTED_BANKS = [
  { name: 'Access Bank', code: '044', type: 'NGN' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', type: 'NGN' },
  { name: 'Zenith Bank', code: '057', type: 'NGN' },
  { name: 'United Bank for Africa (UBA)', code: '033', type: 'NGN' },
  { name: 'First Bank of Nigeria', code: '011', type: 'NGN' },
  { name: 'Kuda Microfinance Bank', code: '50211', type: 'NGN' },
  { name: 'OPay Digital Services', code: '999992', type: 'NGN' },
  { name: 'Moniepoint MFB', code: '50515', type: 'NGN' },
  { name: 'PalmPay', code: '999991', type: 'NGN' },
  { name: 'Stanbic IBTC Bank', code: '221', type: 'NGN' },
  { name: 'Sterling Bank', code: '232', type: 'NGN' },
  { name: 'Fidelity Bank', code: '070', type: 'NGN' },
  { name: 'Union Bank of Nigeria', code: '032', type: 'NGN' },
  { name: 'Wema Bank / ALAT', code: '035', type: 'NGN' },
  { name: 'Providus Bank', code: '101', type: 'NGN' },
  { name: 'JPMorgan Chase (USD)', code: 'US_CHASE', type: 'USD' },
  { name: 'Bank of America (USD)', code: 'US_BOA', type: 'USD' },
  { name: 'Barclays Bank (GBP)', code: 'UK_BARCLAYS', type: 'GBP' },
  { name: 'Stripe Direct Creator Payout', code: 'STRIPE_GLOBAL', type: 'ALL' },
];

// ── In-memory cache ──────────────────────────────────────────────
interface Cache {
  books: EBook[];
  author: AuthorProfile;
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  library: string[];
  currency: CurrencyCode;
  withdrawals: WithdrawalRequest[];
  users: UserAccount[];
  currentUser: UserAccount | null;
  ledger: LedgerEntry[];
  config: PlatformConfig;
  webhookEvents: unknown[];
}

let _cache: Cache = {
  books: INITIAL_EBOOKS,
  author: INITIAL_AUTHOR,
  orders: [],
  reviews: INITIAL_REVIEWS,
  coupons: INITIAL_COUPONS,
  library: [],
  currency: 'USD',
  withdrawals: [],
  users: [],
  currentUser: null,
  ledger: [],
  config: { commissionPercent: 5, withdrawalFee: 50, minWithdrawal: 1000, maxWithdrawal: 500000, minEbookPrice: 500 },
  webhookEvents: [],
};

let _initialized = false;

// ── API helpers ──────────────────────────────────────────────────
const API = '/api';

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function fire(method: string, path: string, body?: unknown) {
  api(method, path, body).catch(() => {});
}

function dispatch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lura_storage_update'));
  }
}

// ── Initialization ───────────────────────────────────────────────
export async function initializeStorage(): Promise<void> {
  if (typeof window === 'undefined' || _initialized) return;
  try {
    const data = await api<Cache>('GET', '/init');
    _cache = data;
  } catch {
    console.warn('API unavailable, using default data');
  }
  _initialized = true;
}

// ── Books ────────────────────────────────────────────────────────
export function getEbooks(): EBook[] {
  return _cache.books;
}

export function saveEbook(book: EBook): EBook[] {
  const i = _cache.books.findIndex(b => b.id === book.id);
  if (i >= 0) _cache.books[i] = book; else _cache.books.unshift(book);
  dispatch();
  fire('POST', '/books', book);
  return _cache.books;
}

export function deleteEbook(bookId: string): EBook[] {
  _cache.books = _cache.books.filter(b => b.id !== bookId);
  dispatch();
  fire('DELETE', `/books/${bookId}`);
  return _cache.books;
}

// ── Author ───────────────────────────────────────────────────────
export function getAuthor(): AuthorProfile {
  return _cache.author;
}

export function updateAuthor(updated: Partial<AuthorProfile>): AuthorProfile {
  _cache.author = { ..._cache.author, ...updated };
  dispatch();
  fire('PUT', '/author', _cache.author);
  return _cache.author;
}

export function updateBankDetails(details: BankDetails): AuthorProfile {
  _cache.author.bankDetails = details;
  return updateAuthor(_cache.author);
}

// ── Orders ───────────────────────────────────────────────────────
export function getOrders(): Order[] {
  return _cache.orders;
}

export function saveOrder(order: Order): void {
  _cache.orders.unshift(order);
  if (!_cache.library.includes(order.bookId)) _cache.library.unshift(order.bookId);
  const bi = _cache.books.findIndex(b => b.id === order.bookId);
  if (bi >= 0) _cache.books[bi].salesCount = (_cache.books[bi].salesCount || 0) + 1;
  const rate = CURRENCIES[order.currency]?.rate || 1;
  _cache.author.totalSales = (_cache.author.totalSales || 0) + 1;
  _cache.author.totalRevenueUSD = (_cache.author.totalRevenueUSD || 0) + (order.amountPaid / rate);
  _cache.author.payoutBalanceUSD = (_cache.author.payoutBalanceUSD || 0) + (order.amountPaid / rate) * 0.95;
  dispatch();
  fire('POST', '/orders', order);
}

// ── Withdrawals ──────────────────────────────────────────────────
export function getWithdrawals(): WithdrawalRequest[] {
  return _cache.withdrawals;
}

export async function requestWithdrawal(
  amountNgn: number,
  currency: CurrencyCode = 'NGN',
): Promise<{ success: boolean; message: string; withdrawal?: WithdrawalRequest }> {
  if (amountNgn <= 0) return { success: false, message: 'Invalid withdrawal amount.' };
  if (!_cache.author.bankDetails?.accountNumber) return { success: false, message: 'Please configure your bank payout details in Creator Studio first.' };

  try {
    const result = await api<{ success: boolean; message: string; withdrawal?: WithdrawalRequest }>('POST', '/withdrawals', { amountNgn, currency });
    if (result.success && result.withdrawal) {
      _cache.withdrawals.unshift(result.withdrawal);
      dispatch();
    }
    return result;
  } catch {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// ── Payment Flow ────────────────────────────────────────────────
export async function initiatePayment(params: {
  bookId: string;
  email: string;
  currency?: string;
}): Promise<{ success: boolean; authorization_url?: string; access_code?: string; reference?: string; order?: Order; sandbox?: boolean; message?: string }> {
  try {
    return await api('POST', '/payments/initialize', params);
  } catch {
    return { success: false, message: 'Payment initialization failed.' };
  }
}

export async function verifyPayment(reference: string): Promise<{ success: boolean; order?: Order; message?: string }> {
  try {
    const result = await api<{ success: boolean; order?: Order; message?: string }>('POST', '/payments/verify', { reference });
    if (result.success && result.order) {
      const oi = _cache.orders.findIndex(o => o.id === result.order!.id);
      if (oi >= 0) _cache.orders[oi] = result.order!; else _cache.orders.unshift(result.order!);
      if (!_cache.library.includes(result.order!.bookId)) _cache.library.unshift(result.order!.bookId);
      dispatch();
    }
    return result;
  } catch {
    return { success: false, message: 'Verification failed.' };
  }
}

// ── Bank Verification ───────────────────────────────────────────
export async function verifyBankAccount(accountNumber: string, bankCode: string, currency: string = 'NGN'): Promise<{ success: boolean; accountName?: string; recipientCode?: string; verified?: boolean; message?: string; currency?: string }> {
  try {
    return await api('POST', '/bank/resolve', { accountNumber, bankCode, currency });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bank verification failed.';
    return { success: false, message: msg };
  }
}

// ── Banks by Currency ────────────────────────────────────────────
export interface BankOption {
  id: number;
  name: string;
  code: string;
  country: string;
  currency: string;
  active: boolean;
}

export async function fetchBanksForCurrency(currency: string): Promise<BankOption[]> {
  try {
    return await api<BankOption[]>('GET', `/banks?currency=${currency}`);
  } catch {
    return [];
  }
}

// ── Wallet & Ledger ─────────────────────────────────────────────
export interface WalletInfo {
  availableBalanceNgn: number;
  totalEarningsNgn: number;
  totalCommissionPaidNgn: number;
  totalWithdrawnNgn: number;
  totalWithdrawalFeesNgn: number;
  totalSales: number;
  booksPublished: number;
}

export async function getWalletInfo(): Promise<WalletInfo | null> {
  try {
    return await api<WalletInfo>('GET', '/wallet');
  } catch {
    return null;
  }
}

export async function getLedger(params?: { limit?: number }): Promise<LedgerEntry[]> {
  try {
    return await api<LedgerEntry[]>('GET', `/ledger?limit=${params?.limit || 50}`);
  } catch {
    return [];
  }
}

// ── Platform Config ─────────────────────────────────────────────
export function getPlatformConfig(): PlatformConfig {
  return _cache.config;
}

// ── Library ──────────────────────────────────────────────────────
export function getLibraryBookIds(): string[] {
  return _cache.library;
}

export function isBookInLibrary(bookId: string): boolean {
  return _cache.library.includes(bookId);
}

// ── Reviews ──────────────────────────────────────────────────────
export function getReviews(bookId?: string): Review[] {
  if (bookId) return _cache.reviews.filter(r => r.bookId === bookId);
  return _cache.reviews;
}

export function addReview(review: Omit<Review, 'id' | 'date'>): Review {
  const r: Review = {
    ...review,
    id: `rev_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
  };
  _cache.reviews.unshift(r);
  const br = _cache.reviews.filter(x => x.bookId === review.bookId);
  const bi = _cache.books.findIndex(b => b.id === review.bookId);
  if (bi >= 0 && br.length) {
    _cache.books[bi].rating = Number((br.reduce((s, x) => s + x.rating, 0) / br.length).toFixed(2));
    _cache.books[bi].reviewsCount = br.length;
  }
  dispatch();
  fire('POST', '/reviews', r);
  return r;
}

// ── Coupons ──────────────────────────────────────────────────────
export function getCoupons(): Coupon[] {
  return _cache.coupons;
}

export function saveCoupon(coupon: Coupon): Coupon[] {
  const i = _cache.coupons.findIndex(c => c.id === coupon.id);
  if (i >= 0) _cache.coupons[i] = coupon; else _cache.coupons.unshift(coupon);
  dispatch();
  fire('POST', '/coupons', coupon);
  return _cache.coupons;
}

export async function validateCoupon(code: string): Promise<{ valid: boolean; discountPercent: number; coupon?: Coupon }> {
  try {
    return await api('POST', '/coupons/validate', { code });
  } catch {
    const f = _cache.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
    return f ? { valid: true, discountPercent: f.discountPercent, coupon: f } : { valid: false, discountPercent: 0 };
  }
}

// ── Currency ─────────────────────────────────────────────────────
export function getSelectedCurrency(): CurrencyCode {
  return _cache.currency;
}

export function setSelectedCurrency(currency: CurrencyCode): void {
  _cache.currency = currency;
  dispatch();
  fire('PUT', '/currency', { currency });
}

// ── Price Utilities (pure, no storage) ───────────────────────────
export function formatPrice(priceUSD: number, currencyCode: CurrencyCode): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = priceUSD * config.rate;
  if (currencyCode === 'NGN' || currencyCode === 'KES') {
    return `${config.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${config.symbol}${converted.toFixed(2)}`;
}

export function convertUSDToCurrency(priceUSD: number, currencyCode: CurrencyCode): number {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  return priceUSD * config.rate;
}

// ── Schema Utilities (pure, no storage) ──────────────────────────
export function generateGoogleSchema(params: {
  id: string;
  title: string;
  subtitle: string;
  authorName: string;
  description: string;
  priceUSD: number;
  coverImage: string;
  slug: string;
}): string {
  const schemaObj = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: params.title,
    description: params.description,
    author: { '@type': 'Person', name: params.authorName },
    image: params.coverImage,
    bookFormat: 'https://schema.org/EBook',
    offers: {
      '@type': 'Offer',
      price: params.priceUSD.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://lura.to/b/${params.slug}`,
      seller: { '@type': 'Person', name: params.authorName },
    },
  };
  return JSON.stringify(schemaObj, null, 2);
}

export function injectGlobalSchema() {
  if (typeof document === 'undefined') return;
  let script = document.getElementById('lura-jsonld-schema') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'lura-jsonld-schema';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lura',
    alternateName: 'Lura Ebook Marketplace & Publishing',
    url: 'https://lura.to',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://lura.to/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }, null, 2);
}

export function injectBookSchema(book: EBook) {
  if (typeof document === 'undefined') return;
  document.title = `${book.title} by ${book.authorName} - Buy & Read | Lura`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', book.seo.metaDescription || book.description);
  let script = document.getElementById('lura-book-schema') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'lura-book-schema';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = book.seo.schemaMarkup || generateGoogleSchema({
    id: book.id, title: book.title, subtitle: book.subtitle,
    authorName: book.authorName, description: book.description,
    priceUSD: book.priceUSD, coverImage: book.coverImage, slug: book.slug,
  });
}

// ── Ebook Download ──────────────────────────────────────────────
export function downloadEbook(book: EBook): void {
  if (!book.ebookFileUrl) {
    alert('No downloadable file available for this e-book.');
    return;
  }

  const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.${book.ebookFileType || 'pdf'}`;

  // If it's a data URL (uploaded file), create a blob and trigger download
  if (book.ebookFileUrl.startsWith('data:')) {
    const [header, data] = book.ebookFileUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  // If it's a regular URL, open in new tab with download attribute
  const a = document.createElement('a');
  a.href = book.ebookFileUrl;
  a.download = fileName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Users ────────────────────────────────────────────────────────
export function getCurrentUser(): UserAccount | null {
  return _cache.currentUser;
}

export function setCurrentUser(user: UserAccount | null): void {
  _cache.currentUser = user;
  dispatch();
  fire('PUT', '/user', { user });
}

export function getAllUsers(): UserAccount[] {
  return _cache.users;
}

export async function signInUser(email: string, password?: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { success: false, error: 'Please enter a valid email address.' };
  if (!password) return { success: false, error: 'Please enter your password.' };

  // Server-side authentication
  try {
    const result = await api<{ success: boolean; user?: UserAccount; error?: string }>('POST', '/auth/signin', { email: cleanEmail, password });
    if (result.success && result.user) {
      _cache.currentUser = result.user;
      // Also update in users array
      const ui = _cache.users.findIndex(u => u.id === result.user!.id);
      if (ui >= 0) _cache.users[ui] = result.user!; else _cache.users.push(result.user!);
      // Persist session to localStorage so it survives page reload
      try { localStorage.setItem('lura_current_user_id', result.user.id); } catch {}
      dispatch();
    }
    return result;
  } catch {
    // Fallback: client-side check against cached users
    const matched = _cache.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!matched) return { success: false, error: 'No account found with this email. Please sign up first.' };
    if (!matched.passwordHash) return { success: false, error: 'This account was created without a password.' };
    const inputHash = await hashPassword(password);
    if (inputHash !== matched.passwordHash) return { success: false, error: 'Incorrect password. Please try again.' };
    _cache.currentUser = matched;
    try { localStorage.setItem('lura_current_user_id', matched.id); } catch {}
    dispatch();
    return { success: true, user: matched };
  }
}

export async function signUpUser(data: {
  name: string;
  email: string;
  password?: string;
  role: 'creator' | 'reader';
  handle?: string;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (!cleanEmail || !cleanName) {
    return { success: false, error: 'Name and email are required to create your Lura account.' };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  // Server-side signup
  try {
    const result = await api<{ success: boolean; user?: UserAccount; error?: string }>('POST', '/auth/signup', {
      name: cleanName,
      email: cleanEmail,
      password: data.password,
      role: data.role,
      handle: data.handle,
    });
    if (result.success && result.user) {
      _cache.users.push(result.user);
      _cache.currentUser = result.user;
      try { localStorage.setItem('lura_current_user_id', result.user.id); } catch {}
      dispatch();
    }
    return result;
  } catch {
    // Fallback: client-side signup
    const existing = _cache.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    const handleClean = (data.handle || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')) || `user${Date.now().toString().slice(-4)}`;
    const passwordHash = await hashPassword(data.password);
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: data.role || 'creator',
      handle: handleClean,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    _cache.users.push(newUser);
    _cache.currentUser = newUser;
    try { localStorage.setItem('lura_current_user_id', newUser.id); } catch {}
    dispatch();
    fire('POST', '/users', newUser);
    fire('PUT', '/user', { user: newUser });
    return { success: true, user: newUser };
  }
}

export function signOutUser(): void {
  _cache.currentUser = null;
  try { localStorage.removeItem('lura_current_user_id'); } catch {}
  dispatch();
  fire('DELETE', '/user');
}

// ── Forgot Password ─────────────────────────────────────────────
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
  try {
    const result = await api<{ success: boolean; message: string; resetToken?: string }>('POST', '/auth/forgot-password', { email });
    return result;
  } catch {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await api<{ success: boolean; message: string }>('POST', '/auth/reset-password', { token, newPassword });
    return result;
  } catch {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// ── Session Restore ─────────────────────────────────────────────
export async function restoreSession(): Promise<UserAccount | null> {
  try {
    const savedId = localStorage.getItem('lura_current_user_id');
    if (savedId) {
      // Check server for currentUser first
      const serverUser = await api<UserAccount | null>('GET', '/user');
      if (serverUser && serverUser.id === savedId) {
        _cache.currentUser = serverUser;
        dispatch();
        return serverUser;
      }
      // Fallback: find in cached users
      const user = _cache.users.find(u => u.id === savedId);
      if (user) {
        _cache.currentUser = user;
        dispatch();
        return user;
      }
    }
  } catch {}
  return null;
}
