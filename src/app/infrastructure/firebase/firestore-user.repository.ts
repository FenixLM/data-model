import { Injectable } from '@angular/core';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { UserPrivate, UserProfile } from '../../core/models/domain.models';
import { IUserRepository } from '../../core/repositories/data.repositories';
import { db } from './firebase.client';

@Injectable()
export class FirestoreUserRepository implements IUserRepository {
  getPublicProfiles(): Observable<UserProfile[]> {
    return new Observable<UserProfile[]>((subscriber) => {
      const profilesRef = collection(db, 'profiles');
      const unsubscribe = onSnapshot(
        profilesRef,
        (snapshot) => {
          const profiles: UserProfile[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as UserProfile;
            return {
              ...data,
              userId: data.userId || docSnap.id,
            };
          });
          subscriber.next(profiles);
        },
        (error) => {
          console.error('[FirestoreUserRepository] Error leyendo profiles:', error);
          subscriber.next([]);
        },
      );

      return () => unsubscribe();
    });
  }

  getPrivateUser(userId: string): Observable<UserPrivate | null> {
    return new Observable<UserPrivate | null>((subscriber) => {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(
        userRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            subscriber.next(null);
            return;
          }
          const data = snapshot.data() as Omit<UserPrivate, 'id'>;
          subscriber.next({
            ...data,
            id: snapshot.id,
          });
        },
        (error) => {
          // Si firestore.rules bloquea la lectura sin Auth, se devuelve null sin romper la UI.
          console.warn(`[FirestoreUserRepository] Acceso restringido o error en users/${userId}:`, error);
          subscriber.next(null);
        },
      );

      return () => unsubscribe();
    });
  }
}
