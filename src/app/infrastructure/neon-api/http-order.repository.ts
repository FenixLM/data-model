import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, firstValueFrom, map, merge, of, startWith, switchMap } from 'rxjs';
import { Order } from '../../core/models/domain.models';
import { IOrderRepository } from '../../core/repositories/data.repositories';
import {
  API_BASE_URL,
  getRealtimeStream,
  toDbUserId,
  toDomainUserId,
} from './neon-api.helpers';

@Injectable()
export class HttpOrderRepository implements IOrderRepository {
  private readonly http = inject(HttpClient);

  watchOrders(): Observable<Order[]> {
    const refreshTrigger$ = merge(
      of(void 0),
      getRealtimeStream().pipe(
        filter((evt) => evt.type === 'orders'),
        map(() => void 0),
      ),
    );

    return refreshTrigger$.pipe(
      startWith(void 0),
      switchMap(() =>
        this.http.get<Order[]>(`${API_BASE_URL}/orders`).pipe(
          map((orders) =>
            orders.map((order) => ({
              ...order,
              userId: toDomainUserId(order.userId),
            })),
          ),
        ),
      ),
    );
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const created = await firstValueFrom(
      this.http.post<Order>(`${API_BASE_URL}/orders`, {
        userId: toDbUserId(order.userId),
        items: order.items,
        total: order.total,
      }),
    );

    return {
      ...created,
      userId: toDomainUserId(created.userId),
    };
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    await firstValueFrom(
      this.http.patch<void>(`${API_BASE_URL}/orders/${orderId}/status`, { status }),
    );
  }
}
