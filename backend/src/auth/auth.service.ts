import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly metricsService: MetricsService,
  ) {}

  async login(username: string, password: string) {
    if (username === 'demo' && password === 'demo123') {
      this.metricsService.loginAttempts.inc({ result: 'success' });
      const payload = { sub: 1, username };
      return { access_token: this.jwtService.sign(payload) };
    }

    this.metricsService.loginAttempts.inc({ result: 'failure' });
    throw new UnauthorizedException('Invalid credentials');
  }
}
