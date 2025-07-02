// Add these components to make your demo more engaging
// components/DemoWelcome.vue

<template>
  <div class="container">
    <!-- Demo Banner -->
    <div class="demo-banner">
      🎭 DEMO MODE - Smart Home Energy Simulator
      <span class="demo-subtitle">AI-powered energy management system demonstration</span>
    </div>

    <header>
      <h1>Smart Home Energy Simulator</h1>
    </header>

    <div class="main-layout">
      <!-- Energy Flow Diagram -->
      <div class="diagram-section">
        <energy-flow-diagram
           :solar-output="solarOutput"
           :battery-level="batteryLevel"
           :battery-status="batteryStatus"
           :battery-power="batteryPower"
           :grid-power="gridPower"
           :house-demand="houseDemand"
           :appliances="appliances"
           :is-running="simulationRunning"
           :simulation-state="simulationState"
           :simulation-elapsed-minutes="simulationElapsedMinutes"
           :simulation-formatted-time="simulationFormattedTime"
           :simulation-day="simulationDay"
           :simulation-completed="simulationCompleted"
           @start-simulation="startSimulation"
           @pause-simulation="pauseSimulation"
           @resume-simulation="resumeSimulation"
           @reset-simulation="resetSimulation"
           @toggle-appliance="toggleAppliance"
           @demand-updated="updateHouseDemand"
           @grid-power-updated="updateGridPower"
           @speed-changed="handleSpeedChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import EnergyFlowDiagram from './EnergyFlowDiagram.vue';
import { createMockSocket } from '../services/mockSocket.js';

export default {
  components: {
    EnergyFlowDiagram
  },

  name: 'DemoWelcome',
  data() {
    return {
      // Simulation state
      simulationRunning: false,
      simulationState: 'idle',
      simulationElapsedMinutes: 0,
      simulationFormattedTime: "00:00",
      simulationDay: 1,
      simulationCompleted: false,
      
      // Energy data
      solarOutput: 0,
      batteryLevel: 45,
      batteryStatus: 'empty',
      batteryPower: 0,
      gridPower: 0,
      houseDemand: 0,
      
      // Appliances
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
  },

  mounted() {
    // Set up mock socket connection for demo
    this.socket = createMockSocket();
    
    this.setupSocketHandlers();
    
    // Get initial state
    this.socket.emit('get_current_state');
  },

  methods: {
    setupSocketHandlers() {
      this.socket.on('connect', () => {
        console.log("Demo socket connected!");
      });

      this.socket.on('simulation_update', (data) => {
        this.solarOutput = data.solarOutput || 0;
        this.batteryLevel = data.batteryLevel || 45;
        this.batteryStatus = data.batteryStatus || 'empty';
        this.batteryPower = data.batteryPower || 0;
        this.gridPower = data.gridDraw || 0;
        this.houseDemand = data.houseDemand || 0;
        this.simulationElapsedMinutes = data.elapsedMinutes || 0;
        this.simulationFormattedTime = data.formattedTime || "00:00";
        this.simulationDay = data.simulationDay || 1;

        if (data.devices && data.devices.length > 0) {
          this.appliances = this.appliances.map(app => {
            const device = data.devices.find(d => d.type === app.type);
            if (device) {
              return {
                ...app,
                active: device.active,
                power: device.power
              };
            }
            return app;
          });
        }
      });

      this.socket.on('simulation_status', (status) => {
        this.simulationRunning = status.running;
        if (status.mode) {
          this.simulationState = status.mode;
        }
      });

      this.socket.on('simulation_reset', (data) => {
        this.simulationRunning = false;
        this.simulationState = 'idle';
        this.solarOutput = data.solarOutput || 0;
        this.batteryLevel = data.batteryLevel || 45;
        this.batteryStatus = data.batteryStatus || 'empty';
        this.batteryPower = 0;
        this.gridPower = data.gridDraw || 0;
        this.houseDemand = data.houseDemand || 0;
        this.simulationElapsedMinutes = 0;
        this.simulationFormattedTime = "00:00";
        this.simulationDay = 1;
        
        this.appliances = this.appliances.map(app => ({
          ...app,
          active: app.type === 'refrigerator'
        }));
      });
    },

    startSimulation() {
      this.simulationRunning = true;
      this.simulationState = 'manual';
      this.socket.emit('start_simulation', {
        initialState: {
          simulationMode: 'manual',
          devices: this.appliances
        },
        interval: 1000
      });
    },
    
    pauseSimulation() {
      this.socket.emit('stop_simulation');
    },
    
    resumeSimulation() {
      this.socket.emit('start_simulation', {
        initialState: {
          simulationMode: 'manual',
          preserveTime: true,
          elapsedMinutes: this.simulationElapsedMinutes
        },
        interval: 1000
      });
    },
    
    resetSimulation() {
      this.socket.emit('reset_simulation');
    },
    
    toggleAppliance(applianceId) {
      const appIndex = this.appliances.findIndex(app => app.id === applianceId);
      
      if (appIndex !== -1) {
        this.appliances[appIndex].active = !this.appliances[appIndex].active;
        
        const newHouseDemand = this.appliances
          .filter(app => app.active)
          .reduce((sum, app) => sum + app.power, 0);
        
        this.houseDemand = parseFloat(newHouseDemand.toFixed(1));
        
        this.socket.emit('update_devices', {
          devices: this.appliances.map(app => ({
            id: app.id,
            name: app.name,
            type: app.type,
            power: app.power,
            active: app.active
          }))
        });
      }
    },

    updateHouseDemand(newDemand) {
      this.houseDemand = newDemand;
    },

    updateGridPower(newPower) {
      this.gridPower = newPower;
    },

    handleSpeedChange(speedData) {
      console.log('Speed changed:', speedData);
    }
  },
  
  beforeUnmount() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.demo-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: white;
  padding: 12px 20px;
  text-align: center;
  font-weight: bold;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.demo-subtitle {
  opacity: 0.9;
  margin-left: 20px;
  font-weight: normal;
  font-size: 14px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 60px 0 20px 0; /* Account for demo banner */
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.main-layout {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.diagram-section {
  flex: 1;
  min-width: 800px;
}

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  
  .diagram-section {
    min-width: 100%;
  }
  
  .demo-banner {
    font-size: 14px;
    padding: 8px 15px;
  }
</style>
