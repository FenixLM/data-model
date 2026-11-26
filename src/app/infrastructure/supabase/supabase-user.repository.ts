import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { UserPrivate, UserProfile, UserRole } from '../../core/models/domain.models';
import { IUserRepository } from '../../core/repositories/data.repositories';
import { supabase, toDbUserId, toDomainUserId } from './supabase.client';

interface DbProfileRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface DbPrivateUserRow {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

@Injectable()
export class SupabaseUserRepository implements IUserRepository {
  getPublicProfiles(): Observable<UserProfile[]> {
    return from(
      supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .order('display_name', { ascending: true })
        .returns<DbProfileRow[]>(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[SupabaseUserRepository] Error leyendo profiles:', error);
          return [];
        }
        return (data ?? []).map((row) => ({
          userId: toDomainUserId(row.user_id),
          displayName: row.display_name,
          avatarUrl: row.avatar_url ?? '',
        }));
      }),
    );
  }

  getPrivateUser(userId: string): Observable<UserPrivate | null> {
    const dbUserId = toDbUserId(userId);
    return from(
      supabase
        .from('users')
        .select('id, email, phone, role')
        .eq('id', dbUserId)
        .maybeSingle<DbPrivateUserRow>(),
    ).pipe(
      map(({ data, error }) => {
        // Si RLS bloquea el acceso porque no hay sesión Auth, devuelve null sin romper la UI.
        if (error || !data) {
          if (error) {
            console.warn(
              `[SupabaseUserRepository] Acceso restringido por RLS en users/${dbUserId}:`,
              error.message,
            );
          }
          return null;
        }

        return {
          id: toDomainUserId(data.id),
          email: data.email,
          phone: data.phone ?? '',
          role: data.role,
        };
      }),
    );
  }
}
