// Enhanced demo mode for Vercel deployment
// src/config/productionDemo.js

export class ProductionDemoService {
  constructor() {
    this.currentStep = 0;
    this.currentDay = 1;
    this.isRunning = false;
    this.simulationSpeed = 1;
    this.batteryLevel = 45;
    this.solarProduction = 0;
    this.timeOfDay = 0; // 0-23 hours
    this.priceSchedule = this.generatePriceSchedule();
    this.weatherPattern = this.generateWeatherPattern();
    this.startTime = Date.now();
  }

  generatePriceSchedule() {
    // Realistic time-of-use pricing ($/kWh)
    return [
      0.12, 0.11, 0.10, 0.10, 0.11, 0.15, // 12am-6am (low)
      0.18, 0.22, 0.25, 0.23, 0.20, 0.18, // 6am-12pm (morning peak)
      0.20, 0.22, 0.25, 0.28, 0.35, 0.38, // 12pm-6pm (afternoon)
      0.42, 0.38, 0.28, 0.22, 0.18, 0.15  // 6pm-12am (evening peak)
    ];
  }

  generateWeatherPattern() {
    // Realistic solar production pattern (kW)
    return [
      0, 0, 0, 0, 0, 0.1,           // 12am-6am
      0.5, 1.2, 2.8, 4.1, 4.8, 5.0, // 6am-12pm
      4.9, 4.5, 3.8, 2.9, 1.8, 0.8, // 12pm-6pm
      0.3, 0.1, 0, 0, 0, 0          // 6pm-12am
    ];
  }

  async startSimulation(options = {}) {
    this.isRunning = true;
    this.simulationSpeed = options.speed || 1;
    this.currentStep = 0;
    
    return {
      success: true,
      message: "AI Energy Optimization Started",
      mode: "ai"
    };
  }

  async stopSimulation() {
    this.isRunning = false;
    return { success: true, message: "Simulation Paused" };
  }

  async resetSimulation() {
    this.currentStep = 0;
    this.currentDay = 1;
    this.isRunning = false;
    this.batteryLevel = 45;
    this.timeOfDay = 0;
    return { success: true, message: "Simulation Reset" };
  }

  getCurrentPrice() {
    return this.priceSchedule[this.timeOfDay % 24];
  }

  getCurrentSolar() {
    // Add some realistic variation
    const base = this.weatherPattern[this.timeOfDay % 24];
    const variation = (Math.random() - 0.5) * 0.3;
    return Math.max(0, base + variation);
  }

  generateSmartScheduling() {
    const currentPrice = this.getCurrentPrice();
    const currentSolar = this.getCurrentSolar();
    const hour = this.timeOfDay % 24;
    
    // Smart appliance scheduling based on AI logic
    const scheduling = {
      // Shiftable appliances - run during low price hours
      dishwasher: {
        active: currentPrice < 0.15 && hour >= 1 && hour <= 5,
        power: 1.8,
        reason: currentPrice < 0.15 ? "Low electricity price" : "High electricity price"
      },
      
      wash_machine: {
        active: currentPrice < 0.18 && hour >= 2 && hour <= 6,
        power: 0.4,
        reason: currentPrice < 0.18 ? "Optimal pricing window" : "Waiting for better rates"
      },
      
      clothes_dryer: {
        active: currentPrice < 0.20 && currentSolar > 2.0,
        power: 1.2,
        reason: currentSolar > 2.0 ? "Using solar energy" : "Waiting for solar/low rates"
      },

      // Controllable appliances - smart temperature management
      hvac: {
        active: hour >= 6 && hour <= 22, // Active during day
        power: this.calculateHvacPower(currentPrice, currentSolar),
        reason: "Maintaining comfort within optimal hours"
      },

      water_heater: {
        active: currentPrice < 0.25 || currentSolar > 3.0,
        power: this.calculateWaterHeaterPower(currentPrice, currentSolar),
        reason: currentSolar > 3.0 ? "Using excess solar" : "Low rate heating"
      },

      ev_charger: {
        active: this.isEvConnected() && (currentPrice < 0.20 || currentSolar > 3.0),
        power: this.calculateEvPower(currentPrice, currentSolar),
        reason: this.getEvChargingReason(currentPrice, currentSolar)
      },

      // Fixed appliances - realistic usage patterns
      tv: {
        active: hour >= 18 && hour <= 23,
        power: 0.15,
        reason: "Evening entertainment hours"
      },

      refrigerator: {
        active: true, // Always on
        power: 0.2,
        reason: "Essential appliance"
      },

      lights: {
        active: (hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 23),
        power: 0.25,
        reason: "Active during low-light hours"
      }
    };

    return scheduling;
  }

  calculateHvacPower(price, solar) {
    // Smart HVAC - use more power when solar is high or price is low
    if (solar > 3.0) return 2.5; // Use excess solar
    if (price < 0.20) return 2.0; // Use during low rates
    if (price > 0.35) return 0.8; // Reduce during peak rates
    return 1.5; // Normal operation
  }

  calculateWaterHeaterPower(price, solar) {
    // Smart water heating
    if (solar > 4.0) return 4.5; // Use excess solar
    if (price < 0.15) return 3.5; // Heat during cheap rates
    if (price > 0.30) return 0; // Don't heat during expensive rates
    return 2.0; // Maintenance heating
  }

  isEvConnected() {
    const hour = this.timeOfDay % 24;
    return hour >= 18 || hour <= 7; // Connected evening to morning
  }

  calculateEvPower(price, solar) {
    if (!this.isEvConnected()) return 0;
    
    if (solar > 3.0) return 6.0; // Max charging with solar
    if (price < 0.15) return 4.5; // Fast charging at low rates
    if (price < 0.25) return 2.5; // Slow charging at moderate rates
    return 0; // Don't charge at high rates
  }

  getEvChargingReason(price, solar) {
    if (!this.isEvConnected()) return "Vehicle not connected";
    if (solar > 3.0) return "Charging with excess solar";
    if (price < 0.15) return "Cheap rate fast charging";
    if (price < 0.25) return "Moderate rate charging";
    return "Waiting for better rates";
  }

  calculateBatteryBehavior(scheduling, currentSolar, currentPrice) {
    const totalDemand = Object.values(scheduling)
      .filter(app => app.active)
      .reduce((sum, app) => sum + app.power, 0);

    let batteryPower = 0;
    let batteryStatus = 'idle';

    // Battery management logic
    if (currentSolar > totalDemand && this.batteryLevel < 95) {
      // Charge battery with excess solar
      batteryPower = Math.min(2.4, currentSolar - totalDemand);
      batteryStatus = 'charging';
      this.batteryLevel = Math.min(100, this.batteryLevel + (batteryPower * 0.1));
    } else if (currentPrice > 0.30 && this.batteryLevel > 20) {
      // Discharge battery during expensive periods
      batteryPower = -Math.min(2.4, Math.max(0, totalDemand - currentSolar));
      batteryStatus = 'discharging';
      this.batteryLevel = Math.max(10, this.batteryLevel - (Math.abs(batteryPower) * 0.1));
    } else if (currentPrice < 0.15 && this.batteryLevel < 90) {
      // Charge from grid during very cheap periods
      batteryPower = 1.5;
      batteryStatus = 'charging';
      this.batteryLevel = Math.min(100, this.batteryLevel + (batteryPower * 0.1));
    }

    return {
      power: batteryPower,
      status: batteryStatus,
      level: Math.round(this.batteryLevel * 10) / 10
    };
  }

  async getCurrentState() {
    if (!this.isRunning) {
      return this.getStaticState();
    }

    // Advance time
    this.currentStep++;
    this.timeOfDay = Math.floor((this.currentStep * 0.25) % 24);
    
    if (this.currentStep % 96 === 0) {
      this.currentDay++;
    }

    const currentSolar = this.getCurrentSolar();
    const currentPrice = this.getCurrentPrice();
    const scheduling = this.generateSmartScheduling();
    const battery = this.calculateBatteryBehavior(scheduling, currentSolar, currentPrice);
    
    const totalDemand = Object.values(scheduling)
      .filter(app => app.active)
      .reduce((sum, app) => sum + app.power, 0);

    const gridPower = Math.max(0, totalDemand - currentSolar + battery.power);

    return {
      timestamp: this.currentStep % 96,
      day: this.currentDay,
      timeOfDay: `${Math.floor(this.timeOfDay).toString().padStart(2, '0')}:${((this.timeOfDay % 1) * 60).toString().padStart(2, '0')}`,
      
      environment: {
        solar_production: Math.round(currentSolar * 10) / 10,
        price: Math.round(currentPrice * 1000) / 1000,
        outside_temp: 20 + Math.sin(this.timeOfDay * Math.PI / 12) * 8
      },

      appliances: {
        shiftable: {
          dishwasher: scheduling.dishwasher,
          wash_machine: scheduling.wash_machine,
          clothes_dryer: scheduling.clothes_dryer
        },
        controllable: {
          hvac: scheduling.hvac,
          water_heater: scheduling.water_heater
        },
        fixed: {
          tv: scheduling.tv,
          refrigerator: scheduling.refrigerator,
          lights: scheduling.lights
        }
      },

      ev: {
        connected: this.isEvConnected(),
        power: scheduling.ev_charger.power,
        soc: 0.3 + (this.currentStep * 0.001) % 0.6,
        reason: scheduling.ev_charger.reason
      },

      battery: battery,

      energy_flow: {
        house: { demand: { total: Math.round(totalDemand * 10) / 10 } },
        grid: { net_power: Math.round(gridPower * 10) / 10 },
        solar: { total: Math.round(currentSolar * 10) / 10 }
      },

      temperatures: {
        home: {
          current: 22 + Math.sin(this.currentStep * 0.1) * 2,
          setpoint: 22
        },
        water: {
          current: 58 + Math.cos(this.currentStep * 0.05) * 8,
          setpoint: 60
        }
      },

      ai_insights: {
        cost_savings: "Estimated 23.8% cost reduction",
        next_action: this.getNextAIAction(currentPrice, currentSolar),
        efficiency_score: Math.round(85 + Math.random() * 10)
      }
    };
  }

  getNextAIAction(price, solar) {
    if (solar > 4.0 && price > 0.30) return "Using excess solar to avoid peak rates";
    if (price < 0.15) return "Scheduling energy-intensive tasks";
    if (price > 0.35) return "Reducing consumption during peak hours";
    return "Optimizing based on current conditions";
  }

  getStaticState() {
    return {
      timestamp: 0,
      day: 1,
      timeOfDay: "00:00",
      environment: { solar_production: 0, price: 0.12, outside_temp: 20 },
      appliances: {
        shiftable: {
          dishwasher: { active: false, power: 0, reason: "Standby" },
          wash_machine: { active: false, power: 0, reason: "Standby" },
          clothes_dryer: { active: false, power: 0, reason: "Standby" }
        },
        controllable: {
          hvac: { active: false, power: 0, reason: "Standby" },
          water_heater: { active: false, power: 0, reason: "Standby" }
        },
        fixed: {
          tv: { active: false, power: 0, reason: "Off hours" },
          refrigerator: { active: true, power: 0.2, reason: "Always on" },
          lights: { active: false, power: 0, reason: "Daylight hours" }
        }
      },
      ev: { connected: false, power: 0, soc: 0.5, reason: "Not connected" },
      battery: { power: 0, status: 'idle', level: 45 },
      energy_flow: {
        house: { demand: { total: 0.2 } },
        grid: { net_power: 0.2 },
        solar: { total: 0 }
      },
      temperatures: {
        home: { current: 22, setpoint: 22 },
        water: { current: 60, setpoint: 60 }
      }
    };
  }
}
