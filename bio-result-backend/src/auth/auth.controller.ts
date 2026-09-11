import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';

class LoginDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
