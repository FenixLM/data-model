import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../../core/models/domain.models';
import { IProductRepository } from '../../core/repositories/data.repositories';
import {
  DEFAULT_RESTAURANT_UUID,
  supabase,
  toDbRestaurantId,
} from './supabase.client';

interface DbProductRow {
  id: string;
  restaurant_id: string;
  name: string;
  price: number | string;
}

@Injectable()
export class SupabaseProductRepository implements IProductRepository {
  private readonly products$ = new BehaviorSubject<Product[]>([]);

  constructor() {
    void this.refreshProducts();
  }

  getProducts(): Observable<Product[]> {
    return this.products$.asObservable();
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const restaurantId = toDbRestaurantId(product.restaurantId);
    const { data, error } = await supabase
      .from('products')
      .insert({
        restaurant_id: restaurantId,
        name: product.name,
        price: product.price,
      })
      .select('id, restaurant_id, name, price')
      .single<DbProductRow>();

    if (error || !data) {
      throw new Error(error?.message ?? 'Error al crear producto en Supabase.');
    }

    const mapped = this.mapProduct(data);
    this.products$.next([...this.products$.value, mapped]);
    return mapped;
  }

  private async refreshProducts(): Promise<void> {
    const { data, error } = await supabase
      .from('products')
      .select('id, restaurant_id, name, price')
      .eq('restaurant_id', DEFAULT_RESTAURANT_UUID)
      .order('name', { ascending: true })
      .returns<DbProductRow[]>();

    if (error) {
      console.error('[SupabaseProductRepository] Error cargando productos:', error);
      return;
    }

    this.products$.next((data ?? []).map((row) => this.mapProduct(row)));
  }

  private mapProduct(row: DbProductRow): Product {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      name: row.name,
      price: Number(row.price),
    };
  }
}
