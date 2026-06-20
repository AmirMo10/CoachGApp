import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

/** Fail fast on insecure production configuration. */
function assertProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  const usingKeycloak = process.env.AUTH_PROVIDER === 'keycloak';
  const secret = process.env.JWT_SECRET;
  if (!usingKeycloak && (!secret || secret === 'dev-only-change-me')) {
    throw new Error('JWT_SECRET must be set to a strong value in production (or use Keycloak).');
  }
  if (!process.env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS must be set explicitly in production.');
  }
}

async function bootstrap() {
  assertProductionConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Security headers (CSP, HSTS, no-sniff, frameguard, etc.).
  app.use(helmet());

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5000').split(','),
    credentials: true,
  });

  // API docs are not exposed in production unless explicitly enabled.
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Coach"G" API')
      .setDescription('AI-powered coaching platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.BACKEND_PORT ?? 4000);
  await app.listen(port);
}
bootstrap();
