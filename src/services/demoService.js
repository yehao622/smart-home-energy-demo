// src/services/demoService.js
export class DemoService {
  constructor() {
    this.isRunning = false;
    this.currentStep = 0;
    this.simulationData = {
      solarOutput: 0,
      batteryLevel: 45,
      batteryStatus: 'empty',
      batteryPower: 0,
      gridPower: 0,
      houseDemand: 0,
      simulationTime: "00:00",
      simulationDay: 1,
      appliances: [
        { id: 1, name: 'Dishwasher', type: 'dishwasher', power: 1.8, active: false, group: 1 },
        { id: 2, name: 'Wash Machine', type: 'wash_machine', power: 0.4, active: false, group: 1 },
        { id: 3, name: 'Clothes Dryer', type: 'clothes_dryer', power: 1.2, active: false, group: 1 },
        { id: 4, name: 'HVAC', type: 'hvac', power: 2.5, active: false, group: 2 },
        { id: 5, name: 'Water Heater', type: 'water_heater', power: 4.5, active: false, group: 2 },
        { id: 6, name: 'EV Charger', type: 'ev_charger', power: 6.0, active: false, group: 2 },
        { id: 7, name: 'TV', type: 'tv', power: 0.1, active: false, group: 3 },
        { id: 8, name: 'Refrigerator', type: 'refrigerator', power: 0.2, active: true, group: 3 },
        { id: 9, name: 'Lights', type: 'lights', power: 0.2, active: false, group: 3 },
        { id: 10, name: 'Vacuum Cleaner', type: 'vacuum', power: 1.2, active: false, group: 3 },
        { id: 11, name: 'Hair Dryer', type: 'hair_dryer', power: 1.0, active: false, group: 3 }
      ]
    };
    
    this.priceSchedule = this.generatePriceSchedule();
    this.solarSchedule = this.generateSolarSchedule();
  }

  generatePriceSchedule() {
    // 24-hour price schedule ($/kWh)
    return [
      0.012, 0.011, 0.010, 0.010, 0.011, 0.015, // 12am-6am (low)
      0.018, 0.022, 0.025, 0.023, 0.020, 0.018, // 6am-12pm (morning)
      0.020, 0.022, 0.025, 0.028, 0.035, 0.038, // 12pm-6pm (afternoon)
      0.042, 0.038, 0.028, 0.022, 0.018, 0.015  // 6pm-12am (evening)
    ];
  }

  generateSolarSchedule() {
    // 24-hour solar production schedule (kW)
    return [
      0, 0, 0, 0, 0, 0.1,           // 12am-6am
      0.5, 1.2, 2.8, 4.1, 4.8, 5.0, // 6am-12pm
      4.9, 4.5, 3.8, 2.9, 1.8, 0.8, // 12pm-6pm
      0.3, 0.1, 0, 0, 0, 0          // 6pm-12am
    ];
  }

  startSimulation() {
    this.isRunning = true;
    this.currentStep = 0;
    
    this.simulationInterval = setInterval(() => {
      this.updateSimulation();
    }, 1000);
    
    return Promise.resolve({ success: true });
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    return Promise.resolve({ success: true });
  }

  resetSimulation() {
    this.stopSimulation();
    this.currentStep = 0;
    this.simulationData.solarOutput = 0;
    this.simulationData.batteryLevel = 45;
    this.simulationData.batteryStatus = 'empty';
    this.simulationData.batteryPower = 0;
    this.simulationData.gridPower = 0;
    this.simulationData.houseDemand = 0;
    this.simulationData.simulationTime = "00:00";
    this.simulationData.simulationDay = 1;
    
    // Reset appliances
    this.simulationData.appliances = this.simulationData.appliances.map(app => ({
      ...app,
      active: app.type === 'refrigerator' // Only keep refrigerator on
    }));
    
    return Promise.resolve({ success: true });
  }

  updateSimulation() {
    this.currentStep++;
    
    // Calculate current hour and minute
    const totalMinutes = this.currentStep * 0.25; // 15-second intervals = 0.25 minutes
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.floor(totalMinutes % 60);
    
    this.simulationData.simulationTime = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Update day
    this.simulationData.simulationDay = Math.floor(totalMinutes / (24 * 60)) + 1;
    
    // Update solar output based on time
    const hourIndex = Math.floor(hours);
    this.simulationData.solarOutput = this.solarSchedule[hourIndex] + 
      (Math.random() - 0.5) * 0.5; // Add some variation
    this.simulationData.solarOutput = Math.max(0, this.simulationData.solarOutput);
    
    // Smart appliance scheduling based on price
    const currentPrice = this.priceSchedule[hourIndex];
    this.updateApplianceScheduling(currentPrice, hours);
    
    // Calculate house demand
    this.simulationData.houseDemand = this.simulationData.appliances
      .filter(app => app.active)
      .reduce((sum, app) => sum + app.power, 0);
    
    // Update battery behavior
    this.updateBatteryBehavior(currentPrice);
    
    // Calculate grid power
    this.simulationData.gridPower = Math.max(0, 
      this.simulationData.houseDemand - 
      this.simulationData.solarOutput + 
      this.simulationData.batteryPower
    );
  }

  updateApplianceScheduling(currentPrice, hour) {
    // Smart scheduling based on price and time
    this.simulationData.appliances = this.simulationData.appliances.map(app => {
      let shouldBeActive = app.active;
      
      switch(app.type) {
        case 'dishwasher':
          // Run during low price hours (1am-5am)
          shouldBeActive = currentPrice < 0.015 && hour >= 1 && hour <= 5;
          break;
          
        case 'wash_machine':
          // Run during low price hours (2am-6am)
          shouldBeActive = currentPrice < 0.018 && hour >= 2 && hour <= 6;
          break;
          
        case 'clothes_dryer':
          // Run after washing machine and when solar is available
          shouldBeActive = (currentPrice < 0.020 || this.simulationData.solarOutput > 3) && 
                          hour >= 3 && hour <= 7;
          break;
          
        case 'hvac':
          // Run during day when needed, optimize for price
          shouldBeActive = hour >= 6 && hour <= 22 && 
                          (currentPrice < 0.030 || this.simulationData.solarOutput > 2);
          break;
          
        case 'water_heater':
          // Heat during low price or high solar
          shouldBeActive = currentPrice < 0.025 || this.simulationData.solarOutput > 3;
          break;
          
        case 'ev_charger':
          // Charge during night low rates or high solar
          shouldBeActive = (hour >= 23 || hour <= 6) || this.simulationData.solarOutput > 4;
          break;
          
        case 'tv':
          // Evening entertainment
          shouldBeActive = hour >= 18 && hour <= 23;
          break;
          
        case 'refrigerator':
          // Always on
          shouldBeActive = true;
          break;
          
        case 'lights':
          // Morning and evening
          shouldBeActive = (hour >= 6 && hour <= 8) || (hour >= 18 && hour <= 23);
          break;
          
        case 'vacuum':
          // Weekend morning simulation
          shouldBeActive = hour >= 9 && hour <= 11 && Math.random() > 0.7;
          break;
          
        case 'hair_dryer':
          // Morning routine
          shouldBeActive = hour >= 7 && hour <= 9 && Math.random() > 0.8;
          break;
      }
      
      return { ...app, active: shouldBeActive };
    });
  }

  updateBatteryBehavior(currentPrice) {
    const excessSolar = Math.max(0, this.simulationData.solarOutput - this.simulationData.houseDemand);
    
    if (excessSolar > 0 && this.simulationData.batteryLevel < 95) {
      // Charge from solar
      this.simulationData.batteryStatus = 'charging';
      this.simulationData.batteryPower = Math.min(2.4, excessSolar);
      this.simulationData.batteryLevel = Math.min(100, 
        this.simulationData.batteryLevel + this.simulationData.batteryPower * 0.1);
    } else if (currentPrice > 0.030 && this.simulationData.batteryLevel > 20) {
      // Discharge during high prices
      this.simulationData.batteryStatus = 'discharging';
      this.simulationData.batteryPower = -Math.min(2.4, 
        Math.max(0, this.simulationData.houseDemand - this.simulationData.solarOutput));
      this.simulationData.batteryLevel = Math.max(10, 
        this.simulationData.batteryLevel + this.simulationData.batteryPower * 0.1);
    } else if (currentPrice < 0.015 && this.simulationData.batteryLevel < 90) {
      // Charge from grid during very low prices
      this.simulationData.batteryStatus = 'charging';
      this.simulationData.batteryPower = 1.5;
      this.simulationData.batteryLevel = Math.min(100, 
        this.simulationData.batteryLevel + this.simulationData.batteryPower * 0.1);
    } else {
      this.simulationData.batteryStatus = 'empty';
      this.simulationData.batteryPower = 0;
    }
  }

  getCurrentState() {
    return Promise.resolve(this.simulationData);
  }

  toggleAppliance(applianceId) {
    const appIndex = this.simulationData.appliances.findIndex(app => app.id === applianceId);
    if (appIndex !== -1) {
      this.simulationData.appliances[appIndex].active = 
        !this.simulationData.appliances[appIndex].active;
    }
    return Promise.resolve({ success: true });
  }

  // Mock socket.io for compatibility
  on(event, callback) {
    // Store callbacks for demo events
    if (!this.eventCallbacks) {
      this.eventCallbacks = {};
    }
    this.eventCallbacks[event] = callback;
  }

  emit(event, data) {
    // Handle demo events
    console.log(`Demo event: ${event}`, data);
    return Promise.resolve();
  }
}
