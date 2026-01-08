import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './common/filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global exception filters
  // Order matters: filters are applied in reverse order (last registered catches first)
  // So we register: AllExceptions -> Prisma -> PrismaValidation -> HttpException
  // This means HttpException catches first, then PrismaValidation, then Prisma, then AllExceptions as fallback
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new PrismaExceptionFilter(),
    new PrismaValidationExceptionFilter(),
    new HttpExceptionFilter(),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
