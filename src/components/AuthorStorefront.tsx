import React, { useMemo } from 'react';
import { ArrowLeft, Star, BookOpen, ShoppingCart, Eye, ExternalLink, MapPin } from 'lucide-react';
import { EBook, CurrencyCode, AuthorProfile } from '../types';
import { formatPrice } from '../services/storage';

interface AuthorStorefrontProps {
  authorHandle: string;
  books: EBook[];
  authorProfile: AuthorProfile;
  currency: CurrencyCode;
  onSelectBook: (book: EBook) => void;
  onQuickBuy: (book: EBook) => void;
  onReadSample: (book: EBook) => void;
  onBack: () => void;
}

export const AuthorStorefront: React.FC<AuthorStorefrontProps> = ({
  authorHandle,
  books,
  authorProfile,
  currency,
  onSelectBook,
  onQuickBuy,
  onReadSample,
  onBack,
}) => {
  const authorBooks = useMemo(
    () => books.filter((b) => b.authorHandle === authorHandle),
    [books, authorHandle]
  );

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      {/* Author Header */}
      <div className="bg-neutral-900 border border-neutral-800/60 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-transparent to-purple-950/40" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={authorProfile.avatar}
            alt={authorProfile.name}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/30"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white font-serif">{authorProfile.name}</h1>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs text-indigo-400 mb-2">@{authorProfile.handle}</p>
            <p className="text-xs text-neutral-400 max-w-lg mb-3">{authorProfile.bio}</p>
            <div className="flex flex-wrap gap-4 text-[11px] text-neutral-500">
              <span>{authorProfile.totalSales.toLocaleString()} total sales</span>
              <span>•</span>
              <span>{authorBooks.length} published books</span>
            </div>
            {authorProfile.socials && (
              <div className="flex gap-3 mt-3">
                {authorProfile.socials.twitter && (
                  <a href={authorProfile.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-[11px] text-neutral-400 hover:text-indigo-400 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Twitter
                  </a>
                )}
                {authorProfile.socials.website && (
                  <a href={authorProfile.socials.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-neutral-400 hover:text-indigo-400 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
                {authorProfile.socials.linkedin && (
                  <a href={authorProfile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-neutral-400 hover:text-indigo-400 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author's Books */}
      <h2 className="text-lg font-bold text-white font-serif mb-6">Published Books</h2>
      {authorBooks.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800/60">
          <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">No books published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {authorBooks.map((book) => (
            <div
              key={book.id}
              className="group bg-neutral-900 border border-neutral-800/60 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all"
            >
              <div
                className={`relative h-44 bg-gradient-to-br ${book.coverGradient || 'from-neutral-800 to-neutral-900'} overflow-hidden cursor-pointer`}
                onClick={() => onSelectBook(book)}
              >
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="p-5">
                <h3
                  className="text-sm font-bold text-white mb-1 cursor-pointer hover:text-indigo-400 transition-colors line-clamp-1"
                  onClick={() => onSelectBook(book)}
                >
                  {book.title}
                </h3>
                <p className="text-[11px] text-neutral-400 mb-3 line-clamp-2">{book.description}</p>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-4">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {book.rating}
                  <span className="mx-1">•</span>
                  <span>{book.reviewsCount} reviews</span>
                  <span className="mx-1">•</span>
                  <span>{book.salesCount.toLocaleString()} sold</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">{formatPrice(book.priceUSD, currency)}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onReadSample(book)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                      title="Read Sample"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onQuickBuy(book)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ShoppingCart className="w-3 h-3" /> Buy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
