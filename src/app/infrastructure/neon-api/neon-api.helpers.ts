import { Observable, share } from 'rxjs';

export const API_BASE_URL = 'http://localhost:3000/api';
export const DEFAULT_RESTAURANT_UUID = '33333333-3333-4333-8333-333333333303';

export interface RealtimeStreamEvent {
  type: 'orders' | 'messages';
  orderId?: string;
}

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

let sharedStream$: Observable<RealtimeStreamEvent> | null = null;

export function getRealtimeStream(): Observable<RealtimeStreamEvent> {
  if (!sharedStream$) {
    sharedStream$ = new Observable<RealtimeStreamEvent>((subscriber) => {
      if (typeof EventSource === 'undefined') {
        return;
      }

      const source = new EventSource(`${API_BASE_URL}/stream`);
      source.onmessage = (event: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(event.data) as RealtimeStreamEvent;
          subscriber.next(parsed);
        } catch {
          // Ignorar heartbeats o payloads no JSON
        }
      };
      source.onerror = (err) => {
        console.warn('[SSE] Reconectando stream de NestJS...', err);
      };

      return () => {
        source.close();
      };
    }).pipe(share());
  }

  return sharedStream$;
}
