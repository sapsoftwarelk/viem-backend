import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5000', 'https://yourdomain.com'], // add your domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  app.setGlobalPrefix('api');
  await app.listen(5000);
}
bootstrap();