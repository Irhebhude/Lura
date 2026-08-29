import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, BookOpen, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { signInUser, signUpUser } from '../services/storage';
import { UserAccount } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onAuthSuccess?: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState<'creator' | 'reader'>('creator');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signInUser(email, password);
        if (result.success && result.user) {
          setSuccessMsg(`Welcome back, ${result.user.name}!`);
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(result.user!);
            onClose();
          }, 600);
        } else {
          setError(result.error || 'Failed to sign in. Please verify your credentials.');
        }
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const result = await signUpUser({
          name,
          email,
          password,
          role,
          handle,
        });
        if (result.success && result.user) {
          setSuccessMsg(`Account created successfully for ${result.user.name}!`);
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(result.user!);
            onClose();
          }, 600);
        } else {
          setError(result.error || 'Could not create account. Please check your details.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-neutral-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="auth-modal-container" 
        className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 sm:rounded-2xl shadow-2xl overflow-hidden text-neutral-100 relative rounded-t-2xl sm:rounded-2xl"
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-neutral-900 p-6 border-b border-neutral-800 relative">
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <span>{mode === 'signin' ? 'Sign in to Lura' : 'Create your Lura Account'}</span>
              </h2>
              <p className="text-xs text-neutral-400">
                {mode === 'signin' 
                  ? 'Access your bookshelf, publisher studio, and wallet.' 
                  : 'Start selling or reading premium digital e-books in seconds.'}
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-neutral-950/80 p-1 rounded-xl mt-5 border border-neutral-800/60">
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">I want to:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('creator')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      role === 'creator'
                        ? 'bg-indigo-950/50 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sell E-Books</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Author & Creator</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('reader')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      role === 'reader'
                        ? 'bg-indigo-950/50 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                      <span>Read Books</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Buyer & Reader</p>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Prosper Ozoya"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Storefront Handle for creators */}
              {role === 'creator' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Custom Store Handle</label>
                  <div className="flex items-center">
                    <span className="bg-neutral-800/80 border border-r-0 border-neutral-800 rounded-l-xl px-3 py-2.5 text-xs text-neutral-400 select-none">
                      lura.to/@
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="prosperozoya"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-r-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-neutral-300">Password</label>
              {mode === 'signup' && password.length > 0 && password.length < 6 && (
                <span className="text-[11px] text-rose-400">At least 6 characters</span>
              )}
              {mode === 'signin' && (
                <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">Forgot?</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to Account' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>


      </div>
    </div>
  );
};
