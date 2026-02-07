// Extended Profile type with health_condition field
export interface ProfileWithHealth {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  health_condition: string | null;
  phone: string | null;
  email?: string | null;
  role?: string | null;
}
