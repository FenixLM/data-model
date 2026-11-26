import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ANA_ID = '11111111-1111-4111-8111-111111111101';
const CARLOS_ID = '22222222-2222-4222-8222-222222222202';
const RESTAURANT_ID = '33333333-3333-4333-8333-333333333303';

const PRODUCTS = [
  {
    id: '44444444-4444-4444-8444-444444444401',
    name: 'Arroz Chaufa Especial',
    price: 26.0,
  },
  {
    id: '44444444-4444-4444-8444-444444444402',
    name: 'Tallarín Saltado de Pollo',
    price: 24.5,
  },
  {
    id: '44444444-4444-4444-8444-444444444403',
    name: 'Pollo Chijaukay con Wantán',
    price: 29.0,
  },
  {
    id: '44444444-4444-4444-8444-444444444404',
    name: 'Sopa Wantán Especial (1L)',
    price: 22.0,
  },
];

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: ANA_ID },
    update: {},
    create: {
      id: ANA_ID,
      email: 'ana.cliente@example.com',
      phone: '+51 987 654 321',
      role: 'customer',
      profile: {
        create: {
          displayName: 'Ana',
          avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Ana&backgroundColor=0f172a',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { id: CARLOS_ID },
    update: {},
    create: {
      id: CARLOS_ID,
      email: 'carlos.repartidor@example.com',
      phone: '+51 912 345 678',
      role: 'driver',
      profile: {
        create: {
          displayName: 'Carlos',
          avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Carlos&backgroundColor=0369a1',
        },
      },
    },
  });

  await prisma.restaurant.upsert({
    where: { id: RESTAURANT_ID },
    update: {},
    create: {
      id: RESTAURANT_ID,
      name: 'Chifa Tay Pa',
      address: 'Av. Aviación 2450, San Borja',
      metadata: { cuisine: 'Chifa', deliveryMinutes: 30 },
    },
  });

  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        id: product.id,
        restaurantId: RESTAURANT_ID,
        name: product.name,
        price: product.price,
      },
    });
  }

  console.log('Seed completado: Ana, Carlos, Chifa Tay Pa y 4 productos.');
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
