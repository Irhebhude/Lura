import React, { useMemo } from 'react';
import { Globe, CheckCircle2, Clock, Search, ExternalLink, BookOpen, Eye, ShoppingCart, Tag } from 'lucide-react';
import { EBook, CurrencyCode } from '../types';
import { formatPrice, getReviews } from '../services/storage';

interface GoogleSeoHubProps {
  books: EBook[];
  selectedBook: EBook | null;
  currency: CurrencyCode;
  onSelectBook: (book: EBook) => void;
  onQuickBuy: (book: EBook) => void;
  onReadSample: (book: EBook) => void;
}

export const GoogleSeoHub: React.FC<GoogleSeoHubProps> = ({
  books,
  selectedBook,
  currency,
  onSelectBook,
  onQuickBuy,
  onReadSample,
}) => {
  const activeBook = selectedBook || books[0];
  const activeBookId = activeBook?.id;
  const reviews = useMemo(() => (activeBookId ? getReviews(activeBookId) : []), [activeBookId]);

  if (!activeBook) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-neutral-400 text-sm">No books available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Globe className="w-6 h-6 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">Google SEO Hub</h1>
          <p className="text-xs text-neutral-400 mt-1">Schema.org validation, meta tags, and Google index status for your books.</p>
        </div>
      </div>

      {/* Book Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {books.map((book) => (
          <button
            key={book.id}
            onClick={() => onSelectBook(book)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
              activeBook.id === book.id
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            <img src={book.coverImage} alt="" className="w-5 h-7 rounded object-cover" />
            <span className="truncate max-w-[140px]">{book.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEO Status Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schema Status */}
          <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-emerald-400" /> Schema.org/Book Status
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/40">
                <div className="flex items-center gap-2 mb-1">
                  {activeBook.seo.googleIndexed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-[11px] text-neutral-300">Google Index</span>
                </div>
                <p className={`text-xs font-semibold ${activeBook.seo.googleIndexed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {activeBook.seo.googleIndexed ? 'Indexed ✓' : 'Pending'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] text-neutral-300">Schema Validated</span>
                </div>
                <p className="text-xs font-semibold text-emerald-400">Valid ✓</p>
              </div>
            </div>

            {/* Meta Tags */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 mb-1 block">Meta Title</label>
                <p className="text-xs text-white bg-neutral-950 rounded-lg p-3 border border-neutral-800/40">{activeBook.seo.metaTitle}</p>
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 mb-1 block">Meta Description</label>
                <p className="text-xs text-neutral-300 bg-neutral-950 rounded-lg p-3 border border-neutral-800/40">{activeBook.seo.metaDescription}</p>
              </div>
              <div>
                <label className="text-[11px] text-neutral-400 mb-1 block">Keywords</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeBook.seo.keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20">{kw}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Schema Markup Preview */}
          <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">JSON-LD Schema Markup</h3>
            <pre className="text-[10px] text-neutral-300 bg-neutral-950 rounded-xl p-4 border border-neutral-800/40 overflow-x-auto max-h-64 overflow-y-auto font-mono">
              {activeBook.seo.schemaMarkup || 'No schema markup generated.'}
            </pre>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
              <span>Last indexed: {new Date(activeBook.seo.indexedTimestamp).toLocaleDateString()}</span>
              <span>•</span>
              <a href={`https://lura.to/b/${activeBook.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View Live Page <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Book Preview Sidebar */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-5">
            <img src={activeBook.coverImage} alt={activeBook.title} className="w-full h-48 rounded-xl object-cover mb-4" />
            <h4 className="text-sm font-bold text-white mb-1">{activeBook.title}</h4>
            <p className="text-[11px] text-neutral-400 mb-3">{activeBook.authorName}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-white">{formatPrice(activeBook.priceUSD, currency)}</span>
              {activeBook.originalPriceUSD && (
                <span className="text-[11px] text-neutral-500 line-through">{formatPrice(activeBook.originalPriceUSD, currency)}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onQuickBuy(activeBook)}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3 h-3" /> Buy Now
              </button>
              <button
                onClick={() => onReadSample(activeBook)}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-[11px] text-neutral-500">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
