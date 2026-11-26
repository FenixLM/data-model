import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  CHAT_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_REPOSITORY,
  USER_REPOSITORY,
} from './core/repositories/data.repositories';
import { FirestoreChatRepository } from './infrastructure/firebase/firestore-chat.repository';
import { FirestoreOrderRepository } from './infrastructure/firebase/firestore-order.repository';
import { FirestoreProductRepository } from './infrastructure/firebase/firestore-product.repository';
import { FirestoreUserRepository } from './infrastructure/firebase/firestore-user.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PRODUCT_REPOSITORY, useClass: FirestoreProductRepository },
    { provide: ORDER_REPOSITORY, useClass: FirestoreOrderRepository },
    { provide: CHAT_REPOSITORY, useClass: FirestoreChatRepository },
    { provide: USER_REPOSITORY, useClass: FirestoreUserRepository },
  ],
};
