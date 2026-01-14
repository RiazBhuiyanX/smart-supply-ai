import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation globally
  // This makes all DTOs with class-validator decorators work automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties from DTOs
      transform: true, // Auto-transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if unknown properties are sent
    }),
  );
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

