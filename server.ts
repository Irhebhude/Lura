import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { INITIAL_EBOOKS, INITIAL_AUTHOR, INITIAL_REVIEWS, INITIAL_COUPONS, CURRENCIES } from './src/data/initialData';
import type { EBook, AuthorProfile, Order, Review, Coupon, CurrencyCode, WithdrawalRequest, UserAccount, LedgerEntry, PlatformConfig } from './src/types';
import {
  isPaystackConfigured,
  initializePayment,
  verifyTransaction,
  resolveBankAccount,
  createTransferRecipient,
  initiateTransfer,
  verifyTransfer,
  fetchBalance,
  verifyWebhookSignature,
  ngnToKobo,
  koboToNgn,
} from './src/services/paystack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || '3000');
const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const DB_PATH = join(__dirname, 'data', 'db.json');

// ── Platform Configuration ───────────────────────────────────────
const DEFAULT_CONFIG: PlatformConfig = {
  commissionPercent: 5,
  withdrawalFee: 50,
  minWithdrawal: 1000,
  maxWithdrawal: 500000,
  minEbookPrice: 500,
};

// ── Database ─────────────────────────────────────────────────────
interface DB {
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
  webhookEvents: Array<{ id: string; event: string; reference: string; payload: unknown; processedAt: string }>;
}

function defaultDB(): DB {
  return {
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
    config: DEFAULT_CONFIG,
    webhookEvents: [],
  };
}

function loadDB(): DB {
  if (!existsSync(DB_PATH)) { const db = defaultDB(); saveDB(db); return db; }
  try {
    const raw = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
    // Merge defaults for new fields
    return {
      ...defaultDB(),
      ...raw,
      ledger: raw.ledger || [],
      config: { ...DEFAULT_CONFIG, ...(raw.config || {}) },
      webhookEvents: raw.webhookEvents || [],
    };
  }
  catch { const db = defaultDB(); saveDB(db); return db; }
}

function saveDB(db: DB) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── Ledger helpers ───────────────────────────────────────────────
function addLedgerEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>): LedgerEntry {
  const now = new Date().toISOString();
  const record: LedgerEntry = {
    ...entry,
    id: `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  db.ledger.unshift(record);
  return record;
}

// ── Express setup ────────────────────────────────────────────────
const app = express();

// Webhook needs raw body for signature verification
app.use('/api/webhooks/paystack', express.raw({ type: 'application/json' }));
app.use(express.json());

let db = loadDB();

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    paystackConfigured: isPaystackConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// ── API: Platform Config ─────────────────────────────────────────
app.get('/api/config', (_req, res) => res.json(db.config));

// ── API: All data at once (for frontend init) ────────────────────
app.get('/api/init', (_req, res) => res.json({
  ...db,
  // Never send webhook secrets or raw Paystack keys to the frontend
  config: db.config,
}));

// ══════════════════════════════════════════════════════════════════
// PAYMENT INITIALIZATION
// ══════════════════════════════════════════════════════════════════
app.post('/api/payments/initialize', async (req, res) => {
  try {
    const { bookId, email, currency } = req.body;

    if (!bookId || !email) {
      return res.status(400).json({ success: false, message: 'bookId and email are required.' });
    }

    const book = db.books.find(b => b.id === bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });

    // Check if already purchased
    const existingOrder = db.orders.find(o => o.bookId === bookId && o.buyerEmail === email && o.status === 'completed');
    if (existingOrder) {
      return res.json({ success: true, message: 'Already purchased.', order: existingOrder });
    }

    // Calculate amounts in NGN
    const selectedCurrency = currency || 'NGN';
    const rate = CURRENCIES[selectedCurrency]?.rate || 1;
    const grossAmountNgn = book.priceUSD * rate;
    const commissionAmountNgn = grossAmountNgn * (db.config.commissionPercent / 100);
    const sellerNetNgn = grossAmountNgn - commissionAmountNgn;

    // Generate unique reference
    const reference = `LURA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Create pending order
    const order: Order = {
      id: `ord_${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookCover: book.coverImage,
      authorId: book.authorId,
      authorName: book.authorName,
      buyerEmail: email,
      buyerName: email.split('@')[0],
      amountPaid: book.priceUSD,
      currency: selectedCurrency,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Paystack',
      downloadToken: `dl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      status: 'pending',
      paystackReference: reference,
      grossAmount: grossAmountNgn,
      commissionAmount: commissionAmountNgn,
      sellerNetAmount: sellerNetNgn,
    };
    db.orders.unshift(order);
    saveDB(db);

    if (!isPaystackConfigured()) {
      // Sandbox mode: return mock authorization URL
      return res.json({
        success: true,
        sandbox: true,
        message: 'Paystack not configured. Using sandbox mode.',
        authorization_url: null,
        access_code: null,
        reference,
        order,
      });
    }

    // Initialize real Paystack payment
    const paystackData = await initializePayment({
      email,
      amountInKobo: ngnToKobo(grossAmountNgn),
      reference,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/payments/callback`,
      metadata: {
        orderId: order.id,
        bookId: book.id,
        sellerId: book.authorId,
        custom_fields: [
          { display_name: 'Book', variable_name: 'book', value: book.title },
          { display_name: 'Seller', variable_name: 'seller', value: book.authorName },
        ],
      },
    });

    // Update order with Paystack access code
    const oi = db.orders.findIndex(o => o.id === order.id);
    if (oi >= 0) {
      db.orders[oi].paystackAccessCode = paystackData.access_code;
    }
    saveDB(db);

    res.json({
      success: true,
      authorization_url: paystackData.authorization_url,
      access_code: paystackData.access_code,
      reference,
      order,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Payment initialization failed';
    console.error('[payment/init]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ══════════════════════════════════════════════════════════════════
// PAYMENT VERIFICATION (called by frontend after redirect/popup)
// ══════════════════════════════════════════════════════════════════
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success: false, message: 'Reference required.' });

    const order = db.orders.find(o => o.paystackReference === reference);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Already completed — idempotent
    if (order.status === 'completed') {
      return res.json({ success: true, message: 'Payment already verified.', order });
    }

    if (!isPaystackConfigured()) {
      // Sandbox mode: auto-verify
      return completeOrderPayment(order);
    }

    // Verify with Paystack
    const verifyData = await verifyTransaction(reference);

    if (verifyData.status === 'success') {
      return completeOrderPayment(order, verifyData);
    }

    res.json({ success: false, message: `Payment status: ${verifyData.status}`, order });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    console.error('[payment/verify]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

function completeOrderPayment(order: Order, paystackData?: import('./src/services/paystack').PaystackVerifyData) {
  const now = new Date().toISOString();

  // Mark order completed
  const oi = db.orders.findIndex(o => o.id === order.id);
  if (oi >= 0) db.orders[oi].status = 'completed';

  // Add to library
  if (!db.library.includes(order.bookId)) db.library.unshift(order.bookId);

  // Update book sales
  const bi = db.books.findIndex(b => b.id === order.bookId);
  if (bi >= 0) db.books[bi].salesCount = (db.books[bi].salesCount || 0) + 1;

  // Calculate seller earnings
  const grossAmountNgn = order.grossAmount || order.amountPaid * (CURRENCIES[order.currency]?.rate || 1);
  const commissionNgn = order.commissionAmount || grossAmountNgn * (db.config.commissionPercent / 100);
  const sellerNetNgn = order.sellerNetAmount || grossAmountNgn - commissionNgn;

  // Update order with final amounts
  if (oi >= 0) {
    db.orders[oi].grossAmount = grossAmountNgn;
    db.orders[oi].commissionAmount = commissionNgn;
    db.orders[oi].sellerNetAmount = sellerNetNgn;
  }

  // Credit seller wallet
  db.author.totalSales = (db.author.totalSales || 0) + 1;
  db.author.totalRevenueUSD = (db.author.totalRevenueUSD || 0) + order.amountPaid;
  db.author.payoutBalanceUSD = (db.author.payoutBalanceUSD || 0) + sellerNetNgn / (CURRENCIES['NGN']?.rate || 1);
  db.author.totalCommissionPaid = (db.author.totalCommissionPaid || 0) + commissionNgn / (CURRENCIES['NGN']?.rate || 1);

  // Ledger: sale credit
  addLedgerEntry({
    referenceId: order.id,
    userId: order.authorId,
    sellerId: order.authorId,
    buyerId: order.buyerEmail,
    orderId: order.id,
    ebookId: order.bookId,
    type: 'sale_credit',
    amount: sellerNetNgn,
    currency: 'NGN',
    direction: 'credit',
    status: 'completed',
    description: `Sale of "${order.bookTitle}" — net after ${db.config.commissionPercent}% commission`,
    paystackReference: order.paystackReference,
    metadata: { grossAmount: grossAmountNgn, commission: commissionNgn, sellerNet: sellerNetNgn },
  });

  // Ledger: commission debit
  addLedgerEntry({
    referenceId: order.id,
    userId: 'platform',
    orderId: order.id,
    ebookId: order.bookId,
    type: 'commission_debit',
    amount: commissionNgn,
    currency: 'NGN',
    direction: 'credit',
    status: 'completed',
    description: `${db.config.commissionPercent}% commission on "${order.bookTitle}"`,
    paystackReference: order.paystackReference,
  });

  saveDB(db);

  const updatedOrder = db.orders.find(o => o.id === order.id)!;
  return updatedOrder
    ? updatedOrder.status === 'completed'
      ? { success: true, message: 'Payment verified. Book access granted.', order: updatedOrder }
      : updatedOrder
    : { success: false, message: 'Order processing.' };
}

// ══════════════════════════════════════════════════════════════════
// PAYMENT CALLBACK (Paystack redirect)
// ══════════════════════════════════════════════════════════════════
app.get('/api/payments/callback', async (req, res) => {
  const { reference, trxref } = req.query;
  const ref = (reference || trxref) as string;

  if (ref) {
    try {
      const order = db.orders.find(o => o.paystackReference === ref);
      if (order && order.status !== 'completed') {
        await verifyTransaction(ref);
      }
    } catch {}
  }

  // Redirect to app with status
  res.redirect(`/?payment=${ref ? 'success' : 'failed'}&ref=${ref || ''}`);
});

// ══════════════════════════════════════════════════════════════════
// BANK ACCOUNT VERIFICATION (Paystack Resolve API)
// ══════════════════════════════════════════════════════════════════
app.post('/api/bank/resolve', async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ success: false, message: 'accountNumber and bankCode required.' });
    }

    if (!isPaystackConfigured()) {
      // Sandbox mode: return mock data
      return res.json({
        success: true,
        accountNumber,
        accountName: 'Sandbox Account Name',
        bankId: 0,
        verified: true,
      });
    }

    const data = await resolveBankAccount(accountNumber, bankCode);

    // Save recipient code for later use
    let recipientCode: string | undefined;
    try {
      const recipient = await createTransferRecipient({
        name: data.account_name,
        accountNumber: data.account_number,
        bankCode,
      });
      recipientCode = recipient.recipient_code;
    } catch (e) {
      console.warn('[bank/resolve] Failed to create transfer recipient:', e);
    }

    res.json({
      success: true,
      accountNumber: data.account_number,
      accountName: data.account_name,
      bankId: data.bank_id,
      verified: true,
      recipientCode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Account verification failed';
    console.error('[bank/resolve]', msg);
    res.status(400).json({ success: false, message: msg });
  }
});

// ══════════════════════════════════════════════════════════════════
// SELLER WITHDRAWAL
// ══════════════════════════════════════════════════════════════════
app.post('/api/withdrawals', async (req, res) => {
  try {
    const { amountNgn, currency } = req.body;

    if (!amountNgn || amountNgn <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    const withdrawalFee = db.config.withdrawalFee;
    const netAmountNgn = amountNgn - withdrawalFee;

    if (netAmountNgn <= 0) {
      return res.status(400).json({ success: false, message: `Amount must be greater than the ₦${withdrawalFee} withdrawal fee.` });
    }

    if (amountNgn < db.config.minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is ₦${db.config.minWithdrawal.toLocaleString()}.` });
    }

    if (amountNgn > db.config.maxWithdrawal) {
      return res.status(400).json({ success: false, message: `Maximum withdrawal is ₦${db.config.maxWithdrawal.toLocaleString()}.` });
    }

    // Check available balance (convert payoutBalanceUSD to NGN)
    const rate = CURRENCIES['NGN']?.rate || 1;
    const availableNgn = (db.author.payoutBalanceUSD || 0) * rate;

    if (amountNgn > availableNgn) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₦${Math.round(availableNgn).toLocaleString()}` });
    }

    // Verify bank details exist
    if (!db.author.bankDetails?.accountNumber || !db.author.bankDetails?.bankCode) {
      return res.status(400).json({ success: false, message: 'Please add and verify your bank account first.' });
    }

    // Check for pending withdrawals (prevent double spending)
    const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'pending' || w.status === 'processing');
    if (pendingWithdrawals.length > 0) {
      return res.status(400).json({ success: false, message: 'You have a pending withdrawal. Please wait for it to complete.' });
    }

    const reference = `LURA-WDR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Create withdrawal record
    const withdrawal: WithdrawalRequest = {
      id: `wdr_${Date.now()}`,
      amountUSD: amountNgn / rate,
      amountLocal: amountNgn,
      currency: (currency || 'NGN') as CurrencyCode,
      bankName: db.author.bankDetails.bankName,
      bankCode: db.author.bankDetails.bankCode,
      accountNumber: db.author.bankDetails.accountNumber,
      accountName: db.author.bankDetails.accountName,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      reference,
      withdrawalFee,
      netAmount: netAmountNgn,
    };

    // Lock funds
    db.author.payoutBalanceUSD -= amountNgn / rate;
    db.author.totalWithdrawn = (db.author.totalWithdrawn || 0) + amountNgn / rate;
    db.author.totalWithdrawalFees = (db.author.totalWithdrawalFees || 0) + withdrawalFee / rate;
    db.withdrawals.unshift(withdrawal);

    // Ledger: withdrawal
    addLedgerEntry({
      referenceId: withdrawal.id,
      userId: db.author.id,
      sellerId: db.author.id,
      type: 'withdrawal',
      amount: amountNgn,
      currency: 'NGN',
      direction: 'debit',
      status: 'pending',
      description: `Withdrawal of ₦${amountNgn.toLocaleString()} to ${db.author.bankDetails.bankName} ••••${db.author.bankDetails.accountNumber.slice(-4)}`,
    });

    // Ledger: withdrawal fee
    addLedgerEntry({
      referenceId: withdrawal.id,
      userId: 'platform',
      type: 'withdrawal_fee',
      amount: withdrawalFee,
      currency: 'NGN',
      direction: 'credit',
      status: 'completed',
      description: `₦${withdrawalFee} withdrawal fee`,
    });

    saveDB(db);

    // Initiate Paystack transfer if configured
    if (isPaystackConfigured() && db.author.bankDetails.paystackRecipientCode) {
      try {
        const transferData = await initiateTransfer({
          recipientCode: db.author.bankDetails.paystackRecipientCode,
          amountInKobo: ngnToKobo(netAmountNgn),
          reference,
          reason: `Lura withdrawal - ${db.author.name}`,
        });

        // Update withdrawal with transfer details
        const wi = db.withdrawals.findIndex(w => w.id === withdrawal.id);
        if (wi >= 0) {
          db.withdrawals[wi].status = 'processing';
          db.withdrawals[wi].paystackTransferCode = transferData.transfer_code;
          db.withdrawals[wi].paystackTransferReference = transferData.reference;
        }

        // Update ledger
        const li = db.ledger.findIndex(l => l.referenceId === withdrawal.id && l.type === 'withdrawal');
        if (li >= 0) {
          db.ledger[li].status = 'pending';
          db.ledger[li].paystackReference = transferData.transfer_code;
          db.ledger[li].updatedAt = new Date().toISOString();
        }

        saveDB(db);

        return res.json({
          success: true,
          message: `Withdrawal initiated. ₦${netAmountNgn.toLocaleString()} will be sent to ${db.author.bankDetails.bankName}.`,
          withdrawal: db.withdrawals[wi],
        });
      } catch (transferErr) {
        // Transfer failed — restore funds
        db.author.payoutBalanceUSD += amountNgn / rate;
        db.author.totalWithdrawn = (db.author.totalWithdrawn || 0) - amountNgn / rate;

        const wi = db.withdrawals.findIndex(w => w.id === withdrawal.id);
        if (wi >= 0) {
          db.withdrawals[wi].status = 'failed';
          db.withdrawals[wi].failureReason = transferErr instanceof Error ? transferErr.message : 'Transfer failed';
        }

        saveDB(db);

        const msg = transferErr instanceof Error ? transferErr.message : 'Transfer initiation failed';
        return res.status(500).json({ success: false, message: `Withdrawal failed: ${msg}. Funds restored.` });
      }
    }

    // Sandbox mode or no recipient code
    const wi = db.withdrawals.findIndex(w => w.id === withdrawal.id);
    if (wi >= 0) db.withdrawals[wi].status = 'processing';
    saveDB(db);

    res.json({
      success: true,
      message: isPaystackConfigured()
        ? `Withdrawal initiated. ₦${netAmountNgn.toLocaleString()} will be sent to ${db.author.bankDetails.bankName}.`
        : `Withdrawal recorded (sandbox). ₦${netAmountNgn.toLocaleString()} pending processing.`,
      withdrawal: db.withdrawals[wi || 0],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Withdrawal failed';
    console.error('[withdrawal]', msg);
    res.status(500).json({ success: false, message: msg });
  }
});

// ══════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ══════════════════════════════════════════════════════════════════
app.post('/api/webhooks/paystack', (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;

    if (!signature) {
      console.warn('[webhook] Missing signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Get raw body for verification
    const rawBody = req.body; // Already parsed as buffer by express.raw
    const bodyStr = rawBody.toString();

    // Verify signature
    if (isPaystackConfigured() && !verifyWebhookSignature(rawBody, signature)) {
      console.warn('[webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(bodyStr);
    const eventType = event.event;
    const eventRef = event.data?.reference || event.data?.transfer_code || '';

    // Idempotency: check if already processed
    const existingEvent = db.webhookEvents.find(
      e => e.event === eventType && e.reference === eventRef,
    );
    if (existingEvent) {
      console.log(`[webhook] Duplicate event ignored: ${eventType} ${eventRef}`);
      return res.json({ status: 'ok', message: 'Duplicate event' });
    }

    // Store webhook event
    db.webhookEvents.unshift({
      id: `whk_${Date.now()}`,
      event: eventType,
      reference: eventRef,
      payload: event.data,
      processedAt: new Date().toISOString(),
    });

    // Handle event
    handleWebhookEvent(eventType, event.data);

    // Keep only last 500 webhook events
    if (db.webhookEvents.length > 500) {
      db.webhookEvents = db.webhookEvents.slice(0, 500);
    }

    saveDB(db);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[webhook] Processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

function handleWebhookEvent(eventType: string, data: Record<string, unknown>) {
  const now = new Date().toISOString();

  switch (eventType) {
    case 'charge.success': {
      const reference = data.reference as string;
      const order = db.orders.find(o => o.paystackReference === reference);
      if (!order) {
        console.warn(`[webhook] Order not found for reference: ${reference}`);
        return;
      }
      if (order.status === 'completed') {
        console.log(`[webhook] Order already completed: ${reference}`);
        return; // Idempotent
      }

      // Complete the order (same logic as verify)
      const grossAmountNgn = order.grossAmount || order.amountPaid * (CURRENCIES[order.currency]?.rate || 1);
      const commissionNgn = order.commissionAmount || grossAmountNgn * (db.config.commissionPercent / 100);
      const sellerNetNgn = order.sellerNetAmount || grossAmountNgn - commissionNgn;

      const oi = db.orders.findIndex(o => o.id === order.id);
      if (oi >= 0) {
        db.orders[oi].status = 'completed';
        db.orders[oi].grossAmount = grossAmountNgn;
        db.orders[oi].commissionAmount = commissionNgn;
        db.orders[oi].sellerNetAmount = sellerNetNgn;
      }

      if (!db.library.includes(order.bookId)) db.library.unshift(order.bookId);

      const bi = db.books.findIndex(b => b.id === order.bookId);
      if (bi >= 0) db.books[bi].salesCount = (db.books[bi].salesCount || 0) + 1;

      const rate = CURRENCIES['NGN']?.rate || 1;
      db.author.totalSales = (db.author.totalSales || 0) + 1;
      db.author.totalRevenueUSD = (db.author.totalRevenueUSD || 0) + order.amountPaid;
      db.author.payoutBalanceUSD = (db.author.payoutBalanceUSD || 0) + sellerNetNgn / rate;
      db.author.totalCommissionPaid = (db.author.totalCommissionPaid || 0) + commissionNgn / rate;

      // Ledger entries
      addLedgerEntry({
        referenceId: order.id,
        userId: order.authorId,
        sellerId: order.authorId,
        buyerId: order.buyerEmail,
        orderId: order.id,
        ebookId: order.bookId,
        type: 'sale_credit',
        amount: sellerNetNgn,
        currency: 'NGN',
        direction: 'credit',
        status: 'completed',
        description: `Sale of "${order.bookTitle}" (webhook verified)`,
        paystackReference: reference,
        metadata: { grossAmount: grossAmountNgn, commission: commissionNgn, sellerNet: sellerNetNgn },
      });

      addLedgerEntry({
        referenceId: order.id,
        userId: 'platform',
        orderId: order.id,
        ebookId: order.bookId,
        type: 'commission_debit',
        amount: commissionNgn,
        currency: 'NGN',
        direction: 'credit',
        status: 'completed',
        description: `${db.config.commissionPercent}% commission on "${order.bookTitle}" (webhook)`,
        paystackReference: reference,
      });

      console.log(`[webhook] charge.success: Order ${order.id} completed, seller credited ₦${sellerNetNgn.toLocaleString()}`);
      break;
    }

    case 'transfer.success': {
      const transferCode = data.transfer_code as string;
      const withdrawal = db.withdrawals.find(w => w.paystackTransferCode === transferCode);
      if (!withdrawal) {
        console.warn(`[webhook] Withdrawal not found for transfer: ${transferCode}`);
        return;
      }
      if (withdrawal.status === 'successful') return; // Idempotent

      const wi = db.withdrawals.findIndex(w => w.id === withdrawal.id);
      if (wi >= 0) {
        db.withdrawals[wi].status = 'successful';
        db.withdrawals[wi].completedAt = now;
      }

      // Update ledger
      const li = db.ledger.findIndex(l => l.referenceId === withdrawal.id && l.type === 'withdrawal');
      if (li >= 0) {
        db.ledger[li].status = 'completed';
        db.ledger[li].updatedAt = now;
      }

      console.log(`[webhook] transfer.success: Withdrawal ${withdrawal.id} completed`);
      break;
    }

    case 'transfer.failed':
    case 'transfer.reversed': {
      const transferCode = data.transfer_code as string;
      const withdrawal = db.withdrawals.find(w => w.paystackTransferCode === transferCode);
      if (!withdrawal) return;

      const wi = db.withdrawals.findIndex(w => w.id === withdrawal.id);
      if (wi >= 0) {
        db.withdrawals[wi].status = 'failed';
        db.withdrawals[wi].failureReason = (data.reason as string) || eventType;

        // Restore funds
        const rate = CURRENCIES['NGN']?.rate || 1;
        db.author.payoutBalanceUSD += withdrawal.amountLocal / rate;
        db.author.totalWithdrawn = Math.max(0, (db.author.totalWithdrawn || 0) - withdrawal.amountLocal / rate);

        // Ledger: refund
        addLedgerEntry({
          referenceId: withdrawal.id,
          userId: db.author.id,
          sellerId: db.author.id,
          type: 'refund',
          amount: withdrawal.amountLocal,
          currency: 'NGN',
          direction: 'credit',
          status: 'completed',
          description: `Withdrawal reversed/failed. Funds restored. Reason: ${data.reason || eventType}`,
        });
      }

      console.log(`[webhook] ${eventType}: Withdrawal ${withdrawal.id} failed, funds restored`);
      break;
    }

    default:
      console.log(`[webhook] Unhandled event: ${eventType}`);
  }
}

// ══════════════════════════════════════════════════════════════════
// LEDGER & WALLET
// ══════════════════════════════════════════════════════════════════
app.get('/api/ledger', (req, res) => {
  const { sellerId, type, limit } = req.query;
  let entries = db.ledger;

  if (sellerId) entries = entries.filter(e => e.sellerId === sellerId || e.userId === sellerId);
  if (type) entries = entries.filter(e => e.type === type);

  const max = parseInt(limit as string) || 50;
  res.json(entries.slice(0, max));
});

app.get('/api/wallet', (_req, res) => {
  const rate = CURRENCIES['NGN']?.rate || 1;
  const availableNgn = (db.author.payoutBalanceUSD || 0) * rate;
  const totalSalesNgn = (db.author.totalRevenueUSD || 0) * rate;
  const totalCommissionNgn = (db.author.totalCommissionPaid || 0) * rate;
  const totalWithdrawnNgn = (db.author.totalWithdrawn || 0) * rate;
  const totalWithdrawalFeesNgn = (db.author.totalWithdrawalFees || 0) * rate;

  res.json({
    availableBalanceNgn: Math.round(availableNgn),
    totalEarningsNgn: Math.round(totalSalesNgn),
    totalCommissionPaidNgn: Math.round(totalCommissionNgn),
    totalWithdrawnNgn: Math.round(totalWithdrawnNgn),
    totalWithdrawalFeesNgn: Math.round(totalWithdrawalFeesNgn),
    totalSales: db.author.totalSales || 0,
    booksPublished: db.books.filter(b => b.authorId === db.author.id).length,
  });
});

// ══════════════════════════════════════════════════════════════════
// EXISTING API ROUTES
// ══════════════════════════════════════════════════════════════════
app.get('/api/books', (_req, res) => res.json(db.books));

app.post('/api/books', (req, res) => {
  const book = req.body as EBook;
  const i = db.books.findIndex(b => b.id === book.id);
  if (i >= 0) db.books[i] = book; else db.books.unshift(book);
  saveDB(db); res.json(book);
});

app.put('/api/books/:id', (req, res) => {
  const i = db.books.findIndex(b => b.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  db.books[i] = { ...db.books[i], ...req.body };
  saveDB(db); res.json(db.books[i]);
});

app.delete('/api/books/:id', (req, res) => {
  db.books = db.books.filter(b => b.id !== req.params.id);
  saveDB(db); res.json({ ok: true });
});

app.get('/api/author', (_req, res) => res.json(db.author));

app.put('/api/author', (req, res) => {
  db.author = { ...db.author, ...req.body };
  saveDB(db); res.json(db.author);
});

app.get('/api/orders', (_req, res) => res.json(db.orders));

app.post('/api/orders', (req, res) => {
  const order = req.body as Order;
  db.orders.unshift(order);
  if (!db.library.includes(order.bookId)) db.library.unshift(order.bookId);
  saveDB(db); res.json(order);
});

app.get('/api/reviews', (req, res) => {
  const { bookId } = req.query;
  res.json(bookId ? db.reviews.filter(r => r.bookId === bookId) : db.reviews);
});

app.post('/api/reviews', (req, res) => {
  const review = req.body as Review;
  db.reviews.unshift(review);
  const br = db.reviews.filter(r => r.bookId === review.bookId);
  const bi = db.books.findIndex(b => b.id === review.bookId);
  if (bi >= 0 && br.length) {
    db.books[bi].rating = Number((br.reduce((s, r) => s + r.rating, 0) / br.length).toFixed(2));
    db.books[bi].reviewsCount = br.length;
  }
  saveDB(db); res.json(review);
});

app.get('/api/coupons', (_req, res) => res.json(db.coupons));

app.post('/api/coupons', (req, res) => {
  const c = req.body as Coupon;
  const i = db.coupons.findIndex(x => x.id === c.id);
  if (i >= 0) db.coupons[i] = c; else db.coupons.unshift(c);
  saveDB(db); res.json(db.coupons);
});

app.post('/api/coupons/validate', (req, res) => {
  const f = db.coupons.find(c => c.code.toUpperCase() === req.body.code.trim().toUpperCase() && c.active);
  res.json(f ? { valid: true, discountPercent: f.discountPercent, coupon: f } : { valid: false, discountPercent: 0 });
});

app.get('/api/library', (_req, res) => res.json(db.library));

app.post('/api/library', (req, res) => {
  if (!db.library.includes(req.body.bookId)) db.library.unshift(req.body.bookId);
  saveDB(db); res.json(db.library);
});

app.delete('/api/library/:bookId', (req, res) => {
  db.library = db.library.filter(id => id !== req.params.bookId);
  saveDB(db); res.json(db.library);
});

app.get('/api/currency', (_req, res) => res.json(db.currency));

app.put('/api/currency', (req, res) => {
  db.currency = req.body.currency;
  saveDB(db); res.json(db.currency);
});

app.get('/api/withdrawals', (_req, res) => res.json(db.withdrawals));

app.get('/api/users', (_req, res) => res.json(db.users));

app.post('/api/users', (req, res) => {
  const u = req.body as UserAccount;
  const i = db.users.findIndex(x => x.id === u.id);
  if (i >= 0) db.users[i] = u; else db.users.push(u);
  saveDB(db); res.json(u);
});

app.get('/api/user', (_req, res) => res.json(db.currentUser));

app.put('/api/user', (req, res) => {
  db.currentUser = req.body.user || null;
  saveDB(db); res.json(db.currentUser);
});

app.delete('/api/user', (_req, res) => {
  db.currentUser = null;
  saveDB(db); res.json(null);
});

// ── Frontend serving ─────────────────────────────────────────────
async function start() {
  if (IS_DEV) {
    const { createServer: createVite } = await import('vite');
    const vite = await createVite({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    console.log(`[dev] API + Vite on http://0.0.0.0:${PORT}`);
    console.log(`[dev] Paystack: ${isPaystackConfigured() ? 'LIVE mode' : 'SANDBOX mode (no API key)'}`);
    console.log(`[dev] Commission: ${DEFAULT_CONFIG.commissionPercent}% • Withdrawal fee: ₦${DEFAULT_CONFIG.withdrawalFee}`);
  } else {
    const dist = join(__dirname, 'dist');
    if (existsSync(dist)) {
      app.use(express.static(dist));
      app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
    }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server on http://0.0.0.0:${PORT}`));
}

start();
