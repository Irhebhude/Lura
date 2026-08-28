import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { INITIAL_EBOOKS, INITIAL_AUTHOR, INITIAL_REVIEWS, INITIAL_COUPONS, CURRENCIES } from './src/data/initialData';
import type { EBook, AuthorProfile, Order, Review, Coupon, CurrencyCode, WithdrawalRequest, UserAccount } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || '3000');
const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
const DB_PATH = join(__dirname, 'data', 'db.json');

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
  };
}

function loadDB(): DB {
  if (!existsSync(DB_PATH)) { const db = defaultDB(); saveDB(db); return db; }
  try { return JSON.parse(readFileSync(DB_PATH, 'utf-8')); }
  catch { const db = defaultDB(); saveDB(db); return db; }
}

function saveDB(db: DB) {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── Express setup ────────────────────────────────────────────────
const app = express();
app.use(express.json());
let db = loadDB();

// ── API: All data at once (for frontend init) ────────────────────
app.get('/api/init', (_req, res) => res.json(db));

// ── API: Books ───────────────────────────────────────────────────
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

// ── API: Author ──────────────────────────────────────────────────
app.get('/api/author', (_req, res) => res.json(db.author));

app.put('/api/author', (req, res) => {
  db.author = { ...db.author, ...req.body };
  saveDB(db); res.json(db.author);
});

// ── API: Orders ──────────────────────────────────────────────────
app.get('/api/orders', (_req, res) => res.json(db.orders));

app.post('/api/orders', (req, res) => {
  const order = req.body as Order;
  db.orders.unshift(order);
  if (!db.library.includes(order.bookId)) db.library.unshift(order.bookId);
  const bi = db.books.findIndex(b => b.id === order.bookId);
  if (bi >= 0) db.books[bi].salesCount = (db.books[bi].salesCount || 0) + 1;
  const rate = CURRENCIES[order.currency]?.rate || 1;
  db.author.totalSales = (db.author.totalSales || 0) + 1;
  db.author.totalRevenueUSD = (db.author.totalRevenueUSD || 0) + (order.amountPaid / rate);
  db.author.payoutBalanceUSD = (db.author.payoutBalanceUSD || 0) + (order.amountPaid / rate) * 0.95;
  saveDB(db); res.json(order);
});

// ── API: Reviews ─────────────────────────────────────────────────
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

// ── API: Coupons ─────────────────────────────────────────────────
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

// ── API: Library ─────────────────────────────────────────────────
app.get('/api/library', (_req, res) => res.json(db.library));

app.post('/api/library', (req, res) => {
  if (!db.library.includes(req.body.bookId)) db.library.unshift(req.body.bookId);
  saveDB(db); res.json(db.library);
});

app.delete('/api/library/:bookId', (req, res) => {
  db.library = db.library.filter(id => id !== req.params.bookId);
  saveDB(db); res.json(db.library);
});

// ── API: Currency ────────────────────────────────────────────────
app.get('/api/currency', (_req, res) => res.json(db.currency));

app.put('/api/currency', (req, res) => {
  db.currency = req.body.currency;
  saveDB(db); res.json(db.currency);
});

// ── API: Withdrawals ─────────────────────────────────────────────
app.get('/api/withdrawals', (_req, res) => res.json(db.withdrawals));

app.post('/api/withdrawals', (req, res) => {
  const { amountUSD, currency } = req.body;
  if (amountUSD <= 0) return res.status(400).json({ success: false, message: 'Invalid amount.' });
  if (db.author.payoutBalanceUSD < amountUSD) return res.status(400).json({ success: false, message: 'Insufficient balance.' });
  if (!db.author.bankDetails?.accountNumber) return res.status(400).json({ success: false, message: 'Configure bank details first.' });
  const rate = CURRENCIES[currency]?.rate || 1;
  const w: WithdrawalRequest = {
    id: `wdr_${Date.now().toString().slice(-6)}`, amountUSD, amountLocal: amountUSD * rate, currency,
    bankName: db.author.bankDetails.bankName, accountNumber: db.author.bankDetails.accountNumber,
    accountName: db.author.bankDetails.accountName || db.author.name,
    status: 'completed', date: new Date().toISOString().split('T')[0],
    reference: `LURA-PAY-${Math.floor(1000000 + Math.random() * 9000000)}`,
  };
  db.author.payoutBalanceUSD -= amountUSD;
  db.withdrawals.unshift(w);
  saveDB(db);
  res.json({ success: true, message: `Successfully transferred ${CURRENCIES[currency].symbol}${w.amountLocal.toLocaleString()} to ${w.bankName}!`, withdrawal: w });
});

// ── API: Users ───────────────────────────────────────────────────
app.get('/api/users', (_req, res) => res.json(db.users));

app.post('/api/users', (req, res) => {
  const u = req.body as UserAccount;
  const i = db.users.findIndex(x => x.id === u.id);
  if (i >= 0) db.users[i] = u; else db.users.push(u);
  saveDB(db); res.json(u);
});

// ── API: Current User ────────────────────────────────────────────
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
