import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Thời gian theo giờ Việt Nam
      const timeStr = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Nhận diện tên đăng nhập (ngắn gọn, chính xác)
      let username = 'guest';
      const authHeader = req.headers['authorization'];
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = decodeJwtPayload(token);
        if (decoded?.username) {
          username = decoded.username;
        }
      } else if (req.headers['x-user']) {
        username = String(req.headers['x-user']);
      } else if (originalUrl.includes('/auth/login') && req.body?.username) {
        username = req.body.username;
      }

      // Màu sắc theo mã HTTP
      const statusColor =
        statusCode >= 500
          ? '\x1b[31;1m' // Đỏ đậm
          : statusCode >= 400
          ? '\x1b[33;1m' // Vàng cam
          : statusCode >= 300
          ? '\x1b[36m'   // Cyan
          : '\x1b[32;1m'; // Xanh lá

      const methodColor =
        method === 'GET'
          ? '\x1b[34;1m' // Xanh dương
          : method === 'POST'
          ? '\x1b[32;1m' // Xanh lá
          : method === 'PUT' || method === 'PATCH'
          ? '\x1b[33;1m' // Vàng
          : method === 'DELETE'
          ? '\x1b[31;1m' // Đỏ
          : '\x1b[35;1m'; // Tím

      const reset = '\x1b[0m';
      const gray = '\x1b[90m';
      const userColor = '\x1b[35;1m'; // Tím nổi bật

      console.log(
        `${gray}[${timeStr}]${reset} ` +
        `${methodColor}[${method}]${reset} ` +
        `\x1b[1m${originalUrl}${reset} ` +
        `-> ${statusColor}${statusCode}${reset} ` +
        `${gray}(${duration}ms)${reset} | ` +
        `User: ${userColor}${username}${reset}`
      );
    });

    next();
  }
}
