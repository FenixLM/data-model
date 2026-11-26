-- =============================================================================
-- mvp-data-brain · Esquema Relacional PostgreSQL + RLS + Realtime (Supabase)
-- Ejecutar completo en el SQL Editor de Supabase.
-- =============================================================================

-- 1. Tabla Privada de Usuarios (1:1 con profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla Pública de Perfiles (Separación 1:1 por privacidad)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT
);

-- 3. Restaurantes (Extensibilidad con JSONB)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Productos del Menú (1:N desde restaurants)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0)
);

-- 5. Órdenes de Compra (1:N desde profiles -> users y restaurants)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'on_the_way', 'delivered')),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Ítems de Orden (BIGINT secuencial interno + snapshot histórico de unit_price)
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- 7. Mensajes de Chat por Orden (1:N desde orders y profiles)
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id),
  text TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- Datos Seed Iniciales (Idempotentes con ON CONFLICT DO NOTHING)
-- =============================================================================

INSERT INTO users (id, email, phone, role)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'ana.cliente@example.com', '+51 987 654 321', 'customer'),
  ('22222222-2222-4222-8222-222222222202', 'carlos.repartidor@example.com', '+51 912 345 678', 'driver')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (user_id, display_name, avatar_url)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Ana', 'https://api.dicebear.com/9.x/initials/svg?seed=Ana&backgroundColor=0f172a'),
  ('22222222-2222-4222-8222-222222222202', 'Carlos', 'https://api.dicebear.com/9.x/initials/svg?seed=Carlos&backgroundColor=0369a1')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO restaurants (id, name, address, metadata)
VALUES
  (
    '33333333-3333-4333-8333-333333333303',
    'Chifa Tay Pa',
    'Av. Aviación 2450, San Borja',
    '{"cuisine": "Chifa", "deliveryMinutes": 30}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, restaurant_id, name, price)
VALUES
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333303', 'Arroz Chaufa Especial', 26.00),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333303', 'Tallarín Saltado de Pollo', 24.50),
  ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333303', 'Pollo Chijaukay con Wantán', 29.00),
  ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333303', 'Sopa Wantán Especial (1L)', 22.00)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Habilitar Supabase Realtime para órdenes y mensajes
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders, order_messages;

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

-- Catálogo y perfiles públicos: lectura abierta
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "restaurants_public_read"
  ON restaurants FOR SELECT
  USING (true);

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

-- Demo: permite crear platos desde "+ Nuevo plato"; en producción restringir a admins
CREATE POLICY "products_demo_insert"
  ON products FOR INSERT
  WITH CHECK (true);

-- Tabla privada users:
-- Protege email y phone frente a consultas directas desde el navegador con la anon key.
-- Solo el usuario autenticado cuyo JWT coincide con `id` puede leer su registro.
CREATE POLICY "users_private_self_read"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Órdenes, ítems y mensajes (Políticas abiertas para el taller sin login):
-- EN PRODUCCIÓN (prevención de IDOR):
--   Reemplazar `USING (true)` por:
--   `USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'driver'))`
--   y en INSERT validar `WITH CHECK (auth.uid() = user_id)`.
CREATE POLICY "orders_demo_read"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "orders_demo_insert"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "orders_demo_update"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (status IN ('pending', 'preparing', 'on_the_way', 'delivered'));

CREATE POLICY "order_items_demo_read"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "order_items_demo_insert"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- EN PRODUCCIÓN (prevención de IDOR en chat):
--   Validar que auth.uid() sea dueño de la orden padre o un driver autorizado.
CREATE POLICY "order_messages_demo_read"
  ON order_messages FOR SELECT
  USING (true);

CREATE POLICY "order_messages_demo_insert"
  ON order_messages FOR INSERT
  WITH CHECK (true);

-- Recargar caché de esquema de PostgREST tras aplicar DDL
NOTIFY pgrst, 'reload schema';
