import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { UserRole } from '../models/domain.models';
import { USER_REPOSITORY } from '../repositories/data.repositories';

/**
 * Estado global de la sesión simulada (usuario activo y perfil público/privado).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly userRepo = inject(USER_REPOSITORY);

  readonly activeUserId = signal<string>('u_client_01');

  readonly publicProfiles = toSignal(this.userRepo.getPublicProfiles(), {
    initialValue: [],
  });

  readonly activePrivateUser = toSignal(
    toObservable(this.activeUserId).pipe(
      switchMap((userId) => this.userRepo.getPrivateUser(userId)),
    ),
    { initialValue: null },
  );

  readonly activeProfile = computed(() => {
    const id = this.activeUserId();
    return this.publicProfiles().find((p) => p.userId === id) ?? null;
  });

  readonly activeUserName = computed(() => {
    const profile = this.activeProfile();
    if (profile) {
      return profile.displayName;
    }
    return this.activeUserId() === 'u_driver_01' ? 'Carlos' : 'Ana';
  });

  readonly activeUserRole = computed<UserRole>(() => {
    const priv = this.activePrivateUser();
    if (priv) {
      return priv.role;
    }
    return this.activeUserId() === 'u_driver_01' ? 'driver' : 'customer';
  });

  selectUser(userId: string): void {
    this.activeUserId.set(userId);
  }
}
