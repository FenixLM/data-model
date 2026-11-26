import { Injectable } from '@angular/core';
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Product, UserPrivate, UserProfile } from '../../core/models/domain.models';
import { IProductRepository } from '../../core/repositories/data.repositories';
import { db } from './firebase.client';

const RESTAURANT_DOC_ID = 'rest_chifa_01';

interface RestaurantDoc {
  name: string;
  menu: Product[];
}

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_01',
    restaurantId: RESTAURANT_DOC_ID,
    name: 'Arroz Chaufa Especial',
    price: 26.0,
  },
  {
    id: 'prod_02',
    restaurantId: RESTAURANT_DOC_ID,
    name: 'Tallarín Saltado de Pollo',
    price: 24.5,
  },
  {
    id: 'prod_03',
    restaurantId: RESTAURANT_DOC_ID,
    name: 'Pollo Chijaukay con Wantán',
    price: 29.0,
  },
  {
    id: 'prod_04',
    restaurantId: RESTAURANT_DOC_ID,
    name: 'Sopa Wantán Especial (1L)',
    price: 22.0,
  },
];

const SEED_PROFILES: UserProfile[] = [
  {
    userId: 'u_client_01',
    displayName: 'Ana',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Ana&backgroundColor=0f172a',
  },
  {
    userId: 'u_driver_01',
    displayName: 'Carlos',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Carlos&backgroundColor=0369a1',
  },
];

const SEED_PRIVATE_USERS: UserPrivate[] = [
  {
    id: 'u_client_01',
    email: 'ana.cliente@example.com',
    phone: '+51 987 654 321',
    role: 'customer',
  },
  {
    id: 'u_driver_01',
    email: 'carlos.repartidor@example.com',
    phone: '+51 912 345 678',
    role: 'driver',
  },
];

@Injectable()
export class FirestoreProductRepository implements IProductRepository {
  getProducts(): Observable<Product[]> {
    return new Observable<Product[]>((subscriber) => {
      const ref = doc(db, 'restaurants', RESTAURANT_DOC_ID);
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          if (!snapshot.exists()) {
            subscriber.next([]);
            return;
          }
          const data = snapshot.data() as Partial<RestaurantDoc>;
          subscriber.next(Array.isArray(data.menu) ? data.menu : []);
        },
        (error) => {
          console.error('[FirestoreProductRepository] Error leyendo menú:', error);
          subscriber.next([]);
        },
      );

      return () => unsubscribe();
    });
  }

  /**
   * Siembra los datos iniciales en Firestore únicamente si restaurants/rest_chifa_01 no existe aún.
   */
  async seedInitialData(): Promise<boolean> {
    const restaurantRef = doc(db, 'restaurants', RESTAURANT_DOC_ID);
    const existing = await getDoc(restaurantRef);
    const batch = writeBatch(db);
    let wroteSomething = false;

    if (!existing.exists()) {
      batch.set(restaurantRef, {
        name: 'Chifa Tay Pa',
        menu: SEED_PRODUCTS,
      } satisfies RestaurantDoc);
      wroteSomething = true;
    }

    for (const profile of SEED_PROFILES) {
      const profileRef = doc(db, 'profiles', profile.userId);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        batch.set(profileRef, profile);
        wroteSomething = true;
      }
    }

    if (wroteSomething) {
      await batch.commit();
    }

    // Intentar sembrar users/{userId} (si las reglas de seguridad requieren auth, se informa sin romper el flujo)
    for (const privUser of SEED_PRIVATE_USERS) {
      try {
        await setDoc(doc(db, 'users', privUser.id), privUser);
      } catch (err) {
        console.warn(
          `[Seed] No se pudo escribir users/${privUser.id} (esperado si firestore.rules exige auth):`,
          err,
        );
      }
    }

    return wroteSomething;
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `prod_${crypto.randomUUID().slice(0, 8)}`,
    };

    const restaurantRef = doc(db, 'restaurants', RESTAURANT_DOC_ID);
    const snap = await getDoc(restaurantRef);
    if (!snap.exists()) {
      await setDoc(restaurantRef, {
        name: 'Chifa Tay Pa',
        menu: [newProduct],
      } satisfies RestaurantDoc);
    } else {
      await updateDoc(restaurantRef, {
        menu: arrayUnion(newProduct),
      });
    }

    return newProduct;
  }
}
