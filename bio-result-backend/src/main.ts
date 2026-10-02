import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tự động giám sát các file .env trong chế độ phát triển
 * Khi .env thay đổi -> kích hoạt SWC watch recompile và reload NestJS
 */
function setupEnvWatcher() {
  if (process.env.NODE_ENV === 'production') return;

  const envFiles = ['.env', '.env.local', '.env.development'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) continue;

    let debounceTimer: NodeJS.Timeout | null = null;
    try {
      fs.watch(fullPath, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          console.log(`\n[EnvWatcher] 🔄 Phát hiện thay đổi trong ${file} -> Đang tự động nạp lại Backend...`);
          try {
            const triggerFile = path.resolve(process.cwd(), 'src', 'main.ts');
            if (fs.existsSync(triggerFile)) {
              const content = fs.readFileSync(triggerFile, 'utf8');
              fs.writeFileSync(triggerFile, content, 'utf8');
            }
          } catch (e) {
            console.error('[EnvWatcher] Lỗi khi kích hoạt reload:', e);
          }
        }, 300);
      });
    } catch (e) {}
  }
}

async function bootstrap() {
  setupEnvWatcher();
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
