import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

export function useSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const activeSubscribers = subscribers;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setSubscribers(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (email: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email }])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error('This email is already subscribed!');
          return { success: false, error: 'Email already exists' };
        }
        throw insertError;
      }

      toast.success('Successfully subscribed to newsletter!');
      await fetchSubscribers();
      return { success: true, data };
    } catch (err) {
      console.error('Error subscribing:', err);
      toast.error('Failed to subscribe. Please try again.');
      return { success: false, error: err };
    }
  };

  const unsubscribe = async (id: number) => {
    try {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Subscriber removed successfully');
      await fetchSubscribers();
      return { success: true };
    } catch (err) {
      console.error('Error unsubscribing:', err);
      toast.error('Failed to remove subscriber');
      return { success: false, error: err };
    }
  };

  const deleteSubscriber = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Subscriber deleted successfully');
      await fetchSubscribers();
      return { success: true };
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      toast.error('Failed to delete subscriber');
      return { success: false, error: err };
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Email', 'Subscribed Date'],
        ...subscribers.map(sub => [
          sub.email,
          new Date(sub.created_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Subscribers exported successfully');
    } catch (err) {
      console.error('Error exporting:', err);
      toast.error('Failed to export subscribers');
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  return {
    subscribers,
    loading,
    error,
    subscribe,
    unsubscribe,
    deleteSubscriber,
    exportToCSV,
    refetch: fetchSubscribers
  };
}
