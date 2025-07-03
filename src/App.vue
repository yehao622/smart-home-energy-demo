<template>
  <div class="container">
    <header>
      <h1>Smart Home Energy Simulator</h1>
      <div class="demo-badge">
        <span>🚀 Demo Mode</span>
      </div>
    </header>

    <div class="main-layout">
      <div class="diagram-section">
        <!-- Use the actual component instead of mock -->
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
          :rl-prediction="rlPrediction"
          :simulation-elapsed-minutes="simulationElapsedMinutes"
          :simulation-formatted-time="simulationFormattedTime"
          :simulation-day="simulationDay"
          :home-temperature-history="homeTemperatureHistory"
          :water-temperature-history="waterTemperatureHistory"
          :appliance-power-history="appliancePowerHistory"
          :simulation-completed="simulationCompleted"
          @start-simulation="startSimulation"
          @pause-simulation="pauseSimulation"
          @resume-simulation="resumeSimulation"
          @reset-simulation="resetSimulation"
          @toggle-appliance="toggleAppliance"
          @demand-updated="updateHouseDemand"
          @grid-power-updated="updateGridPower"
          @config-updated="handleConfigUpdated"
          @speed-changed="handleSpeedChange"
          @battery-critical="handleBatteryCritical"
          @history-updated="onHistoryUpdated"
          @hourly-data-update="handleHourlyDataUpdate"
          @simulation-complete="handleSimulationComplete"
          @energy-models-updated="handleEnergyModelsUpdate"
          @solar-output-updated="solarOutput = $event"
          @battery-level-updated="batteryLevel = $event"
          @battery-status-updated="batteryStatus = $event"
          @update-appliance-power="handleAppliancePowerUpdate"
        />
      </div>
    </div>

    <!-- AI Optimization controls -->
    <div class="rl-simulation-controls" v-if="showRlControls">
       <h3>🤖 AI Optimization Simulation</h3>
  
      <div class="rl-simulation-info">
        <div class="rl-step-display">
          <div class="rl-step-label">Day:</div>
          <div class="rl-step-value">{{ currentDay }}</div>
        </div>
    
        <div class="rl-step-display">
          <div class="rl-step-label">Time:</div>
          <div class="rl-step-value">{{ formattedTimeStep }}</div>
        </div>
    
        <div class="rl-step-display">
          <div class="rl-step-label">Step:</div>
          <div class="rl-step-value">{{ formattedStepDisplay }}</div>
        </div>
      </div>
  
      <div class="rl-step-buttons">
        <button @click="previousStep" class="rl-btn rl-prev-btn" :disabled="!canGoBack || autoPlayActive">
          ⏮️ Previous
        </button>
    
        <button @click="nextStep" class="rl-btn rl-next-btn" :disabled="autoPlayActive">
          ⏭️ Next
        </button>
    
        <button @click="toggleAutoplay" class="rl-btn" :class="{'rl-pause-btn': autoPlayActive, 'rl-play-btn': !autoPlayActive}">
          {{ autoPlayActive ? '⏸️ Pause' : '▶️ Auto Play' }}
        </button>
      </div>
    </div>

    <!-- Demo Information Panel -->
    <div class="demo-info-panel">
      <h3>🎯 Demo Features</h3>
      <div class="demo-features">
        <div class="demo-feature">
          <span class="feature-icon">🏠</span>
          <span>Smart Home Energy Management</span>
        </div>
        <div class="demo-feature">
          <span class="feature-icon">🤖</span>
          <span>AI-Powered Optimization</span>
        </div>
        <div class="demo-feature">
          <span class="feature-icon">📊</span>
          <span>Real-time Energy Analytics</span>
        </div>
        <div class="demo-feature">
          <span class="feature-icon">🔋</span>
          <span>Battery & Solar Integration</span>
        </div>
      </div>
      <div class="demo-instructions">
        <p>👆 <strong>Try it:</strong> Click the Start button above to begin the simulation, toggle appliances, and watch the AI optimize your energy usage!</p>
      </div>
    </div>
  </div>
</template>

<script>
// Import the main component that contains all the logic

import EnergyFlowDiagram from './components/EnergyFlowDiagram.vue';

export default {
  components: {
    EnergyFlowDiagram
  },

  data() {
    return {
      currentSimulationStep: 0,
      showRlControls: true,

      // Simulation state
      simulationRunning: false,
      simulationState: 'idle',
      simulationTimer: null,
      simulationInterval: 500,
      simulationElapsedTime: 0,
      
      // Energy data
      solarOutput: 0,
      batteryLevel: 35,
      batteryStatus: 'empty',
      batteryPower: 0,
      gridPower: 0,
      houseDemand: 0,

      // Simulation clock
      simulationElapsedMinutes: 0,
      simulationFormattedTime: "00:00",
      simulationDay: 1,

      simulationSteps: 0,
      maxSimulationSteps: null,
      simulationCompleted: false,

      energyModelState: {
        indoorTemperature: 24.0,
        waterTemperature: 55.0,
        evSoC: 0.0,
        evConnected: false,
        hvacPower: 0,
        waterHeaterPower: 0,
        evPower: 0
      },
      
      // Devices/appliances
      appliances: [
        // Group 1: Fixed power, must run for full duration
        { id: 1, name: 'Dishwasher', type: 'dishwasher', power: 1.8, active: false, group: 1 },
        { id: 2, name: 'Wash Machine', type: 'wash_machine', power: 0.4, active: false, group: 1 },
        { id: 3, name: 'Clothes Dryer', type: 'clothes_dryer', power: 1.2, active: false, group: 1 },
      
        // Group 2: Variable power, can be toggled during allowed time
        { id: 4, name: 'HVAC', type: 'hvac', power: 2.5, active: false, group: 2 },
        { id: 5, name: 'Water Heater', type: 'water_heater', power: 4.5, active: false, group: 2 },
        { id: 6, name: 'EV Charger', type: 'ev_charger', power: 6.0, active: false, group: 2 },
      
        // Group 3: Fixed power, on for entire duration
        { id: 7, name: 'TV', type: 'tv', power: 0.1, active: false, group: 3 },
        { id: 8, name: 'Refrigerator', type: 'refrigerator', power: 0.2, active: true, group: 3 },
        { id: 9, name: 'Lights', type: 'lights', power: 0.2, active: false, group: 3 },
        { id: 10, name: 'Vacuum Cleaner', type: 'vacuum', power: 1.2, active: false, group: 3 },
        { id: 11, name: 'Hair Dryer', type: 'hair_dryer', power: 1.0, active: false, group: 3 }
      ],
      
      // Initial values to reset to
      initialState: {
        solarOutput: 0,
        batteryLevel: 35,
        batteryStatus: 'empty',
        batteryPower: 0,
        gridPower: 0,
        houseDemand: 0.2
      },

      // AI/RL related data
      rlPrediction: null,
      currentDay: 1,
      currentTimeStep: 0,
      autoPlayActive: false,
      autoPlayTimer: null,
      
      // History data for charts
      homeTemperatureHistory: new Array(96).fill(null),
      waterTemperatureHistory: new Array(96).fill(null),
      appliancePowerHistory: {
        dishwasher: new Array(96).fill(0),
        wash_machine: new Array(96).fill(0),
        clothes_dryer: new Array(96).fill(0)
      }
    };
  },

  computed: {
    canGoBack() {
      return !(this.currentDay === 1 && this.currentTimeStep === 0);
    },

    formattedTimeStep() {
      const totalMinutes = this.currentTimeStep * 15;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    },

    formattedStepDisplay() {
      return `${this.currentTimeStep + 1}/96`;
    }
  },
  
  mounted() {
    console.log('Smart Home Energy Simulator Demo Mode Initialized');
    this.startDemoSimulation();
  },

  methods: {
    startDemoSimulation() {
      // Auto-start a demo simulation for Vercel
      this.simulationRunning = true;
      this.simulationState = 'manual';
      
      this.simulationTimer = setInterval(() => {
        this.updateDemoSimulation();
      }, 2000); // Update every 2 seconds for demo
    },

    updateDemoSimulation() {
      // Simulate time progression
      this.simulationElapsedMinutes += 15; // 15 minutes per step
      const hours = Math.floor(this.simulationElapsedMinutes / 60) % 24;
      const minutes = this.simulationElapsedMinutes % 60;
      this.simulationFormattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Simulate solar output based on time
      const timeOfDay = hours / 24;
      if (hours >= 6 && hours <= 18) {
        const solarFactor = Math.sin((hours - 6) / 12 * Math.PI);
        this.solarOutput = parseFloat((5 * solarFactor * (0.8 + Math.random() * 0.4)).toFixed(1));
      } else {
        this.solarOutput = 0;
      }

      // Calculate house demand
      this.houseDemand = parseFloat(
        this.appliances
          .filter(app => app.active)
          .reduce((sum, app) => sum + app.power, 0)
          .toFixed(1)
      );

      // Simple battery simulation
      if (this.solarOutput > this.houseDemand && this.batteryLevel < 100) {
        this.batteryLevel = Math.min(100, this.batteryLevel + 2);
        this.batteryStatus = 'charging';
        this.batteryPower = Math.min(2.4, this.solarOutput - this.houseDemand);
      } else if (this.houseDemand > this.solarOutput && this.batteryLevel > 10) {
        this.batteryLevel = Math.max(10, this.batteryLevel - 1);
        this.batteryStatus = 'discharging';
        this.batteryPower = -Math.min(2.4, this.houseDemand - this.solarOutput);
      } else {
        this.batteryStatus = 'empty';
        this.batteryPower = 0;
      }

      // Grid power calculation
      const solarToHouse = Math.min(this.solarOutput, this.houseDemand);
      const remainingDemand = Math.max(0, this.houseDemand - solarToHouse);
      const batteryContribution = this.batteryStatus === 'discharging' ? Math.abs(this.batteryPower) : 0;
      this.gridPower = parseFloat(Math.max(0, remainingDemand - batteryContribution).toFixed(1));

      // Auto-toggle some appliances for demo
      this.autoDemoAppliances(hours);

      // Reset after 24 hours
      if (this.simulationElapsedMinutes >= 24 * 60) {
        this.simulationElapsedMinutes = 0;
        this.simulationDay++;
      }
    },

    autoDemoAppliances(hour) {
      // Turn on HVAC when hot
      if (hour === 14 && !this.appliances[3].active) { // 2 PM
        this.toggleAppliance(4);
      }
      
      // Turn on lights in evening
      if (hour === 18 && !this.appliances[8].active) { // 6 PM
        this.toggleAppliance(9);
      }
      
      // Turn off lights at night
      if (hour === 23 && this.appliances[8].active) { // 11 PM
        this.toggleAppliance(9);
      }
      
      // Start dishwasher in evening
      if (hour === 19 && !this.appliances[0].active) { // 7 PM
        this.toggleAppliance(1);
      }
    },

    // Event handlers for the EnergyFlowDiagram component
    startSimulation(options = {}) {
      console.log('Start simulation', options);
      this.simulationRunning = true;
      this.simulationState = 'manual';
    },

    pauseSimulation() {
      console.log('Pause simulation');
      this.simulationRunning = false;
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
    },

    resumeSimulation() {
      console.log('Resume simulation');
      this.simulationRunning = true;
      this.startDemoSimulation();
    },

    resetSimulation() {
      console.log('Reset simulation');
      this.simulationRunning = false;
      this.simulationState = 'idle';
      this.simulationElapsedMinutes = 0;
      this.simulationFormattedTime = "00:00";
      this.simulationDay = 1;
      
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
      
      // Reset appliances
      this.appliances.forEach(app => {
        if (app.id !== 8) { // Keep refrigerator on
          app.active = false;
        }
      });
      
      // Reset energy values
      Object.assign(this, this.initialState);
      
      // Restart demo after a brief pause
      setTimeout(() => {
        this.startDemoSimulation();
      }, 1000);
    },

    toggleAppliance(id) {
      const appIndex = this.appliances.findIndex(app => app.id === id);
      if (appIndex !== -1) {
        this.appliances[appIndex].active = !this.appliances[appIndex].active;
        console.log(`${this.appliances[appIndex].name} ${this.appliances[appIndex].active ? 'ON' : 'OFF'}`);
      }
    },

    updateHouseDemand(newDemand) {
      this.houseDemand = newDemand;
    },

    updateGridPower(newPower) {
      this.gridPower = newPower;
    },

    handleConfigUpdated(configData) {
      console.log('Config updated', configData);
    },

    handleSpeedChange(speedData) {
      console.log('Speed changed', speedData);
    },

    handleBatteryCritical() {
      console.log('Battery critical');
    },

    onHistoryUpdated(data) {
      console.log('History updated', data);
    },

    handleHourlyDataUpdate(data) {
      console.log('Hourly data update', data);
    },

    handleSimulationComplete() {
      console.log('Simulation complete');
      this.simulationCompleted = true;
    },

    handleEnergyModelsUpdate(data) {
      this.energyModelState = { ...this.energyModelState, ...data };
    },

    handleAppliancePowerUpdate(data) {
      const appIndex = this.appliances.findIndex(app => app.id === data.id);
      if (appIndex !== -1) {
        this.appliances[appIndex].power = data.power;
      }
    },

    // AI/RL Methods
    previousStep() {
      if (this.canGoBack && !this.autoPlayActive) {
        this.currentTimeStep = (this.currentTimeStep - 1 + 96) % 96;
        if (this.currentTimeStep === 95) {
          this.currentDay = Math.max(1, this.currentDay - 1);
        }
        this.requestRlPrediction();
      }
    },

    nextStep() {
      if (this.autoPlayActive) return;
      
      this.currentTimeStep = (this.currentTimeStep + 1) % 96;
      if (this.currentTimeStep === 0) {
        this.currentDay = Math.min(60, this.currentDay + 1);
      }
      this.requestRlPrediction();
    },

    toggleAutoplay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
      
      this.autoPlayActive = !this.autoPlayActive;
      
      if (this.autoPlayActive) {
        this.simulationState = 'ai';
        this.autoPlayTimer = setInterval(() => {
          this.currentTimeStep = (this.currentTimeStep + 1) % 96;
          if (this.currentTimeStep === 0) {
            this.currentDay = Math.min(60, this.currentDay + 1);
          }
          this.requestRlPrediction();
        }, 1000);
      } else {
        this.simulationState = 'manual';
      }
    },

    requestRlPrediction() {
      // Mock RL prediction for demo
      const mockPrediction = {
        timestamp: this.currentTimeStep,
        day: this.currentDay,
        environment: {
          price: 0.025 + Math.random() * 0.02,
          solar_production: this.solarOutput,
          outside_temp: 20 + Math.random() * 10
        },
        temperatures: {
          home: {
            current: 22 + Math.random() * 4,
            setpoint: 22
          },
          water: {
            current: 58 + Math.random() * 4,
            setpoint: 60
          }
        },
        battery: {
          soc: this.batteryLevel / 100,
          power: this.batteryPower
        },
        ev: {
          soc: Math.random() * 0.8,
          power: Math.random() * 3,
          connected: Math.random() > 0.3
        },
        appliances: {
          controllable: {
            hvac: {
              power: this.appliances[3].active ? this.appliances[3].power : 0,
              active: this.appliances[3].active
            },
            water_heater: {
              power: this.appliances[4].active ? this.appliances[4].power : 0,
              active: this.appliances[4].active
            }
          },
          shiftable: {
            dishwasher: {
              active: this.appliances[0].active,
              power: this.appliances[0].active ? this.appliances[0].power : 0,
              progress: Math.floor(Math.random() * 4),
              total_duration: 4
            },
            wash_machine: {
              active: this.appliances[1].active,
              power: this.appliances[1].active ? this.appliances[1].power : 0,
              progress: Math.floor(Math.random() * 6),
              total_duration: 6
            },
            clothes_dryer: {
              active: this.appliances[2].active,
              power: this.appliances[2].active ? this.appliances[2].power : 0,
              progress: Math.floor(Math.random() * 5),
              total_duration: 5
            }
          },
          fixed: {
            tv: { active: this.appliances[6].active, power: this.appliances[6].power },
            refrigerator: { active: this.appliances[7].active, power: this.appliances[7].power },
            lights: { active: this.appliances[8].active, power: this.appliances[8].power },
            vacuum: { active: this.appliances[9].active, power: this.appliances[9].power },
            hair_dryer: { active: this.appliances[10].active, power: this.appliances[10].power }
          }
        },
        energy_flow: {
          grid: { net_power: this.gridPower },
          house: { demand: { total: this.houseDemand } }
        }
      };
      
      this.rlPrediction = mockPrediction;
    }
  },

  beforeUnmount() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
    }
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

header h1 {
  margin: 0;
  color: #2d3748;
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.demo-badge {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(255,107,107,0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.main-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.diagram-section {
  flex: 1;
  min-width: 100%;
}

.rl-simulation-controls {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border-left: 5px solid #3b82f6;
}

.rl-simulation-controls h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1f2937;
  font-size: 1.3rem;
}

.rl-simulation-info {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.rl-step-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.rl-step-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.rl-step-value {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
}

.rl-step-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.rl-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.rl-prev-btn {
  background: linear-gradient(45deg, #6b7280, #4b5563);
  color: white;
}

.rl-next-btn {
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  color: white;
}

.rl-play-btn {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
}

.rl-pause-btn {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  color: white;
}

.rl-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.rl-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.demo-info-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border-left: 5px solid #10b981;
}

.demo-info-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1f2937;
  font-size: 1.3rem;
}

.demo-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.demo-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.feature-icon {
  font-size: 1.5rem;
}

.demo-instructions {
  background: linear-gradient(45deg, #dbeafe, #bfdbfe);
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.demo-instructions p {
  margin: 0;
  color: #1e40af;
  font-weight: 500;
}

/* Energy Flow Diagram Styles */
.energy-flow-container {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.config-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.simulation-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.simulation-time-input input {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.config-btn {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.start-btn, .resume-btn {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pause-btn {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn {
  background: linear-gradient(45deg, #6b7280, #4b5563);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speed-control select {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.simulation-time-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
  padding: 15px 20px;
  background: linear-gradient(45deg, #f3f4f6, #e5e7eb);
  border-radius: 10px;
  font-weight: bold;
  border-left: 5px solid #3b82f6;
}

.time-icon {
  font-size: 1.5rem;
}

.time-value {
  font-size: 1.8rem;
  color: #1f2937;
}

.time-day {
  font-size: 14px;
  color: #6b7280;
  padding: 4px 12px;
  background: #e5e7eb;
  border-radius: 15px;
}

.diagram {
  width: 100%;
  height: 400px;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
}

.device-icon {
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-icon.active {
  filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5));
}

.device-icon.solar.active {
  filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.5));
}

.device-icon.battery.active {
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.5));
}

.device-icon.grid.active {
  filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
}

.device-label {
  font-size: 14px;
  font-weight: bold;
  fill: #374151;
}

.device-value {
  font-size: 12px;
  font-weight: bold;
  fill: #1f2937;
}

.flow-line {
  stroke-dasharray: 10,5;
  filter: drop-shadow(0 0 3px rgba(0,0,0,0.3));
}

.appliances {
  margin-top: 20px;
}

.appliance-group {
  margin-bottom: 25px;
}

.appliance-group h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 10px 15px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.appliances-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.appliance-card {
  background: #f8fafc;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.appliance-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #e2e8f0;
  transition: all 0.3s ease;
}

.appliance-card.group-1::before {
  background: #f43f5e;
}

.appliance-card.group-2::before {
  background: #10b981;
}

.appliance-card.group-3::before {
  background: #3b82f6;
}

.appliance-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.appliance-card.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.appliance-card.group-1.active {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-color: #f43f5e;
  box-shadow: 0 8px 25px rgba(244, 63, 94, 0.2);
}

.appliance-card.group-2.active {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-color: #10b981;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
}

.appliance-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
  display: block;
}

.appliance-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 5px;
  font-size: 0.95rem;
}

.appliance-power {
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 8px;
}

.appliance-status {
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
}

.appliance-status.on {
  background: #dcfce7;
  color: #166534;
}

.appliance-status.off {
  background: #fee2e2;
  color: #991b1b;
}

.energy-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 25px;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  border-left: 5px solid;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  background: linear-gradient(135deg, transparent 0%, currentColor 100%);
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.stat-card.solar {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  color: #f59e0b;
}

.stat-card.battery {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #10b981;
}

.stat-card.grid {
  border-left-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff, #e7d3ff);
  color: #8b5cf6;
}

.stat-card.home {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #3b82f6;
}

.stat-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  position: relative;
  z-index: 1;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .rl-simulation-info {
    flex-direction: column;
  }
  
  .demo-features {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  header h1 {
    font-size: 1.8rem;
  }
  
  .appliances-group {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .energy-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .rl-step-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .rl-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .appliances-group {
    grid-template-columns: 1fr 1fr;
  }
  
  .energy-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
