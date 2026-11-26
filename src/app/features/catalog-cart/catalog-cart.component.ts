import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { OrderItem, Product } from '../../core/models/domain.models';
import { PRODUCT_REPOSITORY } from '../../core/repositories/data.repositories';
import { OrdersStore } from '../../core/state/orders.store';
import { SessionStore } from '../../core/state/session.store';

interface CartEntry {
  product: Product;
  quantity: number;
}

const DEFAULT_RESTAURANT_ID = 'rest_chifa_tay_pa';

@Component({
  selector: 'app-catalog-cart',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './catalog-cart.component.html',
  styleUrl: './catalog-cart.component.css',
})
export class CatalogCartComponent {
  private readonly productRepo = inject(PRODUCT_REPOSITORY);
  private readonly session = inject(SessionStore);
  private readonly ordersStore = inject(OrdersStore);

  protected readonly products = toSignal(this.productRepo.getProducts(), {
    initialValue: [],
  });

  protected readonly showCreateProductForm = signal<boolean>(false);
  protected readonly newProductName = signal<string>('');
  protected readonly newProductPrice = signal<string>('');
  protected readonly isCreatingProduct = signal<boolean>(false);

  protected readonly canCreateProduct = computed(() => {
    const name = this.newProductName().trim();
    const price = Number(this.newProductPrice());
    return name.length > 0 && Number.isFinite(price) && price > 0 && !this.isCreatingProduct();
  });

  protected readonly cart = signal<CartEntry[]>([]);
  protected readonly isCreatingOrder = signal<boolean>(false);
  protected readonly orderError = signal<string | null>(null);
  protected readonly isSeeding = signal<boolean>(false);

  protected readonly canSeed = computed(
    () =>
      this.products().length === 0 &&
      typeof (this.productRepo as { seedInitialData?: () => Promise<boolean> }).seedInitialData ===
        'function',
  );

  protected readonly cartTotal = computed(() =>
    this.cart().reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0),
  );

  protected readonly cartItemCount = computed(() =>
    this.cart().reduce((sum, entry) => sum + entry.quantity, 0),
  );

  protected toggleCreateProductForm(): void {
    this.showCreateProductForm.update((open) => !open);
  }

  protected async createProduct(): Promise<void> {
    if (!this.canCreateProduct()) {
      return;
    }

    const name = this.newProductName().trim();
    const price = Number(this.newProductPrice());

    this.isCreatingProduct.set(true);
    try {
      await this.productRepo.createProduct({
        restaurantId: DEFAULT_RESTAURANT_ID,
        name,
        price,
      });
      this.newProductName.set('');
      this.newProductPrice.set('');
      this.showCreateProductForm.set(false);
    } finally {
      this.isCreatingProduct.set(false);
    }
  }

  protected addToCart(product: Product): void {
    this.cart.update((entries) => {
      const existing = entries.find((e) => e.product.id === product.id);
      if (existing) {
        return entries.map((e) =>
          e.product.id === product.id ? { ...e, quantity: e.quantity + 1 } : e,
        );
      }
      return [...entries, { product, quantity: 1 }];
    });
  }

  protected updateCartQuantity(productId: string, delta: number): void {
    this.cart.update((entries) =>
      entries
        .map((e) => (e.product.id === productId ? { ...e, quantity: e.quantity + delta } : e))
        .filter((e) => e.quantity > 0),
    );
  }

  protected async createOrder(): Promise<void> {
    const entries = this.cart();
    if (entries.length === 0 || this.isCreatingOrder()) {
      return;
    }

    const activeUserId = this.session.activeUserId();
    const customerName = this.session.activeUserName();

    this.orderError.set(null);
    this.isCreatingOrder.set(true);
    try {
      const items: OrderItem[] = entries.map((e) => ({
        productId: e.product.id,
        name: e.product.name,
        quantity: e.quantity,
        unitPrice: e.product.price,
      }));

      await this.ordersStore.createOrder({
        userId: activeUserId,
        customerName,
        items,
        total: this.cartTotal(),
      });

      this.cart.set([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo crear la orden en Firestore.';
      this.orderError.set(message);
      console.error('[CatalogCartComponent] Error al crear orden:', err);
    } finally {
      this.isCreatingOrder.set(false);
    }
  }

  protected async seedInitialData(): Promise<void> {
    const repo = this.productRepo as { seedInitialData?: () => Promise<boolean> };
    if (!repo.seedInitialData || this.isSeeding()) {
      return;
    }

    this.isSeeding.set(true);
    try {
      await repo.seedInitialData();
    } finally {
      this.isSeeding.set(false);
    }
  }
}
