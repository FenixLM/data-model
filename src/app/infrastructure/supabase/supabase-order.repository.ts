import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, OrderItem, OrderStatus } from '../../core/models/domain.models';
import { IOrderRepository } from '../../core/repositories/data.repositories';
import {
  DEFAULT_RESTAURANT_UUID,
  supabase,
  toDbUserId,
  toDomainUserId,
} from './supabase.client';

interface DbOrderItemRow {
  product_id: string;
  quantity: number;
  unit_price: number | string;
  products: { name: string } | null;
}

interface DbOrderRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  status: OrderStatus;
  total: number | string;
  created_at: string;
  profiles: { display_name: string } | null;
  order_items: DbOrderItemRow[] | null;
}

@Injectable()
export class SupabaseOrderRepository implements IOrderRepository {
  watchOrders(): Observable<Order[]> {
    return new Observable<Order[]>((subscriber) => {
      let active = true;

      const fetchOrders = async (): Promise<void> => {
        const { data, error } = await supabase
          .from('orders')
          .select(
            'id, user_id, restaurant_id, status, total, created_at, profiles(display_name), order_items(product_id, quantity, unit_price, products(name))',
          )
          .order('created_at', { ascending: false })
          .returns<DbOrderRow[]>();

        if (!active) {
          return;
        }
        if (error) {
          console.error('[SupabaseOrderRepository] Error cargando órdenes:', error);
          subscriber.next([]);
          return;
        }

        subscriber.next((data ?? []).map((row) => this.mapOrder(row)));
      };

      void fetchOrders();

      const channel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            void fetchOrders();
          },
        )
        .subscribe();

      return () => {
        active = false;
        void supabase.removeChannel(channel);
      };
    });
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const dbUserId = toDbUserId(order.userId);

    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: dbUserId,
        restaurant_id: DEFAULT_RESTAURANT_UUID,
        status: order.status,
        total: order.total,
      })
      .select('id, user_id, status, total, created_at')
      .single<{
        id: string;
        user_id: string;
        status: OrderStatus;
        total: number | string;
        created_at: string;
      }>();

    if (orderError || !insertedOrder) {
      throw new Error(orderError?.message ?? 'Error al crear la orden en Supabase.');
    }

    const itemsPayload = order.items.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
    if (itemsError) {
      throw new Error(itemsError.message);
    }

    return {
      id: insertedOrder.id,
      userId: toDomainUserId(insertedOrder.user_id),
      customerName: order.customerName,
      status: insertedOrder.status,
      items: order.items,
      total: Number(insertedOrder.total),
      createdAt: insertedOrder.created_at,
    };
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapOrder(row: DbOrderRow): Order {
    const domainUserId = toDomainUserId(row.user_id);
    const items: OrderItem[] = (row.order_items ?? []).map((item) => ({
      productId: item.product_id,
      name: item.products?.name ?? 'Producto',
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    }));

    return {
      id: row.id,
      userId: domainUserId,
      customerName:
        row.profiles?.display_name ?? (domainUserId === 'u_driver_01' ? 'Carlos' : 'Ana'),
      status: row.status,
      items,
      total: Number(row.total),
      createdAt: row.created_at,
    };
  }
}
