import { Injectable } from '@nestjs/common';

@Injectable()
export class DevicesService {
  private readonly devices = [
    { id: 1, name: 'Smart Thermostat', type: 'thermostat', status: 'on', powerW: 15 },
    { id: 2, name: 'Living Room Lights', type: 'lighting', status: 'on', powerW: 40 },
    { id: 3, name: 'Smart Refrigerator', type: 'appliance', status: 'on', powerW: 150 },
    { id: 4, name: 'EV Charger', type: 'charger', status: 'off', powerW: 0 },
    { id: 5, name: 'Solar Panels', type: 'solar', status: 'on', powerW: -800 },
  ];

  findAll() {
    return this.devices;
  }
  
  getEnergyStats() {
    const consuming = this.devices.filter(d => d.powerW > 0);
    const generating = this.devices.filter(d => d.powerW < 0);
    const totalConsumptionW = consuming.reduce((sum, d) => sum + d.powerW, 0);
    const totalGenerationW = Math.abs(generating.reduce((sum, d) => sum + d.powerW, 0));
    return {
      totalConsumptionW,
      totalGenerationW,
      netW: totalConsumptionW - totalGenerationW,
      timestamp: new Date().toISOString(),
    };
  }
}
