import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order } from '../../core/models/domain.models';
import { IOrderRepository } from '../../core/repositories/data.repositories';

export const INITIAL_ORDER_ID = 'ord_taypa_001';

const INITIAL_ORDERS: Order[] = [
  {
    id: INITIAL_ORDER_ID,
    userId: 'u_client_01',
    customerName: 'Ana',
    status: 'preparing',
    items: [
      {
        productId: 'prod_01',
        name: 'Arroz Chaufa Especial',
        quantity: 1,
        unitPrice: 26.0,
      },
      {
        productId: 'prod_04',
        name: 'Sopa Wantán Especial (1L)',
        quantity: 1,
        unitPrice: 22.0,
      },
    ],
    total: 48.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];

@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private readonly orders$ = new BehaviorSubject<Order[]>(INITIAL_ORDERS);
  private readonly channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mvp_orders_sync') : null;

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<Order[]>) => {
        if (Array.isArray(event.data)) {
          this.orders$.next(event.data);
        }
      };
    }
  }

  watchOrders(): Observable<Order[]> {
    return this.orders$.asObservable();
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: `ord_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newOrder, ...this.orders$.value];
    this.orders$.next(updated);
    this.channel?.postMessage(updated);
    return newOrder;
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const updated = this.orders$.value.map((order) =>
      order.id === orderId ? { ...order, status } : order,
    );
    this.orders$.next(updated);
    this.channel?.postMessage(updated);
  }
}
