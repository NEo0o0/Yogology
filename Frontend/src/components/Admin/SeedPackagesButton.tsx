 "use client";

import { useState } from 'react';
import { Database, Check, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { samplePackages } from '@/utils/seedPackages';

export function SeedPackagesButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSeedPackages = async () => {
    setIsSeeding(true);
    setStatus('idle');
    setMessage('');

    try {
      const promises = samplePackages.map(async (pkg) => {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-baa97425/seed-package`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify(pkg),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to seed package ${pkg.name}`);
        }

        return response.json();
      });

      await Promise.all(promises);
      setStatus('success');
      setMessage(`Successfully seeded ${samplePackages.length} packages!`);
      
      // Refresh the page after 2 seconds to show new packages
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error seeding packages:', error);
      setStatus('error');
      setMessage('Failed to seed packages. Please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleSeedPackages}
        disabled={isSeeding || status === 'success'}
        className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 ${
          status === 'success'
            ? 'bg-green-600 text-white'
            : status === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-gradient-to-r from-[var(--color-sage)] to-[var(--color-clay)] text-white hover:opacity-90'
        }`}
      >
        {isSeeding ? (
          <>
            <Database size={20} className="animate-pulse" />
            <span>Seeding...</span>
          </>
        ) : status === 'success' ? (
          <>
            <Check size={20} />
            <span>Seeded!</span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle size={20} />
            <span>Error</span>
          </>
        ) : (
          <>
            <Database size={20} />
            <span>Seed Packages</span>
          </>
        )}
      </button>
      
      {message && (
        <div className={`mt-2 px-4 py-2 rounded-lg text-sm ${
          status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
