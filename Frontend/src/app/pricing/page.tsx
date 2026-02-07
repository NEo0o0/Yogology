import { Pricing } from '@/components/Pricing';
import { createSupabasePublicClient } from '@/utils/supabase/public';
import type { Tables } from '@/types/database.types';

export const revalidate = 30;

type DbPackage = Tables<'packages'>;

export default async function PricingPage() {
  const supabase = createSupabasePublicClient();

  const { data } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const initialPackages: DbPackage[] = (data ?? []) as unknown as DbPackage[];

  return <Pricing isAuthenticated={false} initialPackages={initialPackages} />;
}
