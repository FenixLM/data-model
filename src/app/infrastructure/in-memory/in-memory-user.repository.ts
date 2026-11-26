import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { UserPrivate, UserProfile } from '../../core/models/domain.models';
import { IUserRepository } from '../../core/repositories/data.repositories';

const INITIAL_PUBLIC_PROFILES: UserProfile[] = [
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

const INITIAL_PRIVATE_USERS: UserPrivate[] = [
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
export class InMemoryUserRepository implements IUserRepository {
  private readonly profiles$ = new BehaviorSubject<UserProfile[]>(INITIAL_PUBLIC_PROFILES);
  private readonly privateUsers$ = new BehaviorSubject<UserPrivate[]>(INITIAL_PRIVATE_USERS);

  getPublicProfiles(): Observable<UserProfile[]> {
    return this.profiles$.asObservable();
  }

  getPrivateUser(userId: string): Observable<UserPrivate | null> {
    return this.privateUsers$.asObservable().pipe(
      map((users) => users.find((u) => u.id === userId) ?? null),
    );
  }
}
