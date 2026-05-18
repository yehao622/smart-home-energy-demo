import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, password: string) {
    // Hardcoded demo credentials — fine for portfolio
    if (username !== 'demo' || password !== 'demo123') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username, sub: 1 };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
