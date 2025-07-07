<template>
  <div class="container">
    <header>
      <h1>Smart Home Energy Simulator</h1>
      <div class="demo-badge">
        <span>🚀 Demo Mode</span>
      </div>
    </header>

    <div class="main-layout">
      <!-- Energy Flow Diagram -->
      <div class="diagram-section">
        <energy-flow-diagram
           ref="energyDiagram"
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
      houseDemand: 0.2,

      // Simulation clock
      simulationElapsedMinutes: 0,
      simulationFormattedTime: "00:00",
      simulationDay: 1,

      // Mock hourly data for demo
      hourlyData: this.generateMockHourlyData(),
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
    // Create mock socket for EnergyFlowDiagram component
    window.io = () => this.createMockSocket();
  },

  methods: {
    // Generate mock hourly data for 24 hours
    generateMockHourlyData() {
      const data = [];
      for (let hour = 0; hour < 24; hour++) {
        // Solar output follows a bell curve (6am-6pm)
        let solar = 0;
        if (hour >= 6 && hour <= 18) {
          const normalizedHour = (hour - 12) / 6; // -1 to 1
          solar = 5 * Math.max(0, 1 - normalizedHour * normalizedHour) * (0.8 + Math.random() * 0.4);
        }
        
        // Temperature varies throughout the day
        const temp = 20 + 10 * Math.sin((hour - 6) / 24 * 2 * Math.PI) + Math.random() * 3;
        
        // Price is higher during peak hours (6pm-10pm)
        let price = 0.02;
        if (hour >= 18 && hour <= 22) price = 0.045;
        else if (hour >= 6 && hour <= 9) price = 0.035;
        price += Math.random() * 0.01;
        
        data.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          hourValue: hour,
          solar: parseFloat(solar.toFixed(1)),
          temperature: parseFloat(temp.toFixed(1)),
          price: parseFloat(price.toFixed(3))
        });
      }
      return data;
    },

    // Create mock socket for components that expect socket.io
    createMockSocket() {
      const mockSocket = {
        on: (event, callback) => {
          // Store callbacks for later use
          if (!this.mockCallbacks) this.mockCallbacks = {};
          this.mockCallbacks[event] = callback;
        },
        emit: (event, data) => {
          // Handle specific events that components emit
          if (event === 'start_simulation') {
            this.startSimulation(data);
          } else if (event === 'stop_simulation') {
            this.pauseSimulation();
          } else if (event === 'reset_simulation') {
            this.resetSimulation();
          }
        },
        removeAllListeners: () => {},
        disconnect: () => {}
      };
      
      // Simulate connection after short delay
      setTimeout(() => {
        if (this.mockCallbacks && this.mockCallbacks.connect) {
          this.mockCallbacks.connect();
        }
      }, 100);
      
      return mockSocket;
    },

    // Event handlers for the EnergyFlowDiagram component
    startSimulation(options = {}) {
      console.log('Start simulation', options);
      this.simulationRunning = true;
      this.simulationState = 'manual';
      this.simulationSteps = 0;
      this.simulationElapsedMinutes = 0;
      this.simulationFormattedTime = "00:00";
      
      // Start the simulation timer
      this.simulationTimer = setInterval(() => {
        this.updateSimulation();
      }, 2000);

      // Notify the EnergyFlowDiagram component
      if (this.mockCallbacks && this.mockCallbacks.simulation_status) {
        this.mockCallbacks.simulation_status({
          running: true,
          mode: 'manual'
        });
      }
    },

    updateSimulation() {
      if (!this.simulationRunning) return;

      // Update simulation time
      this.simulationElapsedMinutes += 15; // 15 minutes per step
      const hours = Math.floor(this.simulationElapsedMinutes / 60) % 24;
      const minutes = this.simulationElapsedMinutes % 60;
      this.simulationFormattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const currentStep = Math.floor(this.simulationElapsedMinutes / 15) % 96;
      this.simulationSteps = Math.floor(this.simulationElapsedMinutes / 15);
      
      // Get current hour data
      const hourIndex = hours % 24;
      const currentHourData = this.hourlyData[hourIndex];
      
      // Update solar output based on time
      this.solarOutput = currentHourData.solar;

      // Calculate house demand
      this.houseDemand = parseFloat(
        this.appliances
          .filter(app => app.active)
          .reduce((sum, app) => sum + app.power, 0)
          .toFixed(1)
      );

      // Simple battery and grid simulation
      this.updateEnergyFlows(currentHourData);

      // Auto-toggle some appliances for realistic demo
      if (this.simulationSteps % 8 === 0) { // Every 2 hours
        this.autoToggleAppliances(hours, currentStep);
      }

      // Update energy models
      this.updateEnergyModels(currentHourData);
      this.$forceUpdate();

      // Force notify components about energy model changes
      this.$emit('energy-models-updated', this.energyModelState);

      // Notify components with mock simulation update
      if (this.mockCallbacks && this.mockCallbacks.simulation_update) {
        this.mockCallbacks.simulation_update({
          time: new Date().toISOString(),
          devices: this.appliances,
          solarOutput: this.solarOutput,
          batteryLevel: this.batteryLevel,
          batteryStatus: this.batteryStatus,
          batteryPower: this.batteryPower,
          gridDraw: this.gridPower,
          houseDemand: this.houseDemand,
          simulationMode: this.simulationState,
          elapsedMinutes: this.simulationElapsedMinutes,
          formattedTime: this.simulationFormattedTime,
          currentStep: currentStep,
          energyModels: this.energyModelState,
          simulationDay: Math.floor(this.simulationElapsedMinutes / (24 * 60)) + 1
        });
      }

      // Reset after 24 hours
      if (this.simulationElapsedMinutes >= 24 * 60) {
        this.simulationElapsedMinutes = 0;
        this.simulationDay++;
      }
    },

    updateEnergyFlows(hourData) {
      const BATTERY_MIN_LEVEL = 10.01;
      const MAX_BATTERY_CHARGE_RATE = 2.4;
      const MAX_BATTERY_DISCHARGE_RATE = 2.4;

      // Calculate basic energy flows
      const solarToHouse = Math.min(this.solarOutput, this.houseDemand);
      const remainingDemand = Math.max(0, this.houseDemand - solarToHouse);
      const excessSolar = Math.max(0, this.solarOutput - solarToHouse);

      // Hour-based logic for battery charging/discharging
      const hour = parseInt(hourData.hour.split(':')[0]);
      const isPreferredChargingTime = (hour >= 12 && hour <= 15) || (hour >= 0 && hour <= 5);

      if (isPreferredChargingTime) {
        // Charge from excess solar or grid during off-peak
        if (excessSolar > 0 && this.batteryLevel < 100) {
          this.batteryStatus = 'charging';
          this.batteryPower = Math.min(excessSolar, MAX_BATTERY_CHARGE_RATE);
          this.batteryLevel = Math.min(100, this.batteryLevel + 2);
        } else if (hour >= 0 && hour <= 5 && this.batteryLevel < 80) {
          this.batteryStatus = 'charging';
          this.batteryPower = 1.5;
          this.batteryLevel = Math.min(100, this.batteryLevel + 1);
        } else {
          this.batteryStatus = 'stable';
          this.batteryPower = 0;
        }
      } else {
        // Peak hours - discharge battery if needed
        if (remainingDemand > 0 && this.batteryLevel > BATTERY_MIN_LEVEL) {
          this.batteryStatus = 'discharging';
          this.batteryPower = -Math.min(remainingDemand, MAX_BATTERY_DISCHARGE_RATE);
          this.batteryLevel = Math.max(BATTERY_MIN_LEVEL, this.batteryLevel - 1.5);
        } else {
          this.batteryStatus = 'empty';
          this.batteryPower = 0;
        }
      }

      // Calculate grid power
      const batteryContribution = this.batteryStatus === 'discharging' ? Math.abs(this.batteryPower) : 0;
      const gridToBattery = this.batteryStatus === 'charging' && excessSolar < this.batteryPower ? this.batteryPower - excessSolar : 0;
      this.gridPower = parseFloat(Math.max(0, remainingDemand - batteryContribution + gridToBattery).toFixed(1));

      // Handle solar export (negative grid power)
      if (excessSolar > this.batteryPower && this.batteryLevel > 95) {
        this.gridPower = -parseFloat((excessSolar - this.batteryPower).toFixed(1));
      }
    },

    updateEnergyModels(hourData) {
      const hour = parseInt(hourData.hour.split(':')[0]);
      
      // HVAC control with more aggressive temperature changes
      const hvacAppliance = this.appliances.find(app => app.type === 'hvac');
      const targetTemp = 22;
      
      if (hvacAppliance && hvacAppliance.active) {
        // When HVAC is on, move temperature toward target quickly
        const tempDiff = targetTemp - this.energyModelState.indoorTemperature;
        this.energyModelState.indoorTemperature += tempDiff * 0.4;
        
        // Update HVAC power based on how hard it's working
        const powerNeeded = Math.abs(tempDiff) * 0.8 + 0.5;
        hvacAppliance.power = Math.min(2.5, powerNeeded);
        
        console.log(`HVAC ON: Target=${targetTemp}°C, Current=${this.energyModelState.indoorTemperature.toFixed(1)}°C, Power=${hvacAppliance.power.toFixed(1)}kW`);
      } else {
        // When HVAC is off, temperature drifts toward outdoor
        const outdoorTemp = hourData.temperature;
        const tempDiff = outdoorTemp - this.energyModelState.indoorTemperature;
        this.energyModelState.indoorTemperature += tempDiff * 0.15;
        
        if (hvacAppliance) hvacAppliance.power = 0;
      }
      
      // Water heater control with visible changes
      const waterHeaterAppliance = this.appliances.find(app => app.type === 'water_heater');
      const targetWaterTemp = 60;
      
      if (waterHeaterAppliance && waterHeaterAppliance.active) {
        // When heater is on, heat water quickly
        const tempDiff = targetWaterTemp - this.energyModelState.waterTemperature;
        this.energyModelState.waterTemperature += tempDiff * 0.3;
        
        // Update power based on heating needs
        const powerNeeded = Math.abs(tempDiff) * 0.6 + 1.0;
        waterHeaterAppliance.power = Math.min(4.5, powerNeeded);
        
        console.log(`Water Heater ON: Target=${targetWaterTemp}°C, Current=${this.energyModelState.waterTemperature.toFixed(1)}°C, Power=${waterHeaterAppliance.power.toFixed(1)}kW`);
      } else {
        // When heater is off, water cools down
        this.energyModelState.waterTemperature = Math.max(45, this.energyModelState.waterTemperature - 0.8);
        
        if (waterHeaterAppliance) waterHeaterAppliance.power = 0;
      }
      
      // Auto-control appliances based on temperature
      this.temperatureBasedControl(hvacAppliance, waterHeaterAppliance);
      
      // Rest of EV logic stays the same...
      this.energyModelState.evConnected = hour >= 18 || hour <= 7;
      
      if (this.energyModelState.evConnected) {
        const evChargerActive = this.appliances.find(app => app.type === 'ev_charger')?.active || false;
        if (evChargerActive && this.energyModelState.evSoC < 0.85) {
          this.energyModelState.evSoC = Math.min(0.85, this.energyModelState.evSoC + 0.05);
        }
      } else {
        this.energyModelState.evSoC = Math.max(0.2, this.energyModelState.evSoC - 0.02);
      }

      this.$nextTick(() => {
        // Force update the EnergyFlowDiagram with new temperatures
        if (this.$refs.energyDiagram) {
          this.$refs.energyDiagram.indoorTemp = this.energyModelState.indoorTemperature.toFixed(1);
          this.$refs.energyDiagram.waterTemp = this.energyModelState.waterTemperature.toFixed(1);
          this.$refs.energyDiagram.currentHomeTemp = this.energyModelState.indoorTemperature.toFixed(1);
          this.$refs.energyDiagram.currentWaterTemp = this.energyModelState.waterTemperature.toFixed(1);
        }
      });

      this.updateTemperatureDisplay();
    },

    // Add this method to pass temperature updates to the diagram
    updateTemperatureDisplay() {
      // Emit temperature updates to child component
      this.$nextTick(() => {
        if (this.$refs.energyDiagram) {
          this.$refs.energyDiagram.indoorTemp = this.energyModelState.indoorTemperature;
          this.$refs.energyDiagram.waterTemp = this.energyModelState.waterTemperature;
        }
      });
    },

    temperatureBasedControl(hvacAppliance, waterHeaterAppliance) {
      // Auto-control HVAC based on temperature
      if (hvacAppliance) {
        const needsCooling = this.energyModelState.indoorTemperature > 25;
        const needsHeating = this.energyModelState.indoorTemperature < 19;
        
        if ((needsCooling || needsHeating) && !hvacAppliance.active) {
          this.toggleAppliance(hvacAppliance.id);
          console.log(`Auto-turned ON HVAC: Indoor temp = ${this.energyModelState.indoorTemperature.toFixed(1)}°C`);
        } else if (!needsCooling && !needsHeating && hvacAppliance.active) {
          this.toggleAppliance(hvacAppliance.id);
          console.log(`Auto-turned OFF HVAC: Indoor temp = ${this.energyModelState.indoorTemperature.toFixed(1)}°C`);
        }
      }
      
      // Auto-control water heater based on temperature
      if (waterHeaterAppliance) {
        const needsHeating = this.energyModelState.waterTemperature < 50;
        const isHot = this.energyModelState.waterTemperature > 62;
        
        if (needsHeating && !waterHeaterAppliance.active) {
          this.toggleAppliance(waterHeaterAppliance.id);
          console.log(`Auto-turned ON Water Heater: Water temp = ${this.energyModelState.waterTemperature.toFixed(1)}°C`);
        } else if (isHot && waterHeaterAppliance.active) {
          this.toggleAppliance(waterHeaterAppliance.id);
          console.log(`Auto-turned OFF Water Heater: Water temp = ${this.energyModelState.waterTemperature.toFixed(1)}°C`);
        }
      }
    },

    autoToggleAppliances(hour, step) {
      // More frequent and visible changes
      
      // Water heater cycles more often
      if ((hour === 7 || hour === 12 || hour === 19 || hour === 22) && step % 4 === 0) {
        const waterHeater = this.appliances.find(app => app.type === 'water_heater');
        if (waterHeater && this.energyModelState.waterTemperature < 55) {
          if (!waterHeater.active) this.toggleAppliance(waterHeater.id);
        } else if (waterHeater && waterHeater.active && this.energyModelState.waterTemperature > 62) {
          this.toggleAppliance(waterHeater.id);
        }
      }

      // HVAC responds to temperature
      if (step % 6 === 0) {
        const hvac = this.appliances.find(app => app.type === 'hvac');
        if (hvac) {
          const shouldBeOn = this.energyModelState.indoorTemperature > 24 || 
                            this.energyModelState.indoorTemperature < 20;
          if (shouldBeOn && !hvac.active) {
            this.toggleAppliance(hvac.id);
          } else if (!shouldBeOn && hvac.active) {
            this.toggleAppliance(hvac.id);
          }
        }
      }

      // Other appliances cycle every few hours
      if (hour === 18 && step % 4 === 0) {
        const lights = this.appliances.find(app => app.type === 'lights');
        if (lights && !lights.active) this.toggleAppliance(lights.id);
      }

      if (hour === 19 && step % 4 === 0) {
        const dishwasher = this.appliances.find(app => app.type === 'dishwasher');
        if (dishwasher && !dishwasher.active) this.toggleAppliance(dishwasher.id);
      }

      if (hour === 23 && step % 4 === 0) {
        const lights = this.appliances.find(app => app.type === 'lights');
        if (lights && lights.active) this.toggleAppliance(lights.id);
      }
    },

    pauseSimulation() {
      console.log('Pause simulation');
      this.simulationRunning = false;
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }

      if (this.mockCallbacks && this.mockCallbacks.simulation_status) {
        this.mockCallbacks.simulation_status({
          running: false,
          mode: this.simulationState
        });
      }
    },

    resumeSimulation() {
      console.log('Resume simulation');
      this.simulationRunning = true;
      
      this.simulationTimer = setInterval(() => {
        this.updateSimulation();
      }, 2000);

      if (this.mockCallbacks && this.mockCallbacks.simulation_status) {
        this.mockCallbacks.simulation_status({
          running: true,
          mode: this.simulationState
        });
      }
    },

    resetSimulation() {
      console.log('Reset simulation');
      this.simulationRunning = false;
      this.simulationState = 'idle';
      this.simulationElapsedMinutes = 0;
      this.simulationFormattedTime = "00:00";
      this.simulationDay = 1;
      this.currentDay = 1;
      this.currentTimeStep = 0;
      
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
      
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
        this.autoPlayActive = false;
      }
      
      // Reset appliances
      this.appliances.forEach(app => {
        if (app.id !== 8) { // Keep refrigerator on
          app.active = false;
        }
      });
      
      // Reset energy values
      Object.assign(this, this.initialState);
      
      // Reset energy models
      this.energyModelState = {
        indoorTemperature: 24.0,
        waterTemperature: 55.0,
        evSoC: 0.3,
        evConnected: false,
        hvacPower: 0,
        waterHeaterPower: 0,
        evPower: 0
      };

      // Reset history
      this.homeTemperatureHistory = new Array(96).fill(null);
      this.waterTemperatureHistory = new Array(96).fill(null);
      this.appliancePowerHistory = {
        dishwasher: new Array(96).fill(0),
        wash_machine: new Array(96).fill(0),
        clothes_dryer: new Array(96).fill(0)
      };

      if (this.mockCallbacks && this.mockCallbacks.simulation_reset) {
        this.mockCallbacks.simulation_reset({
          time: new Date().toISOString(),
          devices: this.appliances,
          solarOutput: this.solarOutput,
          batteryLevel: this.batteryLevel,
          batteryStatus: this.batteryStatus,
          batteryPower: 0,
          gridDraw: this.gridPower,
          houseDemand: this.houseDemand,
          simulationMode: 'idle'
        });
      }
    },

    toggleAppliance(id) {
      const appIndex = this.appliances.findIndex(app => app.id === id);
      if (appIndex !== -1) {
        this.appliances[appIndex].active = !this.appliances[appIndex].active;
        console.log(`${this.appliances[appIndex].name} ${this.appliances[appIndex].active ? 'ON' : 'OFF'}`);
        
        // Recalculate house demand immediately
        this.houseDemand = parseFloat(
          this.appliances
            .filter(app => app.active)
            .reduce((sum, app) => sum + app.power, 0)
            .toFixed(1)
        );
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
      // Update simulation timer interval
      if (this.simulationTimer && this.simulationRunning) {
        clearInterval(this.simulationTimer);
        const newInterval = speedData.interval || 2000;
        this.simulationTimer = setInterval(() => {
          this.updateSimulation();
        }, newInterval);
      }
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
        }, 1500);
      } else {
        this.simulationState = 'manual';
      }
    },

    requestRlPrediction() {
      // Generate mock RL prediction for AI demo mode
      const hourIndex = Math.floor(this.currentTimeStep / 4) % 24;
      const currentHourData = this.hourlyData[hourIndex];
      
      // Smart AI decisions based on time and conditions
      const hour = parseInt(currentHourData.hour.split(':')[0]);
      const isHighPriceTime = currentHourData.price > 0.035;
      const isSolarActive = currentHourData.solar > 1;
      
      // AI optimizes appliance scheduling
      const aiAppliances = {
        controllable: {
          hvac: {
            // Turn on HVAC during hot hours but consider price
            active: (hour >= 13 && hour <= 16 && currentHourData.temperature > 25) || 
                   (hour >= 20 && hour <= 22 && currentHourData.temperature > 22),
            power: 2.5
          },
          water_heater: {
            // Heat water during low price periods
            active: (!isHighPriceTime && (hour === 2 || hour === 11 || hour === 21)) ||
                   (this.energyModelState.waterTemperature < 50),
            power: 4.5
          }
        },
        shiftable: {
          dishwasher: {
            // Run during low price hours
            active: (!isHighPriceTime && hour >= 19 && hour <= 21) || 
              (this.currentTimeStep >= 76 && this.currentTimeStep <= 84),
            power: 1.8,
            progress: Math.min(3, Math.max(0, this.currentTimeStep - 76)),
            total_duration: 3
          },
          wash_machine: {
            // Run during solar peak hours
            active: isSolarActive && hour >= 11 && hour <= 14,
            power: 0.4,
            progress: Math.min(6, Math.max(0, this.currentTimeStep - 44)),
            total_duration: 6
          },
          clothes_dryer: {
            // Run after washing machine completes during solar hours
            active: isSolarActive && hour >= 14 && hour <= 16,
            power: 1.2,
            progress: Math.min(5, Math.max(0, this.currentTimeStep - 56)),
            total_duration: 5
          }
        },
        fixed: {
          tv: { 
            active: hour >= 18 && hour <= 23, 
            power: 0.1 
          },
          refrigerator: { 
            active: true, 
            power: 0.2 
          },
          lights: { 
            active: (hour >= 18 && hour <= 23) || (hour >= 6 && hour <= 8), 
            power: 0.2 
          },
          vacuum: { 
            active: hour === 10 && this.currentTimeStep % 8 < 2, 
            power: 1.2 
          },
          hair_dryer: { 
            active: hour === 7 && this.currentTimeStep % 4 === 1, 
            power: 1.0 
          }
        }
      };

      // Calculate total demand from AI decisions
      let totalDemand = 0;
      Object.values(aiAppliances.controllable).forEach(app => {
        if (app.active) totalDemand += app.power;
      });
      Object.values(aiAppliances.shiftable).forEach(app => {
        if (app.active) totalDemand += app.power;
      });
      Object.values(aiAppliances.fixed).forEach(app => {
        if (app.active) totalDemand += app.power;
      });

      // AI battery management
      const aiTargetBatteryLevel = isHighPriceTime ? 
        Math.max(20, this.batteryLevel - 3) : 
        Math.min(95, this.batteryLevel + (isSolarActive ? 5 : 1));

      const aiBatteryPower = isHighPriceTime && this.batteryLevel > 15 ? 
        -Math.min(2.4, totalDemand * 0.6) : 
        (isSolarActive && this.batteryLevel < 90 ? Math.min(2.4, currentHourData.solar * 0.7) : 0);

      // Update temperature models based on AI decisions
      const targetIndoorTemp = 22;
      if (aiAppliances.controllable.hvac.active) {
        const tempDiff = targetIndoorTemp - this.energyModelState.indoorTemperature;
        this.energyModelState.indoorTemperature += tempDiff * 0.7;
        // Clamp to reasonable bounds
        this.energyModelState.indoorTemperature = Math.max(18, 
          Math.min(28, this.energyModelState.indoorTemperature));
      } else {
        const tempDiff = currentHourData.temperature - this.energyModelState.indoorTemperature;
        this.energyModelState.indoorTemperature += tempDiff * 0.2;
        // Clamp to reasonable bounds
        this.energyModelState.indoorTemperature = Math.max(15, 
          Math.min(35, this.energyModelState.indoorTemperature));
      }

      if (aiAppliances.controllable.water_heater.active) {
        const tempDiff = 60 - this.energyModelState.waterTemperature;
        this.energyModelState.waterTemperature += tempDiff * 0.5;
        // Clamp to reasonable bounds
        this.energyModelState.waterTemperature = Math.max(45, 
          Math.min(65, this.energyModelState.waterTemperature));
      } else {
        this.energyModelState.waterTemperature = Math.max(45, 
          Math.min(65, this.energyModelState.waterTemperature - 1.0));
      }

      // EV charging optimization
      const evShouldCharge = this.energyModelState.evConnected && 
                           this.energyModelState.evSoC < 0.8 && 
                           (!isHighPriceTime || isSolarActive);

      if (evShouldCharge) {
        this.energyModelState.evSoC = Math.min(0.9, this.energyModelState.evSoC + 0.04);
      }

      // Create comprehensive RL prediction
      const mockPrediction = {
        timestamp: this.currentTimeStep,
        day: this.currentDay,
        environment: {
          price: currentHourData.price,
          solar_production: currentHourData.solar,
          outside_temp: currentHourData.temperature
        },
        temperatures: {
          home: {
            current: this.energyModelState.indoorTemperature,
            setpoint: 22
          },
          water: {
            current: this.energyModelState.waterTemperature,
            setpoint: 60
          }
        },
        battery: {
          soc: aiTargetBatteryLevel / 100,
          power: aiBatteryPower
        },
        ev: {
          soc: this.energyModelState.evSoC,
          power: evShouldCharge ? 6.0 : 0,
          connected: this.energyModelState.evConnected
        },
        appliances: aiAppliances,
        energy_flow: {
          grid: { 
            net_power: Math.max(0, totalDemand - currentHourData.solar + Math.max(0, aiBatteryPower))
          },
          house: { 
            demand: { total: totalDemand }
          }
        }
      };

      // Update local state with AI decisions
      this.updateFromAiPrediction(mockPrediction);
      
      // Update history data
      if (this.currentTimeStep < 96) {
        this.homeTemperatureHistory[this.currentTimeStep] = this.energyModelState.indoorTemperature;
        this.waterTemperatureHistory[this.currentTimeStep] = this.energyModelState.waterTemperature;
        
        // Update appliance power history
        this.appliancePowerHistory.dishwasher[this.currentTimeStep] = 
          aiAppliances.shiftable.dishwasher.active ? aiAppliances.shiftable.dishwasher.power : 0;
        this.appliancePowerHistory.wash_machine[this.currentTimeStep] = 
          aiAppliances.shiftable.wash_machine.active ? aiAppliances.shiftable.wash_machine.power : 0;
        this.appliancePowerHistory.clothes_dryer[this.currentTimeStep] = 
          aiAppliances.shiftable.clothes_dryer.active ? aiAppliances.shiftable.clothes_dryer.power : 0;
      }
      
      this.rlPrediction = mockPrediction;
    },

    updateFromAiPrediction(prediction) {
      if (!prediction) return;

      try {
        // Update energy values
        this.solarOutput = prediction.environment.solar_production;
        this.batteryLevel = prediction.battery.soc * 100;
        this.batteryPower = prediction.battery.power;
        this.gridPower = prediction.energy_flow.grid.net_power;
        this.houseDemand = prediction.energy_flow.house.demand.total;

        // Update battery status
        if (prediction.battery.power > 0.1) {
          this.batteryStatus = 'charging';
        } else if (prediction.battery.power < -0.1) {
          this.batteryStatus = 'discharging';
        } else {
          this.batteryStatus = 'empty';
        }

        // Update appliance states based on AI predictions
        this.appliances = this.appliances.map(app => {
          let isActive = app.active;
          let power = app.power;

          // Map AI decisions to appliances
          if (app.type === 'hvac' && prediction.appliances?.controllable?.hvac) {
            isActive = prediction.appliances.controllable.hvac.active;
            power = prediction.appliances.controllable.hvac.power;
          } else if (app.type === 'water_heater' && prediction.appliances?.controllable?.water_heater) {
            isActive = prediction.appliances.controllable.water_heater.active;
            power = prediction.appliances.controllable.water_heater.power;
          } else if (app.type === 'ev_charger') {
            isActive = prediction.ev.power > 0;
            power = prediction.ev.power;
          } else if (app.type === 'dishwasher' && prediction.appliances?.shiftable?.dishwasher) {
            isActive = prediction.appliances.shiftable.dishwasher.active;
            power = prediction.appliances.shiftable.dishwasher.power;
          } else if (app.type === 'wash_machine' && prediction.appliances?.shiftable?.wash_machine) {
            isActive = prediction.appliances.shiftable.wash_machine.active;
            power = prediction.appliances.shiftable.wash_machine.power;
          } else if (app.type === 'clothes_dryer' && prediction.appliances?.shiftable?.clothes_dryer) {
            isActive = prediction.appliances.shiftable.clothes_dryer.active;
            power = prediction.appliances.shiftable.clothes_dryer.power;
          } else if (app.type === 'tv' && prediction.appliances?.fixed?.tv) {
            isActive = prediction.appliances.fixed.tv.active;
            power = prediction.appliances.fixed.tv.power;
          } else if (app.type === 'refrigerator' && prediction.appliances?.fixed?.refrigerator) {
            isActive = prediction.appliances.fixed.refrigerator.active;
            power = prediction.appliances.fixed.refrigerator.power;
          } else if (app.type === 'lights' && prediction.appliances?.fixed?.lights) {
            isActive = prediction.appliances.fixed.lights.active;
            power = prediction.appliances.fixed.lights.power;
          } else if (app.type === 'vacuum' && prediction.appliances?.fixed?.vacuum) {
            isActive = prediction.appliances.fixed.vacuum.active;
            power = prediction.appliances.fixed.vacuum.power;
          } else if (app.type === 'hair_dryer' && prediction.appliances?.fixed?.hair_dryer) {
            isActive = prediction.appliances.fixed.hair_dryer.active;
            power = prediction.appliances.fixed.hair_dryer.power;
          }

          // Force update animation conditions for AI mode
          this.$nextTick(() => {
            // Ensure the EnergyFlowDiagram knows we're in AI mode with active simulation
            if (this.$refs.energyDiagram) {
              // Force reactivity update
              this.$refs.energyDiagram.$forceUpdate();
            }
          });

          return {
            ...app,
            active: isActive,
            power: power
          };
        });

      } catch (error) {
        console.error('Error updating from AI prediction:', error);
      }
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

/* Responsive Design */
@media (max-width: 1024px) {
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
  
  .rl-step-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .rl-btn {
    width: 100%;
  }
}
</style>