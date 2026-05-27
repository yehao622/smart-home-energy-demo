import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: process.env.INSTANCE_NAME ?? 'backend',
      timestamp: new Date().toISOString(),
    };
  }
}
