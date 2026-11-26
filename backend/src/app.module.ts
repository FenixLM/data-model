import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ApiController } from './api.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [ApiController],
  providers: [PrismaService],
})
export class AppModule {}
