import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      permittedCrossDomainPolicies: true,
      crossOriginEmbedderPolicy: false, // relaxed for dev
    }),
  );

  // Permissions-Policy header (not yet in helmet — add manually)
  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    next();
  });

  // CORS — restrict to known origins in production
  app.enableCors({
    origin: [
      'http://localhost:5174',
      'http://localhost:5173',
      'https://smart-home-energy-demo.vercel.app', // keep existing
    ],
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
