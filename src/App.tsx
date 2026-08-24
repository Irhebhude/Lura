import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MarketplaceView } from './components/MarketplaceView';
import { MyLibrary } from './components/MyLibrary';
import { CreatorDashboard } from './components/CreatorDashboard';
import { GoogleSeoHub } from './components/GoogleSeoHub';
import { AuthorStorefront } from './components/AuthorStorefront';
import { PublishModal } from './components/PublishModal';
import { EbookDetailModal } from './components/EbookDetailModal';
import { InstantCheckoutModal } from './components/InstantCheckoutModal';
import { WebReaderModal } from './components/WebReaderModal';
import { AuthModal } from './components/AuthModal';
import { EBook, CurrencyCode, AuthorProfile, Order, UserAccount } from './types';
import {
  initializeStorage,
  getEbooks,
  getAuthor,
  getLibraryBookIds,
  getSelectedCurrency,
  setSelectedCurrency,
  injectBookSchema,
  getCurrentUser,
  signOutUser,
} from './services/storage';
import { BookOpen, Globe, ShieldCheck } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<EBook[]>([]);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'library' | 'creator' | 'seo_hub' | 'author_store'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Navigation state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [detailModalBook, setDetailModalBook] = useState<EBook | null>(null);
  const [checkoutModalBook, setCheckoutModalBook] = useState<EBook | null>(null);
  const [readerModalBook, setReaderModalBook] = useState<EBook | null>(null);
  const [seoTargetBook, setSeoTargetBook] = useState<EBook | null>(null);
  const [viewingAuthorHandle, setViewingAuthorHandle] = useState<string>('prosperozoya');

  // Load state on mount & synchronize
  const syncState = () => {
    setBooks(getEbooks());
    setAuthor(getAuthor());
    setLibraryIds(getLibraryBookIds());
    setCurrencyState(getSelectedCurrency());
    setCurrentUser(getCurrentUser());
  };

  useEffect(() => {
    initializeStorage();
    syncState();

    const handleStorageUpdate = () => {
      syncState();
    };

    window.addEventListener('lura_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('lura_storage_update', handleStorageUpdate);
  }, []);

  const handleSetCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    setSelectedCurrency(code);
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSignOut = () => {
    signOutUser();
    syncState();
  };

  const handleOpenDetail = (book: EBook) => {
    setDetailModalBook(book);
    injectBookSchema(book);
  };

  const handleQuickBuy = (book: EBook) => {
    setCheckoutModalBook(book);
  };

  const handleReadSample = (book: EBook) => {
    setReaderModalBook(book);
  };

  const handleViewAuthor = (handle: string) => {
    setViewingAuthorHandle(handle);
    setCurrentTab('author_store');
  };

  const handleOpenGoogleSeo = (book: EBook) => {
    setSeoTargetBook(book);
    setCurrentTab('seo_hub');
  };

  const handlePublishSuccess = (newBook: EBook) => {
    syncState();
    setDetailModalBook(newBook);
  };

  const handleCheckoutSuccess = (_order: Order) => {
    syncState();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenPublish={() => {
          if (!currentUser) {
            handleOpenAuth('signin');
          } else {
            setPublishModalOpen(true);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currency={currency}
        setCurrency={handleSetCurrency}
        libraryCount={libraryIds.length}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'marketplace' && (
          <MarketplaceView
            books={books}
            currency={currency}
            libraryIds={libraryIds}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectBook={handleOpenDetail}
            onQuickBuy={handleQuickBuy}
            onReadSample={handleReadSample}
            onViewAuthor={handleViewAuthor}
            onOpenPublish={() => setPublishModalOpen(true)}
            onOpenGoogleSeo={handleOpenGoogleSeo}
          />
        )}

        {currentTab === 'library' && (
          <MyLibrary
            books={books}
            currency={currency}
            onOpenReader={handleReadSample}
            onExplore={() => setCurrentTab('marketplace')}
            onSelectBook={handleOpenDetail}
          />
        )}

        {currentTab === 'creator' && (
          <CreatorDashboard
            books={books}
            currency={currency}
            onOpenPublish={() => setPublishModalOpen(true)}
            onSelectBook={handleOpenDetail}
            onOpenGoogleSeo={handleOpenGoogleSeo}
            onViewAuthorStore={handleViewAuthor}
          />
        )}

        {currentTab === 'seo_hub' && (
          <GoogleSeoHub
            books={books}
            selectedBook={seoTargetBook}
            currency={currency}
            onSelectBook={handleOpenDetail}
            onQuickBuy={handleQuickBuy}
            onReadSample={handleReadSample}
          />
        )}

        {currentTab === 'author_store' && author && (
          <AuthorStorefront
            authorHandle={viewingAuthorHandle}
            books={books}
            authorProfile={author}
            currency={currency}
            onSelectBook={handleOpenDetail}
            onQuickBuy={handleQuickBuy}
            onReadSample={handleReadSample}
            onBack={() => setCurrentTab('marketplace')}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(_user) => {
          syncState();
        }}
      />

      {publishModalOpen && (
        <PublishModal
          currency={currency}
          onClose={() => setPublishModalOpen(false)}
          onSuccess={handlePublishSuccess}
        />
      )}

      {detailModalBook && (
        <EbookDetailModal
          book={detailModalBook}
          currency={currency}
          isPurchased={libraryIds.includes(detailModalBook.id)}
          onClose={() => setDetailModalBook(null)}
          onBuy={(book) => {
            setDetailModalBook(null);
            setCheckoutModalBook(book);
          }}
          onReadSample={(book) => {
            setDetailModalBook(null);
            setReaderModalBook(book);
          }}
          onViewAuthor={handleViewAuthor}
          onOpenGoogleSeo={handleOpenGoogleSeo}
        />
      )}

      {checkoutModalBook && (
        <InstantCheckoutModal
          book={checkoutModalBook}
          currency={currency}
          onClose={() => setCheckoutModalBook(null)}
          onSuccess={handleCheckoutSuccess}
          onOpenReader={(book) => setReaderModalBook(book)}
        />
      )}

      {readerModalBook && (
        <WebReaderModal
          book={readerModalBook}
          isPurchased={libraryIds.includes(readerModalBook.id)}
          onClose={() => setReaderModalBook(null)}
          onUnlockFullBook={() => {
            const b = readerModalBook;
            setReaderModalBook(null);
            setCheckoutModalBook(b);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950/90 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-400 p-0.5">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-sm font-bold text-white font-serif">Lura</span>
              <p className="text-[11px] text-neutral-500">The Instant E-Book Publishing & Global Selling Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <Globe className="w-3.5 h-3.5" /> Googlebot Schema.org/Book Validated
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> 256-Bit Encrypted Payments
            </span>
            <span>•</span>
            <span>95% Creator Payouts</span>
          </div>

          <div className="text-[11px] text-neutral-500">
            © {new Date().getFullYear()} Lura. Built for digital authors and readers worldwide.
          </div>

        </div>
      </footer>

    </div>
  );
    }
