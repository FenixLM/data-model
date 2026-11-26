import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  CHAT_REPOSITORY,
  ORDER_REPOSITORY,
  PRODUCT_REPOSITORY,
  USER_REPOSITORY,
} from './core/repositories/data.repositories';
import { SupabaseChatRepository } from './infrastructure/supabase/supabase-chat.repository';
import { SupabaseOrderRepository } from './infrastructure/supabase/supabase-order.repository';
import { SupabaseProductRepository } from './infrastructure/supabase/supabase-product.repository';
import { SupabaseUserRepository } from './infrastructure/supabase/supabase-user.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: PRODUCT_REPOSITORY, useClass: SupabaseProductRepository },
    { provide: ORDER_REPOSITORY, useClass: SupabaseOrderRepository },
    { provide: CHAT_REPOSITORY, useClass: SupabaseChatRepository },
    { provide: USER_REPOSITORY, useClass: SupabaseUserRepository },
  ],
};
