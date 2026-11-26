import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Order } from '../../core/models/domain.models';
import { IOrderRepository } from '../../core/repositories/data.repositories';
import { db } from './firebase.client';

@Injectable()
export class FirestoreOrderRepository implements IOrderRepository {
  private readonly ordersCollection = collection(db, 'orders');

  watchOrders(): Observable<Order[]> {
    return new Observable<Order[]>((subscriber) => {
      const q = query(this.ordersCollection, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders: Order[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as Omit<Order, 'id'>;
            return {
              ...data,
              id: docSnap.id,
            };
          });
          subscriber.next(orders);
        },
        (error) => {
          console.error('[FirestoreOrderRepository] Error en watchOrders:', error);
          subscriber.next([]);
        },
      );

      return () => unsubscribe();
    });
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const createdAt = new Date().toISOString();
    const payload: Omit<Order, 'id'> = {
      ...order,
      createdAt,
    };

    const docRef = await addDoc(this.ordersCollection, payload);
    return {
      ...payload,
      id: docRef.id,
    };
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  }
}
