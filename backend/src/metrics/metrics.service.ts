import { Injectable } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  readonly loginAttempts: Counter<string>;
  readonly httpRequestDuration: Histogram<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.loginAttempts = new Counter({
      name: 'login_attempts_total',
      help: 'Total login attempts split by result',
      labelNames: ['result'],   // result = 'success' | 'failure'
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
