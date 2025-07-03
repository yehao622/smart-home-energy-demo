// src/config/productionDemo.js - Demo mode configuration

export const DEMO_MODE = true;

export const DEMO_CONFIG = {
  // Simulation settings
  updateInterval: 2000, // 2 seconds between updates
  autoStart: true,
  maxSimulationHours: 24,
  
  // Mock data settings
  solarVariability: 0.3, // 30% randomness in solar output
  priceVariability: 0.2, // 20% randomness in electricity price
  temperatureVariability: 0.1, // 10% randomness in temperature
  
  // UI settings
  showAllFeatures: true,
  enableAnimations: true,
  enableCharts: false, // Simplified mode without complex charts
  
  // Default appliance states
  defaultAppliances: {
    refrigerator: true, // Always on
    lights: false,
    tv: false,
    hvac: false,
    water_heater: false,
    ev_charger: false,
    dishwasher: false,
    wash_machine: false,
    clothes_dryer: false,
    vacuum: false,
    hair_dryer: false
  },
  
  // Mock environmental data ranges
  environmentalRanges: {
    outdoorTemp: { min: 15, max: 35 }, // Celsius
    price: { min: 0.01, max: 0.05 }, // $/kWh
    solarMax: 5.5, // kW max solar output
    batteryCapacity: 100 // % max battery level
  }
};

export const MOCK_SCHEDULES = {
  // Define realistic daily patterns for appliances
  patterns: {
    morning: { start: 6, end: 9 },
    day: { start: 9, end: 16 },
    evening: { start: 16, end: 22 },
    night: { start: 22, end: 6 }
  },
  
  appliances: {
    water_heater: [
      { hour: 7, action: 'on' },
      { hour: 8, action: 'off' },
      { hour: 21, action: 'on' },
      { hour: 22, action: 'off' }
    ],
    hvac: [
      { hour: 14, action: 'on' }, // Hot afternoon
      { hour: 16, action: 'off' }
    ],
    lights: [
      { hour: 18, action: 'on' },
      { hour: 23, action: 'off' }
    ],
    dishwasher: [
      { hour: 19, action: 'on' },
      { hour: 20, action: 'off' }
    ]
  }
};

console.log('📊 Demo Configuration Loaded:', DEMO_CONFIG);
