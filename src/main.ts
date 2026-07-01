import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function listenWithFallback(app: any, startPort: number, host: string) {
  let port = startPort;

  while (true) {
    try {
      await app.listen(port, host);
      console.log(`Application is running on: http://${host}:${port}`);
      return;
    } catch (error: any) {
      if (error?.code === 'EADDRINUSE' && port < startPort + 10) {
        console.warn(`Port ${port} is busy, trying ${port + 1}...`);
        port += 1;
        continue;
      }
      throw error;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api');

  const host = process.env.HOST || '0.0.0.0';
  const startPort = Number(process.env.PORT || 5000);
  await listenWithFallback(app, startPort, host);
}

bootstrap().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
