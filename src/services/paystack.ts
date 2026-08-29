import crypto from 'crypto';

// ── Configuration ────────────────────────────────────────────────
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || '';

export function isPaystackConfigured(): boolean {
  return !!PAYSTACK_SECRET;
}

function getBaseUrl(): string {
  return 'https://api.paystack.co';
}

// ── Types ────────────────────────────────────────────────────────
export interface PaystackResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
  channel: string;
  currency: string;
  metadata: Record<string, unknown>;
  customer: { email: string };
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    card_type: string;
    bank: string;
  };
}

export interface PaystackBankData {
  id: number;
  name: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
}

export interface PaystackBankResolveData {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface PaystackTransferRecipientData {
  recipient_code: string;
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}

export interface PaystackTransferData {
  reference: string;
  status: string;
  transfer_code: string;
  amount: number;
  recipient: { name: string; account_number: string; bank_code: string };
}

export interface PaystackBalanceData {
  balance: number;
  currency: string;
}

// ── Helpers ──────────────────────────────────────────────────────
async function paystackRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<PaystackResponse<T>> {
  const url = `${getBaseUrl()}${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const json = await res.json() as PaystackResponse<T>;

  if (!res.ok || !json.status) {
    const errMsg = json.message || `Paystack API error: ${res.status}`;
    throw new Error(errMsg);
  }

  return json;
}

// ── Payment Initialize ───────────────────────────────────────────
export async function initializePayment(params: {
  email: string;
  amountInSubunits: number; // kobo for NGN, pesewas for GHS, cents for USD/EUR/GBP
  reference: string;
  currency: string; // NGN, GHS, KES, USD, EUR, GBP
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeData> {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amountInSubunits,
    reference: params.reference,
    currency: params.currency || 'NGN',
  };
  if (params.callbackUrl) body.callback_url = params.callbackUrl;
  if (params.metadata) body.metadata = params.metadata;

  const result = await paystackRequest<PaystackInitializeData>(
    'POST',
    '/transaction/initialize',
    body,
  );
  return result.data;
}

// ── Transaction Verify ───────────────────────────────────────────
export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  const result = await paystackRequest<PaystackVerifyData>(
    'GET',
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return result.data;
}

// ── Bank List ────────────────────────────────────────────────────
export async function listBanks(country?: string, currency?: string): Promise<PaystackBankData[]> {
  let url = '/bank?';
  if (country) url += `country=${country}`;
  if (currency) url += `${url.includes('?') ? '&' : '?'}currency=${currency}`;
  const result = await paystackRequest<PaystackBankData[]>('GET', url);
  return result.data;
}

// ── Country for Currency ──────────────────────────────────────────
export function countryForCurrency(currency: string): string {
  switch (currency) {
    case 'NGN': return 'nigeria';
    case 'GHS': return 'ghana';
    case 'KES': return 'kenya';
    case 'USD': return 'united-states';
    case 'GBP': return 'united-kingdom';
    case 'EUR': return 'france';
    default: return 'nigeria';
  }
}

// ── Resolve Bank Account ─────────────────────────────────────────
export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<PaystackBankResolveData> {
  const result = await paystackRequest<PaystackBankResolveData>(
    'GET',
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
  );
  return result.data;
}

// ── Transfer Recipient ───────────────────────────────────────────
export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}): Promise<PaystackTransferRecipientData> {
  const body = {
    type: 'nuban',
    name: params.name,
    account_number: params.accountNumber,
    bank_code: params.bankCode,
    currency: params.currency || 'NGN',
  };

  const result = await paystackRequest<PaystackTransferRecipientData>(
    'POST',
    '/transferrecipient',
    body,
  );
  return result.data;
}

// ── Initiate Transfer ────────────────────────────────────────────
export async function initiateTransfer(params: {
  recipientCode: string;
  amountInKobo: number;
  reference: string;
  reason?: string;
}): Promise<PaystackTransferData> {
  const body = {
    source: 'balance',
    amount: params.amountInKobo,
    recipient: params.recipientCode,
    reference: params.reference,
    reason: params.reason || 'Lura seller withdrawal',
  };

  const result = await paystackRequest<PaystackTransferData>(
    'POST',
    '/transfer',
    body,
  );
  return result.data;
}

// ── Verify Transfer ──────────────────────────────────────────────
export async function verifyTransfer(transferCode: string): Promise<PaystackTransferData> {
  const result = await paystackRequest<PaystackTransferData>(
    'GET',
    `/transfer/${encodeURIComponent(transferCode)}`,
  );
  return result.data;
}

// ── Fetch Balance ────────────────────────────────────────────────
export async function fetchBalance(): Promise<PaystackBalanceData> {
  const result = await paystackRequest<PaystackBalanceData>('GET', '/balance');
  return result.data;
}

// ── Webhook Signature Verification ───────────────────────────────
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): boolean {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.error('[paystack] WEBHOOK_SECRET not configured');
    return false;
  }
  const hash = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(typeof payload === 'string' ? payload : payload.toString())
    .digest('hex');
  return hash === signature;
}

// ── Helper: Currency to Sub-units ────────────────────────────────
// NGN: kobo (100), GHS: pesewas (100), KES: cents (100), USD/EUR/GBP: cents (100)
export function currencyToSubunits(amount: number): number {
  return Math.round(amount * 100);
}

export function subunitsToCurrency(amountInSubunits: number): number {
  return amountInSubunits / 100;
}

// Backward-compatible aliases
export const ngnToKobo = currencyToSubunits;
export const koboToNgn = subunitsToCurrency;
