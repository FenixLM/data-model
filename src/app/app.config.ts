import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  CHAT_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_REPOSITORY,
  USER_REPOSITORY,
} from './core/repositories/data.repositories';
import { HttpChatRepository } from './infrastructure/neon-api/http-chat.repository';
import { HttpOrderRepository } from './infrastructure/neon-api/http-order.repository';
import { HttpProductRepository } from './infrastructure/neon-api/http-product.repository';
import { HttpUserRepository } from './infrastructure/neon-api/http-user.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: PRODUCT_REPOSITORY, useClass: HttpProductRepository },
    { provide: ORDER_REPOSITORY, useClass: HttpOrderRepository },
    { provide: CHAT_REPOSITORY, useClass: HttpChatRepository },
    { provide: USER_REPOSITORY, useClass: HttpUserRepository },
  ],
};
