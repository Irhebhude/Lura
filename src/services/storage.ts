import { EBook, AuthorProfile, Order, Review, Coupon, CurrencyCode, WithdrawalRequest, BankDetails, UserAccount } from '../types';
import { INITIAL_EBOOKS, INITIAL_AUTHOR, INITIAL_REVIEWS, INITIAL_COUPONS, CURRENCIES } from '../data/initialData';

const KEYS = {
  EBOOKS: 'lura_ebooks_v1',
  AUTHOR: 'lura_author_v1',
  ORDERS: 'lura_orders_v1',
  REVIEWS: 'lura_reviews_v1',
  COUPONS: 'lura_coupons_v1',
  LIBRARY: 'lura_library_v1',
  CURRENCY: 'lura_currency_v1',
  WITHDRAWALS: 'lura_withdrawals_v1',
  USER: 'lura_current_user_v1',
  USERS_LIST: 'lura_users_list_v1',
};

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

const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wdr_8921',
    amountUSD: 1200,
    amountLocal: 1860000,
    currency: 'NGN',
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0234819201',
    accountName: 'Prosper Ozoya',
    status: 'completed',
    date: '2026-02-15',
    reference: 'LURA-PAY-9821034',
  },
  {
    id: 'wdr_8920',
    amountUSD: 850,
    amountLocal: 1317500,
    currency: 'NGN',
    bankName: 'Moniepoint MFB',
    accountNumber: '5051892011',
    accountName: 'Prosper Ozoya',
    status: 'completed',
    date: '2026-01-28',
    reference: 'LURA-PAY-7719204',
  },
];

export function initializeStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(KEYS.EBOOKS)) {
    localStorage.setItem(KEYS.EBOOKS, JSON.stringify(INITIAL_EBOOKS));
  }
  if (!localStorage.getItem(KEYS.AUTHOR)) {
    localStorage.setItem(KEYS.AUTHOR, JSON.stringify(INITIAL_AUTHOR));
  }
  if (!localStorage.getItem(KEYS.REVIEWS)) {
    localStorage.setItem(KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  }
  if (!localStorage.getItem(KEYS.COUPONS)) {
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
  }
  if (!localStorage.getItem(KEYS.ORDERS)) {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.LIBRARY)) {
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.CURRENCY)) {
    localStorage.setItem(KEYS.CURRENCY, 'USD');
  }
  if (!localStorage.getItem(KEYS.WITHDRAWALS)) {
    localStorage.setItem(KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
  }
}

export function getEbooks(): EBook[] {
  if (typeof window === 'undefined') return INITIAL_EBOOKS;
  const data = localStorage.getItem(KEYS.EBOOKS);
  if (!data) return INITIAL_EBOOKS;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_EBOOKS;
  }
}

export function saveEbook(book: EBook): EBook[] {
  const books = getEbooks();
  const index = books.findIndex((b) => b.id === book.id);
  if (index >= 0) {
    books[index] = book;
  } else {
    books.unshift(book);
  }
  localStorage.setItem(KEYS.EBOOKS, JSON.stringify(books));
  window.dispatchEvent(new Event('lura_storage_update'));
  return books;
}

export function deleteEbook(bookId: string): EBook[] {
  const books = getEbooks().filter((b) => b.id !== bookId);
  localStorage.setItem(KEYS.EBOOKS, JSON.stringify(books));
  window.dispatchEvent(new Event('lura_storage_update'));
  return books;
}

export function getAuthor(): AuthorProfile {
  if (typeof window === 'undefined') return INITIAL_AUTHOR;
  const data = localStorage.getItem(KEYS.AUTHOR);
  if (!data) return INITIAL_AUTHOR;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_AUTHOR;
  }
}

export function updateAuthor(updated: Partial<AuthorProfile>): AuthorProfile {
  const current = getAuthor();
  const merged: AuthorProfile = { ...current, ...updated };
  localStorage.setItem(KEYS.AUTHOR, JSON.stringify(merged));
  window.dispatchEvent(new Event('lura_storage_update'));
  return merged;
}

export function updateBankDetails(details: BankDetails): AuthorProfile {
  const author = getAuthor();
  author.bankDetails = details;
  return updateAuthor(author);
}

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(KEYS.ORDERS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));

  // Add to library
  const library = getLibraryBookIds();
  if (!library.includes(order.bookId)) {
    library.unshift(order.bookId);
    localStorage.setItem(KEYS.LIBRARY, JSON.stringify(library));
  }

  // Update sales count on ebook
  const books = getEbooks();
  const bookIndex = books.findIndex((b) => b.id === order.bookId);
  if (bookIndex >= 0) {
    books[bookIndex].salesCount = (books[bookIndex].salesCount || 0) + 1;
    localStorage.setItem(KEYS.EBOOKS, JSON.stringify(books));
  }

  // Credit author wallet revenue (95% payout rate)
  const author = getAuthor();
  const netEarningsUSD = (order.amountPaid / (CURRENCIES[order.currency]?.rate || 1)) * 0.95;
  author.totalSales = (author.totalSales || 0) + 1;
  author.totalRevenueUSD = (author.totalRevenueUSD || 0) + (order.amountPaid / (CURRENCIES[order.currency]?.rate || 1));
  author.payoutBalanceUSD = (author.payoutBalanceUSD || 0) + netEarningsUSD;
  localStorage.setItem(KEYS.AUTHOR, JSON.stringify(author));

  window.dispatchEvent(new Event('lura_storage_update'));
}

export function getWithdrawals(): WithdrawalRequest[] {
  if (typeof window === 'undefined') return INITIAL_WITHDRAWALS;
  const data = localStorage.getItem(KEYS.WITHDRAWALS);
  if (!data) return INITIAL_WITHDRAWALS;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_WITHDRAWALS;
  }
}

export function requestWithdrawal(amountUSD: number, currency: CurrencyCode): { success: boolean; message: string; withdrawal?: WithdrawalRequest } {
  const author = getAuthor();
  if (amountUSD <= 0) {
    return { success: false, message: 'Invalid withdrawal amount.' };
  }
  if (author.payoutBalanceUSD < amountUSD) {
    return { success: false, message: 'Insufficient balance in your Lura wallet.' };
  }
  if (!author.bankDetails || !author.bankDetails.accountNumber) {
    return { success: false, message: 'Please configure your bank payout details in Creator Studio first.' };
  }

  const rate = CURRENCIES[currency]?.rate || 1;
  const amountLocal = amountUSD * rate;

  const newWithdrawal: WithdrawalRequest = {
    id: `wdr_${Date.now().toString().slice(-6)}`,
    amountUSD,
    amountLocal,
    currency,
    bankName: author.bankDetails.bankName,
    accountNumber: author.bankDetails.accountNumber,
    accountName: author.bankDetails.accountName || author.name,
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    reference: `LURA-PAY-${Math.floor(1000000 + Math.random() * 9000000)}`,
  };

  author.payoutBalanceUSD -= amountUSD;
  updateAuthor(author);

  const withdrawals = getWithdrawals();
  withdrawals.unshift(newWithdrawal);
  localStorage.setItem(KEYS.WITHDRAWALS, JSON.stringify(withdrawals));

  window.dispatchEvent(new Event('lura_storage_update'));
  return { success: true, message: `Successfully transferred ${CURRENCIES[currency].symbol}${amountLocal.toLocaleString()} to ${newWithdrawal.bankName}!`, withdrawal: newWithdrawal };
}

export function getLibraryBookIds(): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(KEYS.LIBRARY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function isBookInLibrary(bookId: string): boolean {
  return getLibraryBookIds().includes(bookId);
}

export function getReviews(bookId?: string): Review[] {
  if (typeof window === 'undefined') return INITIAL_REVIEWS;
  const data = localStorage.getItem(KEYS.REVIEWS);
  if (!data) return INITIAL_REVIEWS;
  try {
    const list: Review[] = JSON.parse(data);
    if (bookId) return list.filter((r) => r.bookId === bookId);
    return list;
  } catch {
    return INITIAL_REVIEWS;
  }
}

export function addReview(review: Omit<Review, 'id' | 'date'>): Review {
  const reviews = getReviews();
  const newReview: Review = {
    ...review,
    id: `rev_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
  };
  reviews.unshift(newReview);
  localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));

  const books = getEbooks();
  const book = books.find((b) => b.id === review.bookId);
  if (book) {
    const bookReviews = reviews.filter((r) => r.bookId === review.bookId);
    const avgRating = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
    book.rating = Number(avgRating.toFixed(2));
    book.reviewsCount = bookReviews.length;
    localStorage.setItem(KEYS.EBOOKS, JSON.stringify(books));
  }

  window.dispatchEvent(new Event('lura_storage_update'));
  return newReview;
}

export function getCoupons(): Coupon[] {
  if (typeof window === 'undefined') return INITIAL_COUPONS;
  const data = localStorage.getItem(KEYS.COUPONS);
  if (!data) return INITIAL_COUPONS;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_COUPONS;
  }
}

export function saveCoupon(coupon: Coupon): Coupon[] {
  const coupons = getCoupons();
  const index = coupons.findIndex((c) => c.id === coupon.id);
  if (index >= 0) {
    coupons[index] = coupon;
  } else {
    coupons.unshift(coupon);
  }
  localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
  window.dispatchEvent(new Event('lura_storage_update'));
  return coupons;
}

export function validateCoupon(code: string): { valid: boolean; discountPercent: number; coupon?: Coupon } {
  const coupons = getCoupons();
  const found = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
  if (found) {
    return { valid: true, discountPercent: found.discountPercent, coupon: found };
  }
  return { valid: false, discountPercent: 0 };
}

export function getSelectedCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  const c = localStorage.getItem(KEYS.CURRENCY) as CurrencyCode;
  return c || 'USD';
}

export function setSelectedCurrency(currency: CurrencyCode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.CURRENCY, currency);
  window.dispatchEvent(new Event('lura_storage_update'));
}

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
    author: {
      '@type': 'Person',
      name: params.authorName,
    },
    image: params.coverImage,
    bookFormat: 'https://schema.org/EBook',
    offers: {
      '@type': 'Offer',
      price: params.priceUSD.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `https://lura.to/b/${params.slug}`,
      seller: {
        '@type': 'Person',
        name: params.authorName,
      },
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

  const globalSchema = {
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
  };

  script.textContent = JSON.stringify(globalSchema, null, 2);
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
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    authorName: book.authorName,
    description: book.description,
    priceUSD: book.priceUSD,
    coverImage: book.coverImage,
    slug: book.slug,
  });
}

// User Authentication State Management
const DEFAULT_USER: UserAccount = {
  id: 'usr_prosper_01',
  name: 'Prosper Ozoya',
  email: 'prosperozoya50@gmail.com',
  role: 'creator',
  handle: 'prosperozoya',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  createdAt: '2026-01-10T10:00:00Z',
};

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return DEFAULT_USER;
  const stored = localStorage.getItem(KEYS.USER);
  if (!stored) {
    localStorage.setItem(KEYS.USER, JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_USER;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.USER);
  }
  window.dispatchEvent(new Event('lura_storage_update'));
}

export function getAllUsers(): UserAccount[] {
  if (typeof window === 'undefined') return [DEFAULT_USER];
  const stored = localStorage.getItem(KEYS.USERS_LIST);
  if (!stored) {
    const initList = [DEFAULT_USER];
    localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(initList));
    return initList;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [DEFAULT_USER];
  }
}

export function signInUser(email: string, _password?: string): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const users = getAllUsers();
  let matched = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!matched) {
    matched = {
      id: `usr_${Date.now()}`,
      name: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      role: 'creator',
      handle: cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
    };
    users.push(matched);
    localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
  }

  setCurrentUser(matched);
  return { success: true, user: matched };
}

export function signUpUser(data: {
  name: string;
  email: string;
  password?: string;
  role: 'creator' | 'reader';
  handle?: string;
}): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  if (!cleanEmail || !cleanName) {
    return { success: false, error: 'Name and email are required to create your Lura account.' };
  }

  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    setCurrentUser(existing);
    return { success: true, user: existing };
  }

  const handleClean = (data.handle || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')) || `user${Date.now().toString().slice(-4)}`;
  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    role: data.role || 'creator',
    handle: handleClean,
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
  setCurrentUser(newUser);

  if (data.role === 'creator') {
    updateAuthor({
      name: cleanName,
      email: cleanEmail,
      handle: handleClean,
    });
  }

  return { success: true, user: newUser };
}

export function signOutUser(): void {
  setCurrentUser(null);
}
