import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { UserPrivate, UserProfile } from '../../core/models/domain.models';
import { IUserRepository } from '../../core/repositories/data.repositories';
import { API_BASE_URL, toDbUserId, toDomainUserId } from './neon-api.helpers';

@Injectable()
export class HttpUserRepository implements IUserRepository {
  private readonly http = inject(HttpClient);

  getPublicProfiles(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${API_BASE_URL}/profiles`).pipe(
      map((profiles) =>
        profiles.map((p) => ({
          ...p,
          userId: toDomainUserId(p.userId),
        })),
      ),
      catchError((error) => {
        console.error('[HttpUserRepository] Error leyendo profiles:', error);
        return of([]);
      }),
    );
  }

  getPrivateUser(userId: string): Observable<UserPrivate | null> {
    const dbUserId = toDbUserId(userId);
    const headers = new HttpHeaders({
      'x-user-id': dbUserId,
    });

    return this.http
      .get<UserPrivate>(`${API_BASE_URL}/users/${dbUserId}/private`, { headers })
      .pipe(
        map((user) => ({
          ...user,
          id: toDomainUserId(user.id),
        })),
        catchError((error) => {
          console.warn(`[HttpUserRepository] Error o bloqueo IDOR en users/${dbUserId}:`, error);
          return of(null);
        }),
      );
  }
}
