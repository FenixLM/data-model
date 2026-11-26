import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ChatMessage,
  Order,
  Product,
  UserPrivate,
  UserProfile,
} from '../models/domain.models';

export interface IProductRepository {
  getProducts(): Observable<Product[]>;
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
}

export interface IOrderRepository {
  watchOrders(): Observable<Order[]>;
  createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order>;
  updateOrderStatus(orderId: string, status: Order['status']): Promise<void>;
}

export interface IChatRepository {
  watchMessages(orderId: string): Observable<ChatMessage[]>;
  sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage>;
}

export interface IUserRepository {
  getPublicProfiles(): Observable<UserProfile[]>;
  getPrivateUser(userId: string): Observable<UserPrivate | null>;
}

export const PRODUCT_REPOSITORY = new InjectionToken<IProductRepository>('PRODUCT_REPOSITORY');
export const ORDER_REPOSITORY = new InjectionToken<IOrderRepository>('ORDER_REPOSITORY');
export const CHAT_REPOSITORY = new InjectionToken<IChatRepository>('CHAT_REPOSITORY');
export const USER_REPOSITORY = new InjectionToken<IUserRepository>('USER_REPOSITORY');
