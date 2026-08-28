import React, { useState } from 'react';
import { X, Upload, BookOpen, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { EBook, CurrencyCode } from '../types';
import { saveEbook, getAuthor } from '../services/storage';

interface PublishModalProps {
  currency: CurrencyCode;
  onClose: () => void;
  onSuccess: (book: EBook) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({ currency, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [category, setCategory] = useState('Business & SaaS');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('English');
  const [pagesCount, setPagesCount] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories = [
    'Business & SaaS', 'Design & UX', 'AI & Engineering', 'Marketing & Audience',
    'Food & Health', 'Self-Help', 'Finance', 'Technology', 'Writing & Creativity',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !priceUSD) {
      setError('Title, description, and price are required.');
      return;
    }

    const price = parseFloat(priceUSD);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const author = getAuthor();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const coverUrl = coverImage.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
      const gradients = [
        'from-indigo-600 via-purple-600 to-blue-800',
        'from-emerald-600 via-teal-600 to-cyan-800',
        'from-amber-600 via-orange-600 to-rose-700',
        'from-pink-600 via-rose-600 to-violet-800',
      ];

      const newBook: EBook = {
        id: `book_${Date.now()}`,
        slug,
        title: title.trim(),
        subtitle: subtitle.trim(),
        authorId: author.id,
        authorName: author.name,
        authorHandle: author.handle,
        authorAvatar: author.avatar,
        authorBio: author.bio,
        authorVerified: true,
        description: description.trim(),
        highlights: [],
        coverImage: coverUrl,
        coverGradient: gradients[Math.floor(Math.random() * gradients.length)],
        priceUSD: price,
        category,
        tags: tagList,
        language,
        pagesCount: parseInt(pagesCount) || 0,
        publishDate: new Date().toISOString().split('T')[0],
        format: ['PDF', 'EPUB'],
        rating: 0,
        reviewsCount: 0,
        salesCount: 0,
        sampleChapters: [],
        fullChapters: [],
        seo: {
          metaTitle: `${title.trim()} by ${author.name} - Buy & Read | Lura`,
          metaDescription: description.trim().slice(0, 160),
          keywords: tagList,
          googleIndexed: true,
          schemaMarkup: '',
          indexedTimestamp: new Date().toISOString(),
        },
      };

      saveEbook(newBook);
      setSuccessMsg(`"${newBook.title}" published successfully!`);
      setLoading(false);

      setTimeout(() => {
        onSuccess(newBook);
        onClose();
      }, 800);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-neutral-900 p-6 border-b border-neutral-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Publish E-Book</h2>
              <p className="text-xs text-neutral-400">Share your knowledge with readers worldwide.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Micro-SaaS Playbook"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. From Zero to $20k MRR"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Description *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A compelling description of your e-book..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Price (USD) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={priceUSD}
                onChange={(e) => setPriceUSD(e.target.value)}
                placeholder="29.00"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Pages</label>
              <input
                type="number"
                min="0"
                value={pagesCount}
                onChange={(e) => setPagesCount(e.target.value)}
                placeholder="200"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-neutral-900">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. SaaS, Entrepreneurship, React"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://... (optional, a default will be used)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : (
              <>
                <span>Publish E-Book</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
