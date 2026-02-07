import { createBrowserClient } from '@supabase/ssr';
import { projectId, publicAnonKey } from './info';
import type { Database } from '../../types/database.types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
