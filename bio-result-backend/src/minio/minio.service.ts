import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

export function removeVietnameseTones(str: string): string {
  if (!str) return 'ANONYMOUS';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

export function generateMinioObjectKey(
  loaiXetNghiem: string,
  maSo: string,
  hoTen: string,
  loaiAnh: string = 'tieuban',
  extension: string = 'jpg',
): string {
  const cleanCategory = (loaiXetNghiem || 'cell').toLowerCase();
  const cleanMaSo = (maSo || 'MASO').replace(/[^a-zA-Z0-9\-]/g, '');
  const cleanHoTen = removeVietnameseTones(hoTen);
  const cleanLoaiAnh = (loaiAnh || 'tieuban').toLowerCase().replace(/[^a-zA-Z0-9_\-]/g, '');
  const cleanExt = (extension || 'jpg').toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

  return `${cleanCategory}/${cleanMaSo}_${cleanHoTen}_${cleanLoaiAnh}.${cleanExt}`;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT || 'file.gennovax.vn';
    const port = Number(process.env.MINIO_PORT) || 443;
    const useSSL = process.env.MINIO_USE_SSL === 'true' || port === 443;
    const accessKey = process.env.MINIO_ACCESS_KEY || 'admin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'admin2025';

    this.bucketName = process.env.MINIO_BUCKET || 'genhd';
    this.publicUrl = (
      process.env.MINIO_PUBLIC_URL ||
      process.env.URL_MINIO ||
      (useSSL ? `https://${endPoint}` : `http://${endPoint}:${port}`)
    ).replace(/\/$/, '');

    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async onModuleInit() {
    await this.initBucket();
  }

  /**
   * Khởi tạo bucket và gán quyền Public Read nếu chưa có
   */
  async initBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName);
        this.logger.log(`Created new MinIO bucket: ${this.bucketName}`);
      }

      const publicReadPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      await this.client.setBucketPolicy(
        this.bucketName,
        JSON.stringify(publicReadPolicy),
      );
      this.logger.log(`MinIO bucket '${this.bucketName}' is ready with Public Read policy.`);
    } catch (err: any) {
      this.logger.warn(`MinIO init warning: ${err?.message || err}`);
    }
  }

  /**
   * Tải file ảnh lên MinIO Bucket `genhd`
   * Trả về full URL để lưu vào CSDL
   */
  async uploadFile(
    buffer: Buffer,
    objectKey: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string> {
    const cleanObjectKey = objectKey.replace(/^\/+/, '');
    await this.client.putObject(
      this.bucketName,
      cleanObjectKey,
      buffer,
      buffer.length,
      {
        'Content-Type': mimeType,
      },
    );

    const publicUrl = `${this.publicUrl}/${this.bucketName}/${cleanObjectKey}`;
    this.logger.log(`[MinIO] Upload thành công: ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Xóa file ảnh khỏi MinIO Bucket `genhd`
   */
  async deleteFile(objectKeyOrUrl: string): Promise<boolean> {
    if (!objectKeyOrUrl) return true;

    let cleanKey = objectKeyOrUrl;
    // Bỏ domain nếu là full URL
    if (cleanKey.includes(this.publicUrl)) {
      cleanKey = cleanKey.replace(this.publicUrl, '');
    }
    // Bỏ / ở đầu
    cleanKey = cleanKey.replace(/^\/+/, '');
    // Bỏ bucketName nếu có
    if (cleanKey.startsWith(`${this.bucketName}/`)) {
      cleanKey = cleanKey.substring(this.bucketName.length + 1);
    }

    try {
      await this.client.removeObject(this.bucketName, cleanKey);
      this.logger.log(`[MinIO] Đã xóa file: ${cleanKey}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`[MinIO Warning] Lỗi xóa file MinIO: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Đọc trực tiếp Buffer từ MinIO S3 qua objectKey
   */
  async getObjectBuffer(objectKey: string): Promise<Buffer | null> {
    try {
      let cleanKey = objectKey.replace(/^\/+/, '');
      if (cleanKey.startsWith(`${this.bucketName}/`)) {
        cleanKey = cleanKey.substring(this.bucketName.length + 1);
      }
      try {
        cleanKey = decodeURIComponent(cleanKey);
      } catch (e) {}

      const stream = await this.client.getObject(this.bucketName, cleanKey);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (err: any) {
      this.logger.warn(`[MinIO getObjectBuffer] Không thể đọc object '${objectKey}': ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Lấy Buffer ảnh thông minh hỗ trợ tất cả các nguồn:
   * 1. Data URI / Base64 (data:image/...)
   * 2. Raw Base64 string (/9j/..., iVBORw0KGgo...)
   * 3. MinIO URL (https://file.gennovax.vn/genhd/...) - ưu tiên đọc thẳng qua MinIO S3 SDK
   * 4. External HTTP/HTTPS URL - fallback tải qua fetch
   * 5. Object Key tương đối
   */
  async getImageBuffer(source: string): Promise<Buffer | null> {
    if (!source || typeof source !== 'string') return null;

    const trimmed = source.trim();
    if (!trimmed) return null;

    // 1. Data URI Base64 (data:image/jpeg;base64,...)
    if (trimmed.startsWith('data:image')) {
      try {
        const commaIdx = trimmed.indexOf(',');
        const base64Data = commaIdx !== -1 ? trimmed.substring(commaIdx + 1) : trimmed;
        return Buffer.from(base64Data, 'base64');
      } catch (err: any) {
        this.logger.warn(`Lỗi decode base64 image: ${err?.message || err}`);
        return null;
      }
    }

    // 2. Raw Base64 không có tiền tố data:image
    if (trimmed.startsWith('/9j/') || trimmed.startsWith('iVBORw0KGgo')) {
      try {
        return Buffer.from(trimmed, 'base64');
      } catch (err: any) {
        this.logger.warn(`Lỗi decode raw base64: ${err?.message || err}`);
        return null;
      }
    }

    // 3. MinIO URL hoặc HTTP/HTTPS URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      // 3.1 Thử đọc trực tiếp qua MinIO S3 SDK nếu URL trỏ vào domain MinIO hoặc bucket genhd
      let cleanKey = trimmed;
      if (cleanKey.includes(this.publicUrl)) {
        cleanKey = cleanKey.replace(this.publicUrl, '');
      }
      cleanKey = cleanKey.replace(/^\/+/, '');
      if (cleanKey.startsWith(`${this.bucketName}/`)) {
        cleanKey = cleanKey.substring(this.bucketName.length + 1);
      }

      const isMinioHost =
        trimmed.includes(this.publicUrl) ||
        trimmed.includes(this.bucketName) ||
        trimmed.includes('file.gennovax.vn');

      if (isMinioHost && cleanKey) {
        const buf = await this.getObjectBuffer(cleanKey);
        if (buf && buf.length > 0) {
          return buf;
        }
      }

      // 3.2 Tải qua fetch HTTP/HTTPS
      try {
        const res = await fetch(trimmed, {
          headers: {
            'User-Agent': 'BioResult-Backend/1.0',
          },
        });
        if (res.ok) {
          const ab = await res.arrayBuffer();
          return Buffer.from(ab);
        } else {
          this.logger.warn(`[Fetch Image] HTTP ${res.status} khi tải ảnh: ${trimmed}`);
        }
      } catch (fetchErr: any) {
        this.logger.warn(`[Fetch Image] Lỗi tải ảnh ${trimmed}: ${fetchErr?.message || fetchErr}`);
      }
    }

    // 4. Object Key dạng tương đối (ví dụ: 'cell/xxx.jpg' hoặc 'genhd/cell/xxx.jpg')
    return await this.getObjectBuffer(trimmed);
  }
}
