import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      skipUndefinedProperties: true,
      whitelist: true
    })
  );
  app.set('trust proxy', 'loopback');
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
