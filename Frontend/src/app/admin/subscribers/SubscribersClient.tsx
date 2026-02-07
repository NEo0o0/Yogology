'use client';

import { useState } from 'react';
import { Mail, Search, Download, Loader2, Trash2 } from 'lucide-react';
import { useSubscribers } from '@/hooks';

export function SubscribersClient() {
  const { subscribers, loading, deleteSubscriber, exportToCSV } = useSubscribers();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSubscribers = subscribers;

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Are you sure you want to delete subscriber ${email}?`)) {
      return;
    }

    setDeletingId(id);
    await deleteSubscriber(id);
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-earth-dark)] mb-2">
                Newsletter Subscribers
              </h1>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-[var(--color-sage)]/10 rounded-lg">
                  <span className="text-sm font-medium text-[var(--color-earth-dark)]">
                    Total Active: <span className="text-[var(--color-sage)] font-semibold">{activeSubscribers.length}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={exportToCSV}
              disabled={subscribers.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" size={20} />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]"
              />
            </div>
          </div>

          {/* Subscribers Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-[var(--color-sage)] animate-spin mb-4" />
              <p className="text-[var(--color-stone)]">Loading subscribers...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              {searchQuery ? (
                <>
                  <Search size={48} className="text-[var(--color-stone)] mb-4 opacity-50" />
                  <p className="text-[var(--color-stone)] text-lg mb-2">No results found</p>
                  <p className="text-sm text-[var(--color-stone)]">Try a different search term</p>
                </>
              ) : (
                <>
                  <Mail size={48} className="text-[var(--color-stone)] mb-4 opacity-50" />
                  <p className="text-[var(--color-stone)] text-lg mb-2">No subscribers yet</p>
                  <p className="text-sm text-[var(--color-stone)]">
                    Subscribers will appear here once they sign up
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--color-cream)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-earth-dark)]">
                      Email Address
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-earth-dark)]">
                      Subscribed Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-earth-dark)]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[var(--color-earth-dark)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-sand)]">
                  {filteredSubscribers.map((subscriber) => (
                    <tr 
                      key={subscriber.id}
                      className="hover:bg-[var(--color-cream)]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-[var(--color-sage)]" />
                          <span className="text-[var(--color-earth-dark)]">{subscriber.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-stone)]">
                        {new Date(subscriber.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(subscriber.id, subscriber.email)}
                          disabled={deletingId === subscriber.id}
                          className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        >
                          {deletingId === subscriber.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
