"use client";

import { useState, useEffect } from 'react';
import { Download, Search, Trash2, Calendar, Mail, Loader2, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  status: 'active' | 'unsubscribed';
}

export function NewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-baa97425/newsletter-subscribers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }

      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete subscriber ${email}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-baa97425/newsletter-subscribers/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete subscriber');
      }

      setSubscribers(prev => prev.filter(sub => sub.id !== id));
      toast.success('Subscriber deleted successfully');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Failed to delete subscriber');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-baa97425/newsletter-subscribers/export`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export subscribers');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Subscribers exported successfully');
    } catch (error) {
      console.error('Error exporting subscribers:', error);
      toast.error('Failed to export subscribers');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSubscribers = subscribers.filter(sub => sub.status === 'active');

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-[var(--color-earth-dark)] mb-2">
                Newsletter Subscribers
              </h1>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-[var(--color-sage)]/10 rounded-lg">
                  <span className="text-sm font-medium text-[var(--color-earth-dark)]">
                    Total Subscribers: <span className="text-[var(--color-sage)] font-semibold">{activeSubscribers.length}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isExporting || subscribers.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-sage)] text-white rounded-lg hover:bg-[var(--color-clay)] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Export CSV</span>
                </>
              )}
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search 
                size={20} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]" 
              />
              <input
                type="text"
                placeholder="Search email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[var(--color-sand)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:border-transparent"
              />
            </div>

            {/* Optional: Date Range Picker Placeholder */}
            <div className="relative">
              <button className="flex items-center gap-2 px-6 py-3 border border-[var(--color-sand)] rounded-lg hover:bg-[var(--color-cream)] transition-colors">
                <Calendar size={20} className="text-[var(--color-stone)]" />
                <span className="text-[var(--color-stone)]">All Time</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={48} className="text-[var(--color-sage)] animate-spin mb-4" />
              <p className="text-[var(--color-stone)]">Loading subscribers...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              {searchQuery ? (
                <>
                  <AlertCircle size={48} className="text-[var(--color-stone)] mb-4 opacity-50" />
                  <p className="text-[var(--color-stone)] text-lg mb-2">No results found</p>
                  <p className="text-sm text-[var(--color-stone)]">
                    Try adjusting your search query
                  </p>
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
                <thead>
                  <tr className="bg-[var(--color-sand)]/30 border-b border-[var(--color-sand)]">
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
                  {filteredSubscribers.map((subscriber, index) => (
                    <tr 
                      key={subscriber.id}
                      className={`transition-colors hover:bg-[var(--color-cream)]/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-[var(--color-sand)]/10'
                      }`}
                    >
                      {/* Email Address */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center">
                            <Mail size={18} className="text-[var(--color-sage)]" />
                          </div>
                          <span className="text-[var(--color-earth-dark)] font-medium">
                            {subscriber.email}
                          </span>
                        </div>
                      </td>

                      {/* Subscribed Date */}
                      <td className="px-6 py-4">
                        <span className="text-[var(--color-stone)]">
                          {formatDate(subscriber.subscribedAt)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            subscriber.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subscriber.status === 'active' ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(subscriber.id, subscriber.email)}
                            disabled={deletingId === subscriber.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete subscriber"
                          >
                            {deletingId === subscriber.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {filteredSubscribers.length > 0 && (
          <div className="mt-4 px-6 py-4 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-[var(--color-stone)]">
              Showing <span className="font-semibold text-[var(--color-earth-dark)]">{filteredSubscribers.length}</span> of <span className="font-semibold text-[var(--color-earth-dark)]">{subscribers.length}</span> subscribers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
