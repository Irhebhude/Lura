export interface SampleChapter {
  id: string;
  title: string;
  content: string;
}

export interface EBook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorBio: string;
  authorVerified?: boolean;
  description: string;
  highlights: string[];
  coverImage: string;
  coverGradient?: string;
  priceUSD: number;
  originalPriceUSD?: number;
  category: string;
  tags: string[];
  language: string;
  pagesCount: number;
  publishDate: string;
  format: ('PDF' | 'EPUB' | 'Interactive')[];
  rating: number;
  reviewsCount: number;
  salesCount: number;
  allowPayWhatYouWant?: boolean;
  minPriceUSD?: number;
  sampleChapters: SampleChapter[];
  fullChapters: SampleChapter[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    googleIndexed: boolean;
    schemaMarkup: string;
    indexedTimestamp: string;
  };
  fileSizeMB?: number;
  ebookFileUrl?: string;
  ebookFileType?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verifiedBuyer: boolean;
}

export interface Order {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  authorId: string;
  authorName: string;
  buyerEmail: string;
  buyerName: string;
  amountPaid: number;
  currency: string;
  date: string;
  paymentMethod: string;
  downloadToken: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  paystackReference?: string;
  paystackAccessCode?: string;
  grossAmount?: number;
  commissionAmount?: number;
  sellerNetAmount?: number;
  platformFee?: number;
}

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  accountName: string;
  currency?: CurrencyCode;
  swiftCode?: string;
  routingNumber?: string;
  bvn?: string;
  verified?: boolean;
  verifiedAt?: string;
  paystackRecipientCode?: string;
}

export interface WithdrawalRequest {
  id: string;
  amountUSD: number;
  amountLocal: number;
  currency: CurrencyCode;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'refunded';
  date: string;
  reference: string;
  withdrawalFee?: number;
  netAmount?: number;
  paystackTransferCode?: string;
  paystackTransferReference?: string;
  failureReason?: string;
  completedAt?: string;
}

export interface AuthorProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  bio: string;
  headline: string;
  totalSales: number;
  totalRevenueUSD: number;
  payoutBalanceUSD: number;
  pendingBalance?: number;
  totalCommissionPaid?: number;
  totalWithdrawn?: number;
  totalWithdrawalFees?: number;
  bankDetails?: BankDetails;
  paystackSubaccountCode?: string;
  socials?: {
    twitter?: string;
    website?: string;
    linkedin?: string;
  };
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'creator' | 'reader';
  handle?: string;
  avatar?: string;
  passwordHash?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  usageCount: number;
  expiresAt: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'CAD' | 'AUD' | 'KES' | 'GHS';

export interface LedgerEntry {
  id: string;
  referenceId: string;
  userId: string;
  sellerId?: string;
  buyerId?: string;
  orderId?: string;
  ebookId?: string;
  type: 'sale_credit' | 'commission_debit' | 'withdrawal' | 'withdrawal_fee' | 'refund' | 'adjustment';
  amount: number;
  currency: CurrencyCode;
  direction: 'credit' | 'debit';
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  description: string;
  paystackReference?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  commissionPercent: number;
  withdrawalFee: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  minEbookPrice: number;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // multiplier against USD
  name: string;
}
