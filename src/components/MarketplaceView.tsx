import React, { useMemo } from 'react';
import { Search, BookOpen, Star, ShoppingCart, Eye, PenLine, Globe, Tag, PlusCircle, Filter } from 'lucide-react';
import { EBook, CurrencyCode } from '../types';
import { formatPrice } from '../services/storage';

interface MarketplaceViewProps {
  books: EBook[];
  currency: CurrencyCode;
  libraryIds: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectBook: (book: EBook) => void;
  onQuickBuy: (book: EBook) => void;
  onReadSample: (book: EBook) => void;
  onViewAuthor: (handle: string) => void;
  onOpenPublish: () => void;
  onOpenGoogleSeo: (book: EBook) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  books,
  currency,
  libraryIds,
  searchQuery,
  setSearchQuery,
  onSelectBook,
  onQuickBuy,
  onReadSample,
  onViewAuthor,
  onOpenPublish,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(books.map((b) => b.category));
    return ['All', ...Array.from(cats)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedCategory !== 'All') {
      result = result.filter((b) => b.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [books, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-neutral-900 to-purple-950 border border-neutral-800/60 p-8 sm:p-12 mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-3">
            Discover Premium E-Books
          </h1>
          <p className="text-neutral-400 text-sm max-w-xl mb-6">
            Instant delivery, multi-currency checkout, and a built-in web reader. Buy once, read forever.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenPublish}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Publish Your E-Book
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or tag..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm">No books found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const inLibrary = libraryIds.includes(book.id);
            return (
              <div
                key={book.id}
                className="group bg-neutral-900 border border-neutral-800/60 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
              >
                {/* Cover */}
                <div
                  className={`relative h-48 bg-gradient-to-br ${book.coverGradient || 'from-neutral-800 to-neutral-900'} overflow-hidden cursor-pointer`}
                  onClick={() => onSelectBook(book)}
                >
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  {book.originalPriceUSD && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-rose-500/90 text-white text-[10px] font-bold">
                      {Math.round(((book.originalPriceUSD - book.priceUSD) / book.originalPriceUSD) * 100)}% OFF
                    </span>
                  )}
                  {inLibrary && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Owned
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className="text-sm font-bold text-white line-clamp-1 cursor-pointer hover:text-indigo-400 transition-colors"
                      onClick={() => onSelectBook(book)}
                    >
                      {book.title}
                    </h3>
                    <span className="text-[10px] text-neutral-500 shrink-0">{book.pagesCount}p</span>
                  </div>

                  <button
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors mb-2 flex items-center gap-1"
                    onClick={() => onViewAuthor(book.authorHandle)}
                  >
                    {book.authorVerified && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {book.authorName}
                  </button>

                  <p className="text-[11px] text-neutral-500 line-clamp-2 mb-3">{book.description}</p>

                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {book.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {book.rating}
                    </span>
                    <span>•</span>
                    <span>{book.reviewsCount} reviews</span>
                    <span>•</span>
                    <span>{book.salesCount.toLocaleString()} sold</span>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-white">{formatPrice(book.priceUSD, currency)}</span>
                      {book.originalPriceUSD && (
                        <span className="ml-2 text-[11px] text-neutral-500 line-through">
                          {formatPrice(book.originalPriceUSD, currency)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onReadSample(book)}
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                        title="Read Sample"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {!inLibrary && (
                        <button
                          onClick={() => onQuickBuy(book)}
                          className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <ShoppingCart className="w-3 h-3" /> Buy
                        </button>
                      )}
                      {inLibrary && (
                        <button
                          onClick={() => onReadSample(book)}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" /> Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
