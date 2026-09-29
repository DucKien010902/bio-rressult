import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tin cậy Reverse Proxy (Vercel, Cloudflare, Nginx) để lấy IP thật của người dùng cho Throttler
  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);

  // Thiết lập bảo mật HTTP Headers với Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  // Cho phép payload lớn (ảnh chụp tiêu bản, biểu đồ HPV, dữ liệu phiếu chi tiết)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Cấu hình tiền tố URL API
  app.setGlobalPrefix('api');

  // Cấu hình CORS an toàn
  app.enableCors({
    origin: [
      'https://genhd.vercel.app',
      /https:\/\/.*\.vercel\.app$/,
      /http:\/\/localhost:[0-9]+$/,
    ],
    credentials: true,
  });

  const port = process.env.PORT ?? 5002;
  await app.listen(port);
  console.log(`Backend Bio-Result running at: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Lỗi khi khởi động Backend:', err);
});
