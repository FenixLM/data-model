import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, firstValueFrom, map, merge, of, startWith, switchMap } from 'rxjs';
import { ChatMessage } from '../../core/models/domain.models';
import { IChatRepository } from '../../core/repositories/data.repositories';
import {
  API_BASE_URL,
  getRealtimeStream,
  toDbUserId,
  toDomainUserId,
} from './neon-api.helpers';

@Injectable()
export class HttpChatRepository implements IChatRepository {
  private readonly http = inject(HttpClient);

  watchMessages(orderId: string): Observable<ChatMessage[]> {
    const refreshTrigger$ = merge(
      of(void 0),
      getRealtimeStream().pipe(
        filter((evt) => evt.type === 'messages' && evt.orderId === orderId),
        map(() => void 0),
      ),
    );

    return refreshTrigger$.pipe(
      startWith(void 0),
      switchMap(() =>
        this.http.get<ChatMessage[]>(`${API_BASE_URL}/orders/${orderId}/messages`).pipe(
          map((messages) =>
            messages.map((msg) => ({
              ...msg,
              senderId: toDomainUserId(msg.senderId),
            })),
          ),
        ),
      ),
    );
  }

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const created = await firstValueFrom(
      this.http.post<ChatMessage>(`${API_BASE_URL}/orders/${msg.orderId}/messages`, {
        senderId: toDbUserId(msg.senderId),
        text: msg.text,
      }),
    );

    return {
      ...created,
      senderId: toDomainUserId(created.senderId),
    };
  }
}
