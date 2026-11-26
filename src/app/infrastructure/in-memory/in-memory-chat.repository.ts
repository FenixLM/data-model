import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { ChatMessage } from '../../core/models/domain.models';
import { IChatRepository } from '../../core/repositories/data.repositories';
import { INITIAL_ORDER_ID } from './in-memory-order.repository';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_init_01',
    orderId: INITIAL_ORDER_ID,
    senderId: 'u_client_01',
    senderName: 'Ana',
    senderRole: 'customer',
    text: 'Hola Carlos, por favor incluir salsa de tamarindo y sillao extra.',
    createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: 'msg_init_02',
    orderId: INITIAL_ORDER_ID,
    senderId: 'u_driver_01',
    senderName: 'Carlos',
    senderRole: 'driver',
    text: '¡Claro Ana! Ya estoy en Chifa Tay Pa esperando el empaque.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

@Injectable()
export class InMemoryChatRepository implements IChatRepository {
  private readonly messages$ = new BehaviorSubject<ChatMessage[]>(INITIAL_MESSAGES);
  private readonly channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mvp_chat_sync') : null;

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<ChatMessage[]>) => {
        if (Array.isArray(event.data)) {
          this.messages$.next(event.data);
        }
      };
    }
  }

  watchMessages(orderId: string): Observable<ChatMessage[]> {
    return this.messages$.asObservable().pipe(
      map((messages) => messages.filter((msg) => msg.orderId === orderId)),
    );
  }

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      ...msg,
      id: `msg_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...this.messages$.value, newMessage];
    this.messages$.next(updated);
    this.channel?.postMessage(updated);
    return newMessage;
  }
}
