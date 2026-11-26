# Especificación de Modelo de Datos y Arquitectura (`mvp-data-brain`)

Este documento describe el modelo de datos de dominio, las relaciones entre entidades, las reglas de seguridad y la guía para reemplazar los repositorios en memoria por adaptadores reales (**Firebase**, **Supabase** o **NestJS + Neon/MongoDB**) sin modificar los componentes de interfaz.

---

## 1. Arquitectura de Capas (Patrón Repositorio)

La aplicación separa estrictamente la UI de la fuente de datos mediante contratos e `InjectionToken` de Angular:

- **Dominio (`src/app/core/models/domain.models.ts`):** Interfaces TypeScript puras (`UserPrivate`, `UserProfile`, `Product`, `OrderItem`, `Order`, `ChatMessage`).
- **Contratos (`src/app/core/repositories/data.repositories.ts`):** Interfaces (`IProductRepository`, `IOrderRepository`, `IChatRepository`, `IUserRepository`) y sus tokens (`PRODUCT_REPOSITORY`, `ORDER_REPOSITORY`, `CHAT_REPOSITORY`, `USER_REPOSITORY`).
- **Infraestructura (`src/app/infrastructure/in-memory/`):** Implementación reactiva local basada en `BehaviorSubject` de RxJS.
- **Inyección (`src/app/app.config.ts`):** Registro centralizado de proveedores. Para migrar a otro backend, solo se reemplazan las clases asociadas a cada `InjectionToken`.

---

## 2. Entidades Core y Relaciones

### Diagrama de Relaciones

```text
UserPrivate (1) ────── (1) UserProfile
     │ (id === userId)
     │
     └── (1:N) ──▶ Order ── (1:N) ──▶ ChatMessage
                     │
                     └── (embebido / 1:N) ──▶ OrderItem ── (N:1) ──▶ Product
```

### Detalle de Entidades

| Entidad | Campos Principales | Cardinalidad y Propósito |
| :--- | :--- | :--- |
| **`UserPrivate`** | `id`, `email`, `phone`, `role` (`'customer' \| 'driver'`) | Datos sensibles y de contacto. Relación **1:1** con `UserProfile`. |
| **`UserProfile`** | `userId`, `displayName`, `avatarUrl` | Proyección pública segura para UI, listados y cabecera de chat. |
| **`Product`** | `id`, `restaurantId`, `name`, `price` | Catálogo del restaurante (`1:N` desde restaurante). |
| **`OrderItem`** | `productId`, `name`, `quantity`, `unitPrice` | Snapshot de precio y nombre al momento de comprar (evita mutaciones históricas si cambia el precio del catálogo). |
| **`Order`** | `id`, `userId`, `customerName`, `status`, `items`, `total`, `createdAt` | Orden de compra vinculada a un usuario (`1:N`). Estados: `pending`, `preparing`, `on_the_way`, `delivered`. |
| **`ChatMessage`** | `id`, `orderId`, `senderId`, `senderName`, `senderRole`, `text`, `createdAt` | Subcolección/tabla hija de `Order` (`1:N`). |

---

## 3. Reglas de Seguridad y Privacidad

### Separación 1:1 `users` (Privado) vs `profiles` (Público)
- **`UserPrivate` nunca se expone en el chat ni en las órdenes.**
- El historial de mensajes (`ChatMessage`) y las órdenes (`Order`) almacenan únicamente `displayName` (`customerName` / `senderName`) y `senderRole`, evitando filtrar `email` o `phone` hacia otros usuarios (por ejemplo, entre cliente y repartidor o en consultas públicas).
- En producción, la colección/tabla `users` debe restringirse exclusivamente al propietario del registro (`auth.uid == userId`), mientras que `profiles` puede ser leída por usuarios autenticados que participan en una orden.

### Prevención de IDOR (Insecure Direct Object Reference)
1. **Validación de propiedad en `Order`:** Un cliente solo puede leer o crear órdenes donde `order.userId === auth.uid`. Un repartidor (`driver`) solo puede leer o actualizar el estado de órdenes asignadas o habilitadas para despacho.
2. **Validación de acceso en `ChatMessage`:** Antes de suscribirse a `watchMessages(orderId)` o ejecutar `sendMessage`, el backend o las reglas de seguridad deben verificar que el usuario autenticado sea el `userId` dueño de la orden o el `driver` autorizado para esa orden.
3. **Integridad del remitente y totales:** En adaptadores reales, `senderId`, `senderRole` y el `total` de la orden deben validarse o calcularse en el servidor/reglas de seguridad a partir del token JWT/sesión y los precios reales de `Product`, nunca confiando ciegamente en el payload del cliente.

---

## 4. Guía para Futuros Adaptadores

Para cambiar de almacenamiento sin tocar ningún componente de UI, crea una nueva carpeta bajo `src/app/infrastructure/` (por ejemplo, `firebase/`, `supabase/` o `nestjs/`) implementando las 4 interfaces de `data.repositories.ts` y actualiza `src/app/app.config.ts`:

```ts
// Ejemplo en src/app/app.config.ts
{ provide: PRODUCT_REPOSITORY, useClass: SupabaseProductRepository },
{ provide: ORDER_REPOSITORY, useClass: SupabaseOrderRepository },
{ provide: CHAT_REPOSITORY, useClass: SupabaseChatRepository },
{ provide: USER_REPOSITORY, useClass: SupabaseUserRepository },
```

### A. Adaptador Firebase (Firestore + Auth)
- **Colecciones sugeridas:**
  - `users/{uid}` -> `UserPrivate` (Regla Firestore: `allow read, write: if request.auth.uid == uid;`)
  - `profiles/{uid}` -> `UserProfile` (Regla: `allow read: if request.auth != null;`)
  - `products/{productId}` -> `Product`
  - `orders/{orderId}` -> `Order`
  - `orders/{orderId}/messages/{messageId}` -> `ChatMessage` (subcolección `1:N`)
- **Implementación:** Usa `collectionData` y `docData` de `@angular/fire/firestore` para implementar `watchOrders()` y `watchMessages(orderId)` devolviendo `Observable`, y `addDoc` / `updateDoc` para las mutaciones `Promise`.

### B. Adaptador Supabase (PostgreSQL + Realtime + RLS)
- **Tablas sugeridas:** `users_private`, `profiles`, `products`, `orders`, `order_items`, `chat_messages`.
- **Seguridad:** Habilita **Row Level Security (RLS)** en todas las tablas:
  - `users_private`: `auth.uid() = id`.
  - `orders` y `chat_messages`: políticas que verifiquen `auth.uid() = user_id` o rol `driver` en JWT.
- **Tiempo real:** Suscríbete a cambios con `supabase.channel('orders-changes').on('postgres_changes', ...)` y envuelve la emisión en un `Observable` (por ejemplo, alimentando un `BehaviorSubject` tras la carga inicial).

### C. Adaptador NestJS + Neon (PostgreSQL) / MongoDB
- **REST + WebSockets:**
  - `getProducts()`, `getPublicProfiles()`, `getPrivateUser()` -> peticiones `HttpClient` hacia endpoints REST (`/api/products`, `/api/users/me`).
  - `createOrder()` y `updateOrderStatus()` -> `firstValueFrom(http.post(...))` / `patch(...)`.
  - `watchOrders()` y `watchMessages(orderId)` -> Socket.IO o Server-Sent Events (SSE) desde un `Gateway` de NestJS, emitiendo sobre un `Observable` para mantener la reactividad en tiempo real en Angular.
- **Persistencia:**
  - **Neon (PostgreSQL):** Usa Prisma o Drizzle ORM con relaciones `1:1` (`users` <-> `profiles`) y `1:N` (`orders` -> `order_items`, `orders` -> `chat_messages`).
  - **MongoDB:** Usa Mongoose con `UserPrivate` y `UserProfile` en colecciones separadas e índices en `orderId` y `createdAt` para `chat_messages`.
