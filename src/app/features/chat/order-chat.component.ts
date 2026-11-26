import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { CHAT_REPOSITORY } from '../../core/repositories/data.repositories';
import { OrdersStore } from '../../core/state/orders.store';
import { SessionStore } from '../../core/state/session.store';

@Component({
  selector: 'app-order-chat',
  imports: [DatePipe, FormsModule],
  templateUrl: './order-chat.component.html',
  styleUrl: './order-chat.component.css',
})
export class OrderChatComponent {
  private readonly chatRepo = inject(CHAT_REPOSITORY);
  protected readonly session = inject(SessionStore);
  protected readonly ordersStore = inject(OrdersStore);

  protected readonly messages = toSignal(
    toObservable(this.ordersStore.selectedOrder).pipe(
      switchMap((order) => (order ? this.chatRepo.watchMessages(order.id) : of([]))),
    ),
    { initialValue: [] },
  );

  protected readonly draftMessage = signal<string>('');
  protected readonly isSendingMessage = signal<boolean>(false);
  protected readonly chatError = signal<string | null>(null);

  protected async sendMessage(): Promise<void> {
    const text = this.draftMessage().trim();
    const order = this.ordersStore.selectedOrder();

    if (!text || !order || this.isSendingMessage()) {
      return;
    }

    this.chatError.set(null);
    this.isSendingMessage.set(true);
    try {
      await this.chatRepo.sendMessage({
        orderId: order.id,
        senderId: this.session.activeUserId(),
        senderName: this.session.activeUserName(),
        senderRole: this.session.activeUserRole(),
        text,
      });
      this.draftMessage.set('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo enviar el mensaje en Firestore.';
      this.chatError.set(message);
      console.error('[OrderChatComponent] Error al enviar mensaje:', err);
    } finally {
      this.isSendingMessage.set(false);
    }
  }
}
