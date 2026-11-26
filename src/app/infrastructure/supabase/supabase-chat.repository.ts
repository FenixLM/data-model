import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChatMessage, UserRole } from '../../core/models/domain.models';
import { IChatRepository } from '../../core/repositories/data.repositories';
import { supabase, toDbUserId, toDomainUserId } from './supabase.client';

interface DbMessageRow {
  id: string;
  order_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  profiles: { display_name: string } | null;
}

@Injectable()
export class SupabaseChatRepository implements IChatRepository {
  watchMessages(orderId: string): Observable<ChatMessage[]> {
    return new Observable<ChatMessage[]>((subscriber) => {
      let active = true;

      const fetchMessages = async (): Promise<void> => {
        const { data, error } = await supabase
          .from('order_messages')
          .select('id, order_id, sender_id, text, created_at, profiles(display_name)')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })
          .returns<DbMessageRow[]>();

        if (!active) {
          return;
        }
        if (error) {
          console.error(`[SupabaseChatRepository] Error cargando mensajes (${orderId}):`, error);
          subscriber.next([]);
          return;
        }

        subscriber.next((data ?? []).map((row) => this.mapMessage(row)));
      };

      void fetchMessages();

      const channel = supabase
        .channel(`order-messages-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`,
          },
          () => {
            void fetchMessages();
          },
        )
        .subscribe();

      return () => {
        active = false;
        void supabase.removeChannel(channel);
      };
    });
  }

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const dbSenderId = toDbUserId(msg.senderId);

    const { data, error } = await supabase
      .from('order_messages')
      .insert({
        order_id: msg.orderId,
        sender_id: dbSenderId,
        text: msg.text,
      })
      .select('id, order_id, sender_id, text, created_at')
      .single<{
        id: string;
        order_id: string;
        sender_id: string;
        text: string;
        created_at: string;
      }>();

    if (error || !data) {
      throw new Error(error?.message ?? 'Error al enviar el mensaje en Supabase.');
    }

    return {
      id: data.id,
      orderId: data.order_id,
      senderId: toDomainUserId(data.sender_id),
      senderName: msg.senderName,
      senderRole: msg.senderRole,
      text: data.text,
      createdAt: data.created_at,
    };
  }

  private mapMessage(row: DbMessageRow): ChatMessage {
    const domainSenderId = toDomainUserId(row.sender_id);
    const fallbackRole: UserRole = domainSenderId === 'u_driver_01' ? 'driver' : 'customer';

    return {
      id: row.id,
      orderId: row.order_id,
      senderId: domainSenderId,
      senderName:
        row.profiles?.display_name ?? (domainSenderId === 'u_driver_01' ? 'Carlos' : 'Ana'),
      senderRole: fallbackRole,
      text: row.text,
      createdAt: row.created_at,
    };
  }
}
