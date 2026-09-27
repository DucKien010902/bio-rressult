import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép payload lớn (ảnh chụp tiêu bản, biểu đồ HPV, dữ liệu phiếu chi tiết)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Cấu hình tiền tố URL API
  app.setGlobalPrefix('api');

  // Cấu hình CORS để Next.js (port 3000, 3001) gọi được
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT ?? 5002;
  await app.listen(port);
  console.log(`Backend Bio-Result running at: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Lỗi khi khởi động Backend:', err);
});
