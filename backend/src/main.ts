import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: 'http://localhost:4200',
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Backend NestJS escuchando en http://localhost:${port}/api`);
}

void bootstrap();
