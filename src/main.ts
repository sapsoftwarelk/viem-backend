import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://yourdomain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  app.setGlobalPrefix('api');
  await app.listen(5000);
}
bootstrap();
