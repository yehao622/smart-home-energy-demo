import { Controller, Get, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Get('devices')
  findAll() {
    return this.devicesService.findAll();
  }

  @Get('energy/stats')
  getEnergyStats() {
    return this.devicesService.getEnergyStats();
  }
}
