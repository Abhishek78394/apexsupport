import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseTimeInterceptor } from './common/interceptors/response-time.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Interceptor for Response Time
  app.useGlobalInterceptors(new ResponseTimeInterceptor());

  const config = new DocumentBuilder()
    .setTitle('ApexSupport API')
    .setDescription('AI-Powered SaaS Support Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3454);
}
bootstrap();
