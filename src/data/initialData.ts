import { EBook, AuthorProfile, Coupon, CurrencyConfig, Review } from '../types';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', rate: 1, name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' },
  NGN: { code: 'NGN', symbol: '₦', rate: 1550, name: 'Nigerian Naira' },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.36, name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.52, name: 'Australian Dollar' },
  KES: { code: 'KES', symbol: 'KSh', rate: 130, name: 'Kenyan Shilling' },
  GHS: { code: 'GHS', symbol: 'GH₵', rate: 15.2, name: 'Ghanaian Cedi' },
};

export const INITIAL_AUTHOR: AuthorProfile = {
  id: '',
  name: '',
  handle: '',
  email: '',
  avatar: '',
  bio: '',
  headline: '',
  totalSales: 0,
  totalRevenueUSD: 0,
  payoutBalanceUSD: 0,
};

export const INITIAL_EBOOKS: EBook[] = [];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_COUPONS: Coupon[] = [];
