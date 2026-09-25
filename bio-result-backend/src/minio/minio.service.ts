import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as http from 'http';
import * as https from 'https';

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
export class MinioService {
  private readonly logger = new Logger(MinioService.name);

  private readonly endPoint = process.env.MINIO_ENDPOINT || 'file.gennovax.vn';
  private readonly port = parseInt(process.env.MINIO_PORT || '443', 10);
  private readonly useSSL =
    process.env.MINIO_USE_SSL === 'true' ||
    (process.env.URL_MINIO ? process.env.URL_MINIO.startsWith('https') : true);
  private readonly accessKey = process.env.MINIO_ACCESS_KEY || 'admin';
  private readonly secretKey = process.env.MINIO_SECRET_KEY || 'admin2025';
  private readonly bucketName = 'genhd';
  private readonly baseUrl = process.env.URL_MINIO || 'https://file.gennovax.vn';

  /**
   * Tải file ảnh lên MinIO Bucket `genhd`
   * Cấu trúc Key: {loaiXetNghiem}/{maSo}_{tenBenhNhanKhongDau}_{loaiAnh}.{ext}
   */
  async uploadFile(
    buffer: Buffer,
    objectKey: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string> {
    const fullKey = `${this.bucketName}/${objectKey}`;
    const publicUrl = `${this.baseUrl}/${fullKey}`;

    try {
      await this.sendS3Request('PUT', fullKey, buffer, {
        'Content-Type': mimeType,
      });
      this.logger.log(`[MinIO] Upload thành công: ${publicUrl}`);
      return publicUrl;
    } catch (err: any) {
      this.logger.warn(`[MinIO Warning] Không thể đẩy file trực tiếp lên MinIO (${err.message}), sử dụng fallback URL`);
      return publicUrl;
    }
  }

  /**
   * Xóa file ảnh khỏi MinIO Bucket `genhd`
   */
  async deleteFile(objectKey: string): Promise<boolean> {
    if (!objectKey) return true;

    let cleanKey = objectKey;
    if (cleanKey.includes(this.baseUrl)) {
      cleanKey = cleanKey.replace(`${this.baseUrl}/`, '');
    }
    if (!cleanKey.startsWith(`${this.bucketName}/`)) {
      cleanKey = `${this.bucketName}/${cleanKey}`;
    }

    try {
      await this.sendS3Request('DELETE', cleanKey);
      this.logger.log(`[MinIO] Đã xóa file: ${cleanKey}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`[MinIO Warning] Lỗi xóa file MinIO: ${err.message}`);
      return false;
    }
  }

  /**
   * Gửi HTTP/HTTPS Request chuẩn S3 AWS Signature V4 tới MinIO Server
   */
  private sendS3Request(
    method: 'PUT' | 'DELETE' | 'GET',
    resourcePath: string,
    body?: Buffer,
    extraHeaders: Record<string, string> = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const host = this.endPoint;
      const path = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
      const region = 'us-east-1';
      const service = 's3';

      const now = new Date();
      const amzDate = now.toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';
      const dateStamp = amzDate.substring(0, 8);

      const contentPayload = body || Buffer.alloc(0);
      const payloadHash = crypto
        .createHash('sha256')
        .update(contentPayload)
        .digest('hex');

      const headers: Record<string, string> = {
        host: host,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        ...extraHeaders,
      };

      if (body) {
        headers['content-length'] = body.length.toString();
      }

      // Canonical Request
      const canonicalHeaders = Object.keys(headers)
        .sort()
        .map((key) => `${key.toLowerCase()}:${headers[key].trim()}\n`)
        .join('');
      const signedHeaders = Object.keys(headers)
        .sort()
        .map((key) => key.toLowerCase())
        .join(';');

      const canonicalRequest = [
        method,
        path,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash,
      ].join('\n');

      // String to Sign
      const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
      const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
      ].join('\n');

      // Signature
      const kDate = crypto
        .createHmac('sha256', 'AWS4' + this.secretKey)
        .update(dateStamp)
        .digest();
      const kRegion = crypto
        .createHmac('sha256', kDate)
        .update(region)
        .digest();
      const kService = crypto
        .createHmac('sha256', kRegion)
        .update(service)
        .digest();
      const kSigning = crypto
        .createHmac('sha256', kService)
        .update('aws4_request')
        .digest();
      const signature = crypto
        .createHmac('sha256', kSigning)
        .update(stringToSign)
        .digest('hex');

      headers['Authorization'] =
        `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      const options = {
        hostname: host,
        port: this.port,
        path: path,
        method: method,
        headers: headers,
        timeout: 5000,
      };

      const requester = this.useSSL ? https : http;
      const req = requester.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          let errData = '';
          res.on('data', (chunk) => (errData += chunk));
          res.on('end', () => {
            reject(
              new Error(
                `MinIO HTTP ${res.statusCode}: ${res.statusMessage} - ${errData}`,
              ),
            );
          });
        }
      });

      req.on('error', (err) => reject(err));
      if (body) req.write(body);
      req.end();
    });
  }
}
