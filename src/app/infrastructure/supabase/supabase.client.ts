import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

export const DEFAULT_RESTAURANT_UUID = '33333333-3333-4333-8333-333333333303';

const DOMAIN_TO_DB_USER_ID: Record<string, string> = {
  u_client_01: '11111111-1111-4111-8111-111111111101',
  u_driver_01: '22222222-2222-4222-8222-222222222202',
};

const DB_TO_DOMAIN_USER_ID: Record<string, string> = {
  '11111111-1111-4111-8111-111111111101': 'u_client_01',
  '22222222-2222-4222-8222-222222222202': 'u_driver_01',
};

export function toDbUserId(userId: string): string {
  return DOMAIN_TO_DB_USER_ID[userId] ?? userId;
}

export function toDomainUserId(dbUserId: string): string {
  return DB_TO_DOMAIN_USER_ID[dbUserId] ?? dbUserId;
}

export function toDbRestaurantId(restaurantId: string): string {
  return restaurantId === 'rest_chifa_tay_pa' ? DEFAULT_RESTAURANT_UUID : restaurantId;
}
