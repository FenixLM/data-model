import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  CHAT_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_REPOSITORY,
  USER_REPOSITORY,
} from './core/repositories/data.repositories';
import { InMemoryChatRepository } from './infrastructure/in-memory/in-memory-chat.repository';
import { InMemoryOrderRepository } from './infrastructure/in-memory/in-memory-order.repository';
import { InMemoryProductRepository } from './infrastructure/in-memory/in-memory-product.repository';
import { InMemoryUserRepository } from './infrastructure/in-memory/in-memory-user.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
    { provide: CHAT_REPOSITORY, useClass: InMemoryChatRepository },
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  ],
};
