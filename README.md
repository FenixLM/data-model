# mvp-data-brain (Adaptador PostgreSQL + Supabase Realtime)

Aplicación Angular (Standalone Components, TypeScript `strict: true`, Signals) para pedidos y chat en tiempo real, conectada a **PostgreSQL mediante Supabase** bajo el Patrón Repositorio (`InjectionToken`).

## Cómo levantar esta rama con Supabase

1. **Crear proyecto en Supabase:**
   - Ingresa a [Supabase Dashboard](https://supabase.com/dashboard) y crea un nuevo proyecto.

2. **Ejecutar el esquema SQL en el SQL Editor:**
   - Abre **SQL Editor** en tu proyecto de Supabase.
   - Copia y pega todo el contenido de [supabase/schema.sql](supabase/schema.sql) y ejecútalo. Esto crea las 7 tablas normalizadas (`users`, `profiles`, `restaurants`, `products`, `orders`, `order_items`, `order_messages`), habilita RLS, activa **Realtime** en `orders` y `order_messages`, y siembra los datos iniciales.

3. **Copiar credenciales en `src/environments/environment.ts`:**
   - En **Project Settings → API**, copia el **Project URL** y la **anon public key**.
   - Pégalos en `src/environments/environment.ts` (usando `src/environments/environment.example.ts` como referencia; `environment.ts` está ignorado en `.gitignore`).

4. **Instalar dependencias y ejecutar la aplicación:**
   ```bash
   npm install
   npm start
   ```
   - Abre `http://localhost:4200/` en dos pestañas para probar la creación de órdenes, cambios de estado y chat en tiempo real vía Supabase Realtime.

## Modelado Relacional y Seguridad

- **Separación 1:1 por privacidad:** `users` (datos sensibles con RLS `auth.uid() = id`) vs. `profiles` (lectura pública para UI y chat).
- **Normalización e historial:** `orders` + `order_items` (`BIGINT GENERATED ALWAYS AS IDENTITY` y `unit_price` histórico).
- **Extensibilidad híbrida:** `restaurants.metadata` con `JSONB`.
- Para más detalles, consulta [docs/DATA_MODEL.md](docs/DATA_MODEL.md).
