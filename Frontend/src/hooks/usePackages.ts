"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.types';

type Package = Tables<'packages'>;
type PackageInsert = TablesInsert<'packages'>;
type PackageUpdate = TablesUpdate<'packages'>;
type UserPackage = Tables<'user_packages'>;
type UserPackageInsert = TablesInsert<'user_packages'>;

interface UsePackagesOptions {
  activeOnly?: boolean;
  autoFetch?: boolean;
  initialPackages?: Package[];
}

export function usePackages(options: UsePackagesOptions = {}) {
  const { activeOnly = true, autoFetch = true, initialPackages } = options;
  const [packages, setPackages] = useState<Package[]>(initialPackages ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('activeOnly', activeOnly ? 'true' : 'false');

      const response = await fetch(`/api/packages?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch packages (${response.status})`);
      }

      const json = (await response.json()) as { data: Package[] };
      setPackages(json.data ?? []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPackages();
    }
  }, [activeOnly, autoFetch]);

  const createPackage = async (packageData: PackageInsert) => {
    try {
      const { data, error: createError } = await supabase
        .from('packages')
        .insert(packageData)
        .select()
        .single();

      if (createError) throw createError;

      setPackages(prev => [...prev, data]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updatePackage = async (id: number, updates: PackageUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPackages(prev => prev.map(p => (p.id === id ? data : p)));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deletePackage = async (id: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPackages(prev => prev.filter(p => p.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    packages,
    loading,
    error,
    fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  };
}

export function useUserPackages(userId?: string) {
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserPackages = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_packages')
        .select('*, packages(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUserPackages(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching user packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserPackages();
    }
  }, [userId]);

  const purchasePackage = async (packageId: number, userId: string) => {
    try {
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (packageError) throw packageError;

      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + packageData.duration_days);

      const userPackageData: UserPackageInsert = {
        user_id: userId,
        package_id: packageId,
        credits_remaining: packageData.credits,
        expire_at: expireAt.toISOString(),
        status: 'active',
      };

      const { data, error: createError } = await supabase
        .from('user_packages')
        .insert(userPackageData)
        .select('*, packages(*)')
        .single();

      if (createError) throw createError;

      setUserPackages(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const getActivePackage = () => {
    return userPackages.find(
      up => up.status === 'active' && 
      (up.credits_remaining === null || up.credits_remaining > 0) &&
      new Date(up.expire_at) > new Date()
    );
  };

  return {
    userPackages,
    loading,
    error,
    fetchUserPackages,
    purchasePackage,
    activePackage: getActivePackage(),
  };
}
