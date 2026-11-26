import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Order, OrderStatus } from '../../core/models/domain.models';
import { OrdersStore } from '../../core/state/orders.store';

@Component({
  selector: 'app-orders-panel',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './orders-panel.component.html',
  styleUrl: './orders-panel.component.css',
})
export class OrdersPanelComponent {
  protected readonly ordersStore = inject(OrdersStore);

  protected readonly orderStatuses: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'on_the_way', label: 'En camino' },
    { value: 'delivered', label: 'Entregado' },
  ];

  protected selectOrder(orderId: string): void {
    this.ordersStore.selectOrder(orderId);
  }

  protected async changeOrderStatus(order: Order, status: OrderStatus): Promise<void> {
    await this.ordersStore.changeOrderStatus(order, status);
  }

  protected getStatusLabel(status: OrderStatus): string {
    return this.orderStatuses.find((s) => s.value === status)?.label ?? status;
  }
}
