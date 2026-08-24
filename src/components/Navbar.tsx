import React, { useState } from 'react';
import { BookOpen, Sparkles, LayoutDashboard, Search, Globe, Library, PlusCircle, Flame, ShieldCheck, User, LogIn, UserPlus, LogOut, ChevronDown } from 'lucide-react';
import { CurrencyCode, UserAccount } from '../types';
import { CURRENCIES } from '../data/initialData';

interface NavbarProps {
  currentTab: 'marketplace' | 'library' | 'creator' | 'seo_hub' | 'author_store';
  setCurrentTab: (tab: 'marketplace' | 'library' | 'creator' | 'seo_hub' | 'author_store') => void;
  onOpenPublish: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  libraryCount: number;
  currentUser: UserAccount | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenPublish,
  searchQuery,
  setSearchQuery,
  currency,
  setCurrency,
  libraryCount,
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header id="lura-navbar" className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => setCurrentTab('marketplace')}
              className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
                <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-white font-serif">Lura</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block">Instant E-Book Storefront</p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-marketplace-btn"
                onClick={() => setCurrentTab('marketplace')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'marketplace'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Explore Books</span>
              </button>

              <button
                id="nav-library-btn"
                onClick={() => setCurrentTab('library')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative ${
                  currentTab === 'library'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Library className="w-4 h-4 text-indigo-400" />
                <span>My Bookshelf</span>
                {libraryCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {libraryCount}
                  </span>
                )}
              </button>

              <button
                id="nav-creator-btn"
                onClick={() => setCurrentTab('creator')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'creator'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Creator Studio</span>
              </button>

              <button
                id="nav-seo-btn"
                onClick={() => setCurrentTab('seo_hub')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentTab === 'seo_hub'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Google SEO Hub</span>
              </button>
            </nav>
          </div>

          {/* Search, Currency, Auth & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <div className="relative hidden lg:block w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentTab !== 'marketplace') setCurrentTab('marketplace');
                }}
                placeholder="Search e-books, authors..."
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            {/* Currency Selector */}
            <div className="relative">
              <select
                id="currency-select"
                aria-label="Select store currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none pr-7"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-neutral-900 text-white">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
                ▼
              </span>
            </div>

            {/* User Account / Auth Controls */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition-colors"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40"
                  />
                  <div className="hidden sm:block text-left">
                    <span className="block font-semibold text-white leading-tight truncate max-w-[100px]">{currentUser.name}</span>
                    <span className="block text-[10px] text-neutral-400 capitalize">{currentUser.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn text-xs"
                  >
                    <div className="px-3 py-2 border-b border-neutral-800/80 mb-1">
                      <p className="font-semibold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{currentUser.email}</p>
                      <span className="mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                        {currentUser.role} Account
                      </span>
                    </div>

                    <button
                      onClick={() => { setCurrentTab('creator'); setUserDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                      <span>Creator Dashboard & Wallet</span>
                    </button>

                    <button
                      onClick={() => { setCurrentTab('library'); setUserDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                    >
                      <Library className="w-4 h-4 text-indigo-400" />
                      <span>My Purchased Books ({libraryCount})</span>
                    </button>

                    <button
                      onClick={() => { setCurrentTab('author_store'); setUserDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left text-neutral-300 hover:text-white hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>View Public Storefront</span>
                    </button>

                    <div className="border-t border-neutral-800/80 my-1 pt-1">
                      <button
                        onClick={() => { onSignOut(); setUserDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="navbar-signin-btn"
                  onClick={() => onOpenAuth('signin')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sign In</span>
                </button>
                <button
                  id="navbar-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Up</span>
                </button>
              </div>
            )}

            {/* Publish E-book CTA Button */}
            <button
              id="publish-ebook-header-btn"
              onClick={onOpenPublish}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all transform active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Publish E-Book</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-neutral-800/60 overflow-x-auto gap-2 no-scrollbar">
          <button
            onClick={() => setCurrentTab('marketplace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 ${
              currentTab === 'marketplace' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Explore</span>
          </button>
          <button
            onClick={() => setCurrentTab('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 ${
              currentTab === 'library' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }`}
          >
            <Library className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bookshelf ({libraryCount})</span>
          </button>
          <button
            onClick={() => setCurrentTab('creator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 ${
              currentTab === 'creator' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setCurrentTab('seo_hub')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 ${
              currentTab === 'seo_hub' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google SEO</span>
          </button>
        </div>
      </div>
    </header>
  );
};
