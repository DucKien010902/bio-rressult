import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';

class LoginDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Giới hạn chống dò mật khẩu (Brute-force): Tối đa 10 lần thử trong 1 phút
  @Public()
  @Throttle({ short: { limit: 2, ttl: 1000 }, long: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    if (!body.username || !body.password) {
      throw new UnauthorizedException('Vui lòng nhập tên đăng nhập và mật khẩu');
    }
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Chưa cung cấp token');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.verifyToken(token);
  }
}
