// src/services/mockSocket.js
import { DemoService } from './demoService.js';

export class MockSocketService {
  constructor() {
    this.demoService = new DemoService();
    this.connected = true;
    this.eventHandlers = {};
  }

  // Mock socket.io methods
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  emit(event, data) {
    console.log(`Emitting: ${event}`, data);
    
    // Handle specific events
    switch(event) {
      case 'start_simulation':
        this.demoService.startSimulation().then(() => {
          this.trigger('simulation_status', { 
            running: true, 
            mode: 'manual',
            interval: 1000
          });
          
          // Start sending updates
          this.startSimulationUpdates();
        });
        break;
        
      case 'stop_simulation':
        this.demoService.stopSimulation().then(() => {
          this.trigger('simulation_status', { 
            running: false, 
            mode: 'manual' 
          });
        });
        break;
        
      case 'reset_simulation':
        this.demoService.resetSimulation().then(() => {
          this.trigger('simulation_reset', {
            time: new Date().toISOString(),
            devices: this.demoService.simulationData.appliances,
            solarOutput: 0,
            batteryLevel: 45,
            batteryStatus: 'empty',
            batteryPower: 0,
            gridDraw: 0,
            houseDemand: 0,
            simulationMode: 'idle'
          });
        });
        break;
        
      case 'get_current_state':
        this.demoService.getCurrentState().then(state => {
          this.trigger('simulation_update', {
            time: new Date().toISOString(),
            devices: state.appliances,
            solarOutput: state.solarOutput,
            batteryLevel: state.batteryLevel,
            batteryStatus: state.batteryStatus,
            batteryPower: state.batteryPower,
            gridDraw: state.gridPower,
            houseDemand: state.houseDemand,
            simulationMode: 'manual',
            formattedTime: state.simulationTime,
            currentStep: this.demoService.currentStep,
            simulationDay: state.simulationDay
          });
        });
        break;
        
      case 'update_devices':
        if (data && data.devices) {
          data.devices.forEach(device => {
            this.demoService.toggleAppliance(device.id);
          });
        }
        break;
    }
  }

  trigger(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  startSimulationUpdates() {
    this.updateInterval = setInterval(() => {
      if (this.demoService.isRunning) {
        this.demoService.getCurrentState().then(state => {
          this.trigger('simulation_update', {
            time: new Date().toISOString(),
            devices: state.appliances,
            solarOutput: state.solarOutput,
            batteryLevel: state.batteryLevel,
            batteryStatus: state.batteryStatus,
            batteryPower: state.batteryPower,
            gridDraw: state.gridPower,
            houseDemand: state.houseDemand,
            simulationMode: 'manual',
            elapsedMinutes: this.demoService.currentStep * 0.25,
            formattedTime: state.simulationTime,
            currentStep: this.demoService.currentStep,
            simulationDay: state.simulationDay,
            energyModels: {
              indoorTemperature: 22 + Math.sin(this.demoService.currentStep * 0.1) * 2,
              waterTemperature: 58 + Math.cos(this.demoService.currentStep * 0.05) * 5,
              evSoC: 0.3 + (this.demoService.currentStep * 0.001) % 0.6,
              evConnected: this.demoService.currentStep % 100 > 20
            }
          });
        });
      }
    }, 1000);
  }

  removeAllListeners() {
    this.eventHandlers = {};
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  disconnect() {
    this.removeAllListeners();
    this.connected = false;
  }
}

// Create a global instance that mimics socket.io
export function createMockSocket() {
  return new MockSocketService();
}
