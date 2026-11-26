# mvp-data-brain (Adaptador Cloud Firestore)

Aplicación Angular (Standalone Components, TypeScript `strict: true`, Signals) para pedidos y chat en tiempo real, conectada a **Firebase Cloud Firestore** mediante el Patrón Repositorio (`InjectionToken`).

## Cómo levantar esta rama con Firebase

1. **Crear proyecto en Firebase Console y habilitar Cloud Firestore:**
   - Ingresa a [Firebase Console](https://console.firebase.google.com/), crea un proyecto nuevo y habilita **Cloud Firestore** (puedes iniciar en modo de prueba o desplegar las reglas incluidas en `firestore.rules`).

2. **Registrar una Web App y copiar el `firebaseConfig`:**
   - En la configuración del proyecto de Firebase, registra una aplicación **Web** (`</>`).
   - Copia el objeto `firebaseConfig` y pégalo en `src/environments/environment.ts` (usa `src/environments/environment.example.ts` como plantilla; `environment.ts` está ignorado en `.gitignore`).

3. **Ejecutar la aplicación y sembrar los datos iniciales:**
   ```bash
   npm install
   npm start
   ```
   - Abre `http://localhost:4200/` en tu navegador y presiona el botón discreto **"Seed Datos Iniciales"** en el panel del menú (se muestra automáticamente si `restaurants/rest_chifa_01` aún no existe en Firestore).

4. **Verificar en tiempo real (opcional):**
   - Abre dos pestañas en `http://localhost:4200/`, crea una orden o envía mensajes en el chat y observa cómo `onSnapshot` sincroniza ambos clientes en tiempo real.

## Modelado NoSQL y Seguridad

- **Relación 1:N embebida:** `restaurants/rest_chifa_01` contiene `menu: Product[]` en un solo documento.
- **Colección raíz + denormalización:** `orders/{orderId}` guarda `customerName` denormalizado y se escucha con `onSnapshot` ordenado por `createdAt` descendente.
- **Subcolección 1:N:** `orders/{orderId}/messages/{messageId}` almacena los mensajes de cada orden en tiempo real.
- **Separación 1:1 por privacidad:** `profiles/{userId}` (público) vs. `users/{userId}` (privado), protegido en `firestore.rules` para evitar exposición de `email` y `phone`.
- Para más detalles, consulta [docs/DATA_MODEL.md](docs/DATA_MODEL.md).
