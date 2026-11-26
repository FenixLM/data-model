import { Component } from '@angular/core';
import { CatalogCartComponent } from './features/catalog-cart/catalog-cart.component';
import { OrderChatComponent } from './features/chat/order-chat.component';
import { AppHeaderComponent } from './features/header/app-header.component';
import { OrdersPanelComponent } from './features/orders/orders-panel.component';

@Component({
  selector: 'app-root',
  imports: [
    AppHeaderComponent,
    CatalogCartComponent,
    OrdersPanelComponent,
    OrderChatComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
