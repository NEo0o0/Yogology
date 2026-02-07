'use client';

import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useSubscribers } from '@/hooks/useSubscribers';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { subscribe } = useSubscribers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      return;
    }

    setIsSubmitting(true);
    const result = await subscribe(email);
    
    if (result.success) {
      setEmail('');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-[var(--color-sage)]/10 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Mail size={48} className="text-[var(--color-sage)] mx-auto mb-4" />
        <h2 className="mb-4 text-[var(--color-earth-dark)]">Stay Updated</h2>
        <p className="text-[var(--color-stone)] mb-8 max-w-2xl mx-auto">
          Subscribe to our newsletter for class updates, wellness tips, and special offers.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-sand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="px-6 py-3 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
