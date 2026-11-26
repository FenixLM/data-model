import { Injectable } from '@angular/core';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { ChatMessage } from '../../core/models/domain.models';
import { IChatRepository } from '../../core/repositories/data.repositories';
import { db } from './firebase.client';

@Injectable()
export class FirestoreChatRepository implements IChatRepository {
  watchMessages(orderId: string): Observable<ChatMessage[]> {
    return new Observable<ChatMessage[]>((subscriber) => {
      const messagesRef = collection(db, 'orders', orderId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages: ChatMessage[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as Omit<ChatMessage, 'id'>;
            return {
              ...data,
              id: docSnap.id,
            };
          });
          subscriber.next(messages);
        },
        (error) => {
          console.error(`[FirestoreChatRepository] Error en watchMessages(${orderId}):`, error);
          subscriber.next([]);
        },
      );

      return () => unsubscribe();
    });
  }

  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const createdAt = new Date().toISOString();
    const payload: Omit<ChatMessage, 'id'> = {
      ...msg,
      createdAt,
    };

    const messagesRef = collection(db, 'orders', msg.orderId, 'messages');
    const docRef = await addDoc(messagesRef, payload);

    return {
      ...payload,
      id: docRef.id,
    };
  }
}
