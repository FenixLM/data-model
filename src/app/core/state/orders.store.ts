import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Order, OrderItem, OrderStatus } from '../models/domain.models';
import { ORDER_REPOSITORY } from '../repositories/data.repositories';

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
}

/**
 * Estado global de órdenes de compra y orden seleccionada para el chat.
 */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly orderRepo = inject(ORDER_REPOSITORY);

  readonly orders = toSignal(this.orderRepo.watchOrders(), {
    initialValue: [],
  });

  readonly selectedOrderId = signal<string | null>('ord_taypa_001');

  readonly selectedOrder = computed(() => {
    const id = this.selectedOrderId();
    const list = this.orders();
    if (!id) {
      return list[0] ?? null;
    }
    return list.find((o) => o.id === id) ?? list[0] ?? null;
  });

  selectOrder(orderId: string): void {
    this.selectedOrderId.set(orderId);
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const created = await this.orderRepo.createOrder({
      userId: input.userId,
      customerName: input.customerName,
      status: 'pending',
      items: input.items,
      total: input.total,
    });
    this.selectedOrderId.set(created.id);
    return created;
  }

  async changeOrderStatus(order: Order, status: OrderStatus): Promise<void> {
    if (order.status === status) {
      return;
    }
    await this.orderRepo.updateOrderStatus(order.id, status);
  }
}
