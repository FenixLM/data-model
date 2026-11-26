# mvp-data-brain (Adaptador NestJS + Prisma ORM + Neon PostgreSQL)

Aplicación Angular (Standalone Components, TypeScript `strict: true`, Signals) para pedidos y chat en tiempo real, conectada vía **HTTP + Server-Sent Events (SSE)** a un backend en **NestJS + Prisma ORM** sobre **Neon (PostgreSQL Serverless)**.

## Cómo levantar esta rama con Neon

1. **Crear un proyecto gratuito en Neon y copiar el connection string:**
   - Ingresa a [Neon Console](https://console.neon.tech/) y crea un proyecto PostgreSQL.
   - Copia las URLs de conexión en `backend/.env` (usa `backend/.env.example` como plantilla; `backend/.env` está ignorado en `.gitignore`):
     - `DATABASE_URL`: URL con `-pooler` (para el tráfico de la aplicación).
     - `DIRECT_URL`: URL directa sin `-pooler` (requerida por `prisma migrate`).

2. **Instalar dependencias, migrar, sembrar y levantar el backend (`/backend`):**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev --name init
   npx prisma db seed
   npm run start:dev
   ```
   - El backend quedará escuchando en `http://localhost:3000/api` con CORS habilitado para `http://localhost:4200`.

3. **Instalar dependencias y levantar el frontend Angular (`/`):**
   ```bash
   npm install
   npm start
   ```
   - Abre `http://localhost:4200/` en dos pestañas para probar la creación de órdenes (transacción Prisma), el chat en vivo vía **SSE** (`GET /api/stream`) y la validación anti-IDOR en `GET /api/users/:id/private`.

## Arquitectura de esta Rama (Serverless DB vs. BaaS)

- **Backend NestJS (`/backend`):** Controla transacciones (`prisma.$transaction`), validación anti-IDOR con header `x-user-id`, proyección segura de perfiles públicos (`UserProfile` vs `UserPrivate`) y tiempo real con `EventEmitter2` + `@Sse('stream')`.
- **Frontend Angular (`/src/app/infrastructure/neon-api`):** Implementa los 4 repositorios usando `HttpClient` y `EventSource`, registrados en `src/app/app.config.ts` sin modificar los componentes de UI.
- Para más detalles del modelo de datos, consulta [docs/DATA_MODEL.md](docs/DATA_MODEL.md).
