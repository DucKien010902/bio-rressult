import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    const { password, ...result } = user.toObject();
    return result;
  }

  async login(username: string, pass: string) {
    const user = await this.validateUser(username, pass);
    const payload = {
      sub: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      donVi: user.donVi || '',
      allowedCategories: user.allowedCategories || [],
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        donVi: user.donVi || '',
        allowedCategories: user.allowedCategories || [],
      },
    };
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  async getProfile(token: string) {
    const payload = await this.verifyToken(token);
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }
    return {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      donVi: user.donVi || '',
      allowedCategories: user.allowedCategories || [],
      doctorId: user.doctorId,
      sourceId: user.sourceId,
    };
  }
}
