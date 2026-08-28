import React, { useState, useMemo } from 'react';
import { X, BookOpen, ArrowLeft, ArrowRight, ShoppingCart, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { EBook } from '../types';

interface WebReaderModalProps {
  book: EBook;
  isPurchased: boolean;
  onClose: () => void;
  onUnlockFullBook: () => void;
}

export const WebReaderModal: React.FC<WebReaderModalProps> = ({
  book,
  isPurchased,
  onClose,
  onUnlockFullBook,
}) => {
  const chapters = useMemo(() => {
    if (isPurchased && book.fullChapters.length > 0) return book.fullChapters;
    return book.sampleChapters.length > 0 ? book.sampleChapters : book.fullChapters.slice(0, 1);
  }, [book, isPurchased]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [showToc, setShowToc] = useState(false);

  const currentChapter = chapters[currentIdx];

  const goNext = () => {
    if (currentIdx < chapters.length - 1) setCurrentIdx(currentIdx + 1);
  };
  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[90vh]">
        {/* Reader Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <img src={book.coverImage} alt="" className="w-8 h-10 rounded-md object-cover shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{book.title}</p>
              <p className="text-[10px] text-neutral-400">{book.authorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPurchased && (
              <button
                onClick={onUnlockFullBook}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ShoppingCart className="w-3 h-3" /> Unlock Full Book
              </button>
            )}
            <button
              onClick={() => setShowToc(!showToc)}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-colors"
              title="Table of Contents"
            >
              {showToc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table of Contents */}
        {showToc && (
          <div className="border-b border-neutral-800/80 bg-neutral-950/60 px-5 py-3">
            <p className="text-[11px] text-neutral-400 mb-2 font-medium">Table of Contents</p>
            <div className="space-y-1">
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => { setCurrentIdx(i); setShowToc(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                    i === currentIdx
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reader Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-[300px]">
          {currentChapter ? (
            <>
              <h2 className="text-lg font-bold text-white font-serif mb-4">{currentChapter.title}</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                {currentChapter.content.split('\n').map((paragraph, i) => {
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={i} className="text-sm font-bold text-white mt-4 mb-2">{paragraph.slice(4)}</h3>;
                  }
                  if (paragraph.startsWith('#### ')) {
                    return <h4 key={i} className="text-xs font-semibold text-neutral-200 mt-3 mb-1.5">{paragraph.slice(5)}</h4>;
                  }
                  if (paragraph.trim() === '') return <div key={i} className="h-3" />;
                  const formatted = paragraph
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="text-neutral-300">$1</em>')
                    .replace(/`([^`]+)`/g, '<code class="text-indigo-300 bg-neutral-800 px-1 py-0.5 rounded text-[11px]">$1</code>');
                  return (
                    <p
                      key={i}
                      className="text-xs text-neutral-300 leading-relaxed mb-3"
                      dangerouslySetInnerHTML={{ __html: formatted }}
                    />
                  );
                })}
              </div>

              {!isPurchased && currentIdx === chapters.length - 1 && (
                <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/20 text-center">
                  <Lock className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white mb-1">Continue reading?</p>
                  <p className="text-[11px] text-neutral-400 mb-4">
                    Unlock "{book.title}" to access all {book.fullChapters.length} chapters.
                  </p>
                  <button
                    onClick={onUnlockFullBook}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg transition-all"
                  >
                    Unlock Full Book
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
              <p className="text-xs text-neutral-500">No content available.</p>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800/80 bg-neutral-950/80">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-[11px] text-neutral-500">
            Chapter {currentIdx + 1} of {chapters.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIdx === chapters.length - 1}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-30"
          >
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
