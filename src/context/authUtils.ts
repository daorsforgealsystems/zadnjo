import type { User as SupabaseUser } from '@supabase/supabase-js';
import { ROLES, Role, User as AppUser } from '@/lib/types';

export function mapSupabaseUserToAppUser(supaUser: SupabaseUser | null): (AppUser & { email?: string }) | null {
  if (!supaUser) return null;
  const role: Role =
    (supaUser.user_metadata?.role as Role) ||
    (supaUser.app_metadata?.userrole as Role) ||
    ROLES.CLIENT;
  const username =
    supaUser.user_metadata?.username ||
    supaUser.user_metadata?.name ||
    supaUser.email?.split('@')?.[0] ||
    'user';
  return {
    id: supaUser.id,
    username,
    role,
    avatarUrl: supaUser.user_metadata?.avatar_url as string | undefined,
    associatedItemIds: [],
    email: supaUser.email ?? undefined,
  };
}
