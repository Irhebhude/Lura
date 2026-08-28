import React, { useMemo } from 'react';
import { X, Star, ShoppingCart, BookOpen, Eye, Globe, Tag, ShieldCheck, Clock, Download, CheckCircle2 } from 'lucide-react';
import { EBook, CurrencyCode } from '../types';
import { formatPrice, getReviews, downloadEbook } from '../services/storage';

interface EbookDetailModalProps {
  book: EBook;
  currency: CurrencyCode;
  isPurchased: boolean;
  onClose: () => void;
  onBuy: (book: EBook) => void;
  onReadSample: (book: EBook) => void;
  onViewAuthor: (handle: string) => void;
  onOpenGoogleSeo: (book: EBook) => void;
}

export const EbookDetailModal: React.FC<EbookDetailModalProps> = ({
  book,
  currency,
  isPurchased,
  onClose,
  onBuy,
  onReadSample,
  onViewAuthor,
  onOpenGoogleSeo,
}) => {
  const reviews = useMemo(() => getReviews(book.id), [book.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-2xl bg-neutral-900 border border-neutral-800 sm:rounded-2xl shadow-2xl overflow-hidden text-neutral-100 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Cover Header */}
        <div className={`relative h-56 bg-gradient-to-br ${book.coverGradient || 'from-neutral-800 to-neutral-900'}`}>
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-950/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-5 left-6 right-6">
            {book.originalPriceUSD && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-rose-500/90 text-white text-[10px] font-bold mb-2">
                {Math.round(((book.originalPriceUSD - book.priceUSD) / book.originalPriceUSD) * 100)}% OFF
              </span>
            )}
            <h2 className="text-2xl font-bold text-white font-serif">{book.title}</h2>
            <p className="text-xs text-neutral-300 mt-1">{book.subtitle}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Author & Meta */}
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              onClick={() => onViewAuthor(book.authorHandle)}
            >
              <img src={book.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="text-left">
                <span className="flex items-center gap-1 font-semibold text-white">
                  {book.authorName}
                  {book.authorVerified && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                </span>
                <span className="text-[10px] text-neutral-400">@{book.authorHandle}</span>
              </div>
            </button>
            <div className="flex items-center gap-1 text-[10px] text-neutral-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(book.publishDate).toLocaleDateString()}</span>
              <span className="mx-1">•</span>
              <span>{book.pagesCount} pages</span>
              <span className="mx-1">•</span>
              <span>{book.language}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-neutral-300 leading-relaxed">{book.description}</p>

          {/* Highlights */}
          {book.highlights.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white mb-2">What You'll Learn</h3>
              <ul className="space-y-1.5">
                {book.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-neutral-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags & Formats */}
          <div className="flex flex-wrap gap-1.5">
            {book.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span>Formats: {book.format.join(', ')}</span>
            {book.fileSizeMB && <span>• {book.fileSizeMB} MB</span>}
          </div>

          {/* Price & Actions */}
          <div className="bg-neutral-950 rounded-xl p-5 border border-neutral-800/40">
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-bold text-white">{formatPrice(book.priceUSD, currency)}</span>
              {book.originalPriceUSD && (
                <span className="text-sm text-neutral-500 line-through mb-1">{formatPrice(book.originalPriceUSD, currency)}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-neutral-500 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>256-bit encrypted • Instant delivery • 95% to creator</span>
            </div>

            <div className="flex flex-col gap-2">
              {isPurchased ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => onReadSample(book)}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <BookOpen className="w-4 h-4" /> Read Full Book
                  </button>
                  {book.ebookFileUrl && (
                    <button
                      onClick={() => downloadEbook(book)}
                      className="px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onBuy(book)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => onReadSample(book)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Sample
                </button>
                <button
                  onClick={() => onOpenGoogleSeo(book)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  title="SEO Details"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white mb-3">Reviews ({reviews.length})</h3>
              <div className="space-y-2">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-white">{r.userName}</span>
                      <span className="text-[10px] text-amber-400">★ {r.rating}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
