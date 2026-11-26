import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  MessageEvent,
  NotFoundException,
  Param,
  Patch,
  Post,
  Sse,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';
import { PrismaService } from './prisma.service';

const DEFAULT_RESTAURANT_ID = '33333333-3333-4333-8333-333333333303';

interface CreateProductDto {
  restaurantId?: string;
  name: string;
  price: number;
}

interface CreateOrderDto {
  userId: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
}

interface UpdateOrderStatusDto {
  status: 'pending' | 'preparing' | 'on_the_way' | 'delivered';
}

interface CreateMessageDto {
  senderId: string;
  text: string;
}

interface RealtimePayload {
  type: 'orders' | 'messages';
  orderId?: string;
}

@Controller()
export class ApiController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return fromEvent<RealtimePayload>(this.eventEmitter, 'realtime.event').pipe(
      map((payload) => ({
        data: payload,
      })),
    );
  }

  @Get('products')
  async getProducts() {
    const products = await this.prisma.product.findMany({
      where: { restaurantId: DEFAULT_RESTAURANT_ID },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      restaurantId: p.restaurantId,
      name: p.name,
      price: Number(p.price),
    }));
  }

  @Post('products')
  async createProduct(@Body() body: CreateProductDto) {
    const created = await this.prisma.product.create({
      data: {
        restaurantId: body.restaurantId || DEFAULT_RESTAURANT_ID,
        name: body.name,
        price: body.price,
      },
    });

    return {
      id: created.id,
      restaurantId: created.restaurantId,
      name: created.name,
      price: Number(created.price),
    };
  }

  @Get('orders')
  async getOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            profile: {
              select: { displayName: true },
            },
          },
        },
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      customerName: order.user.profile?.displayName ?? 'Cliente',
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        // Serialización segura de BigInt -> number/string implícita al omitir item.id BigInt en DTO
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    }));
  }

  @Post('orders')
  async createOrder(@Body() body: CreateOrderDto) {
    const created = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId: body.userId,
          restaurantId: DEFAULT_RESTAURANT_ID,
          status: 'pending',
          total: body.total,
          items: {
            create: body.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          user: {
            select: {
              profile: {
                select: { displayName: true },
              },
            },
          },
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      });
    });

    this.eventEmitter.emit('realtime.event', { type: 'orders' } satisfies RealtimePayload);

    return {
      id: created.id,
      userId: created.userId,
      customerName: created.user.profile?.displayName ?? 'Cliente',
      status: created.status,
      total: Number(created.total),
      createdAt: created.createdAt.toISOString(),
      items: created.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    await this.prisma.order.update({
      where: { id },
      data: { status: body.status },
    });

    this.eventEmitter.emit('realtime.event', { type: 'orders' } satisfies RealtimePayload);
    return { ok: true };
  }

  @Get('orders/:id/messages')
  async getMessages(@Param('id') orderId: string) {
    const messages = await this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            role: true,
            profile: {
              select: { displayName: true },
            },
          },
        },
      },
    });

    return messages.map((msg) => ({
      id: msg.id,
      orderId: msg.orderId,
      senderId: msg.senderId,
      senderName: msg.sender.profile?.displayName ?? 'Usuario',
      senderRole: msg.sender.role,
      text: msg.text,
      createdAt: msg.createdAt.toISOString(),
    }));
  }

  @Post('orders/:id/messages')
  async createMessage(@Param('id') orderId: string, @Body() body: CreateMessageDto) {
    const created = await this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId: body.senderId,
        text: body.text,
      },
      include: {
        sender: {
          select: {
            role: true,
            profile: {
              select: { displayName: true },
            },
          },
        },
      },
    });

    this.eventEmitter.emit('realtime.event', {
      type: 'messages',
      orderId,
    } satisfies RealtimePayload);

    return {
      id: created.id,
      orderId: created.orderId,
      senderId: created.senderId,
      senderName: created.sender.profile?.displayName ?? 'Usuario',
      senderRole: created.sender.role,
      text: created.text,
      createdAt: created.createdAt.toISOString(),
    };
  }

  @Get('profiles')
  async getPublicProfiles() {
    return this.prisma.profile.findMany({
      orderBy: { displayName: 'asc' },
    });
  }

  @Get('users/:id/private')
  async getPrivateUser(@Param('id') id: string, @Headers('x-user-id') reqUserId?: string) {
    if (reqUserId !== id) {
      throw new ForbiddenException(
        'IDOR bloqueado: no puedes leer datos privados de otro usuario',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
    };
  }
}
