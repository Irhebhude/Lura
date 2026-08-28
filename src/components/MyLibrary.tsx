import React, { useMemo } from 'react';
import { BookOpen, ShoppingCart, Star, Eye } from 'lucide-react';
import { EBook, CurrencyCode } from '../types';
import { formatPrice, getLibraryBookIds } from '../services/storage';

interface MyLibraryProps {
  books: EBook[];
  currency: CurrencyCode;
  onOpenReader: (book: EBook) => void;
  onExplore: () => void;
  onSelectBook: (book: EBook) => void;
}

export const MyLibrary: React.FC<MyLibraryProps> = ({
  books,
  currency,
  onOpenReader,
  onExplore,
  onSelectBook,
}) => {
  const libraryData = useMemo(() => {
    const ids = getLibraryBookIds();
    return books.filter((b) => ids.includes(b.id));
  }, [books]);

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white font-serif">My Bookshelf</h1>
          <p className="text-xs text-neutral-400 mt-1">{libraryData.length} purchased {libraryData.length === 1 ? 'book' : 'books'}</p>
        </div>
        <button
          onClick={onExplore}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Explore More Books
        </button>
      </div>

      {libraryData.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900 rounded-2xl border border-neutral-800/60">
          <BookOpen className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Your bookshelf is empty</h3>
          <p className="text-sm text-neutral-400 mb-6">Browse the marketplace and purchase your first e-book.</p>
          <button
            onClick={onExplore}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {libraryData.map((book) => (
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
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold">
                  ✓ In Library
                </span>
              </div>
              <div className="p-5">
                <h3
                  className="text-sm font-bold text-white mb-1 cursor-pointer hover:text-indigo-400 transition-colors line-clamp-1"
                  onClick={() => onSelectBook(book)}
                >
                  {book.title}
                </h3>
                <p className="text-[11px] text-neutral-400 mb-1">{book.authorName}</p>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 mb-4">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {book.rating}
                  <span className="mx-1">•</span>
                  <span>{book.format.join(', ')}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenReader(book)}
                    className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" /> Read Now
                  </button>
                  <button
                    onClick={() => onOpenReader(book)}
                    className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    title="Quick Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
