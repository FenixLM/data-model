import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Product } from '../../core/models/domain.models';
import { IProductRepository } from '../../core/repositories/data.repositories';
import { API_BASE_URL, toDbRestaurantId } from './neon-api.helpers';

@Injectable()
export class HttpProductRepository implements IProductRepository {
  private readonly http = inject(HttpClient);
  private readonly products$ = new BehaviorSubject<Product[]>([]);

  constructor() {
    void this.refreshProducts();
  }

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const created = await firstValueFrom(
      this.http.post<Product>(`${API_BASE_URL}/products`, {
        restaurantId: toDbRestaurantId(product.restaurantId),
        name: product.name,
        price: product.price,
      }),
    );

    this.products$.next([...this.products$.value, created]);
    return created;
  }

  private async refreshProducts(): Promise<void> {
    try {
      const list = await firstValueFrom(this.http.get<Product[]>(`${API_BASE_URL}/products`));
      this.products$.next(list);
    } catch (error) {
      console.error('[HttpProductRepository] Error cargando productos:', error);
    }
  }
}
