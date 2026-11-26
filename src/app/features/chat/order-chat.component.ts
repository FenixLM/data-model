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

  protected async sendMessage(): Promise<void> {
    const text = this.draftMessage().trim();
    const order = this.ordersStore.selectedOrder();
    const profile = this.session.activeProfile();
    const privateUser = this.session.activePrivateUser();

    if (!text || !order || !profile || !privateUser || this.isSendingMessage()) {
      return;
    }

    this.isSendingMessage.set(true);
    try {
      await this.chatRepo.sendMessage({
        orderId: order.id,
        senderId: profile.userId,
        senderName: profile.displayName,
        senderRole: privateUser.role,
        text,
      });
      this.draftMessage.set('');
    } finally {
      this.isSendingMessage.set(false);
    }
  }
}
