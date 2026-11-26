export type UserRole = 'customer' | 'driver';

export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'delivered';

/**
 * Datos sensibles de identidad y contacto (NUNCA exponer en chat, órdenes ni vistas públicas).
 * Relación 1:1 con UserProfile mediante id === userId.
 */
export interface UserPrivate {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
}

/**
 * Perfil público seguro para mostrar en listados, órdenes y chat en vivo.
 * Relación 1:1 con UserPrivate.
 */
export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string;
}

export interface Product {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}
