import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../../core/models/domain.models';
import { IProductRepository } from '../../core/repositories/data.repositories';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_01',
    restaurantId: 'rest_chifa_tay_pa',
    name: 'Arroz Chaufa Especial',
    price: 26.0,
  },
  {
    id: 'prod_02',
    restaurantId: 'rest_chifa_tay_pa',
    name: 'Tallarín Saltado de Pollo',
    price: 24.5,
  },
  {
    id: 'prod_03',
    restaurantId: 'rest_chifa_tay_pa',
    name: 'Pollo Chijaukay con Wantán',
    price: 29.0,
  },
  {
    id: 'prod_04',
    restaurantId: 'rest_chifa_tay_pa',
    name: 'Sopa Wantán Especial (1L)',
    price: 22.0,
  },
];

@Injectable()
export class InMemoryProductRepository implements IProductRepository {
  private readonly products$ = new BehaviorSubject<Product[]>(INITIAL_PRODUCTS);
  private readonly channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mvp_products_sync') : null;

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<Product[]>) => {
        if (Array.isArray(event.data)) {
          this.products$.next(event.data);
        }
      };
    }
  }

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `prod_${crypto.randomUUID().slice(0, 8)}`,
    };

    const updated = [...this.products$.value, newProduct];
    this.products$.next(updated);
    this.channel?.postMessage(updated);
    return newProduct;
  }
}
