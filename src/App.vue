<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Smart Home Energy Simulator</h1>
      <div class="demo-badge">
        <span>Demo Mode</span>
      </div>
    </header>

    <div class="main-content">
      <!-- Control Panel -->
      <div class="control-panel">
        <div class="simulation-controls">
          <div class="control-group">
            <label for="simulation-hours">Simulation hours:</label>
            <input 
              id="simulation-hours" 
              type="number" 
              v-model.number="simulationHours" 
              min="0.1" 
              max="24"
              step="0.1"
              placeholder="Hours"
            />
            <span>hours</span>
          </div>

          <button 
            @click="loadConfiguration" 
            class="config-btn"
            :disabled="isLoading"
          >
            Load Configuration
          </button>

          <div class="simulation-buttons">
            <button 
              v-if="simulationState === 'idle'"
              @click="startSimulation"
              class="btn btn-start"
              :disabled="isLoading"
            >
              Start
            </button>

            <button 
              v-if="isRunning && simulationState !== 'idle'"
              @click="pauseSimulation"
              class="btn btn-pause"
            >
              Pause
            </button>

            <button 
              v-if="!isRunning && simulationState !== 'idle'"
              @click="resumeSimulation"
              class="btn btn-resume"
            >
              Resume
            </button>

            <button 
              v-if="simulationState !== 'idle'"
              @click="resetSimulation"
              class="btn btn-reset"
            >
              Reset
            </button>
          </div>

          <div class="speed-control">
            <label>Animation speed:</label>
            <select v-model="selectedSpeed" @change="onSpeedChange">
              <option value="1">Slow</option>
              <option value="2">Medium</option>
              <option value="3">Fast</option>
            </select>
          </div>
        </div>

        <!-- Time Display -->
        <div v-if="isRunning || simulationState !== 'idle'" class="time-display">
          <div class="time-info">
            <span class="time-label">Simulation Time:</span>
            <span class="time-value">{{ formattedSimulationTime }}</span>
            <span v-if="simulationDay > 1" class="day-info">Day {{ simulationDay }}</span>
          </div>
        </div>
      </div>

      <!-- Energy Flow Diagram Section -->
      <div class="energy-diagram-section">
        <div class="energy-flow-container">
          <h3>Energy Flow Diagram</h3>
          <div class="diagram-placeholder">
            <svg width="100%" height="300" viewBox="0 0 800 300">
              <!-- Solar Panel -->
              <g class="energy-component solar" :class="{ active: solarOutput > 0 }">
                <rect x="50" y="50" width="80" height="60" rx="5" class="component-bg"/>
                <text x="90" y="75" text-anchor="middle" class="component-label">Solar</text>
                <text x="90" y="90" text-anchor="middle" class="component-value">{{ solarOutput }} kW</text>
              </g>

              <!-- Battery -->
              <g class="energy-component battery" :class="{ active: batteryLevel > 0 }">
                <rect x="200" y="100" width="80" height="60" rx="5" class="component-bg"/>
                <text x="240" y="125" text-anchor="middle" class="component-label">Battery</text>
                <text x="240" y="140" text-anchor="middle" class="component-value">{{ batteryLevel }}%</text>
              </g>

              <!-- Grid -->
              <g class="energy-component grid" :class="{ active: gridPower !== 0 }">
                <rect x="350" y="50" width="80" height="60" rx="5" class="component-bg"/>
                <text x="390" y="75" text-anchor="middle" class="component-label">Grid</text>
                <text x="390" y="90" text-anchor="middle" class="component-value">{{ gridPower }} kW</text>
              </g>

              <!-- House -->
              <g class="energy-component house active">
                <rect x="500" y="150" width="100" height="80" rx="5" class="component-bg"/>
                <text x="550" y="185" text-anchor="middle" class="component-label">Home</text>
                <text x="550" y="200" text-anchor="middle" class="component-value">{{ houseDemand }} kW</text>
              </g>

              <!-- Energy Flow Lines -->
              <g v-if="isRunning">
                <!-- Solar to House -->
                <line v-if="solarOutput > 0" x1="130" y1="80" x2="500" y2="180" 
                      stroke="#f59e0b" stroke-width="3" class="flow-line"/>
                
                <!-- Battery to House -->
                <line v-if="batteryLevel > 20" x1="280" y1="130" x2="500" y2="180" 
                      stroke="#10b981" stroke-width="2" class="flow-line"/>
                
                <!-- Grid to House -->
                <line v-if="gridPower > 0" x1="430" y1="80" x2="500" y2="150" 
                      stroke="#8b5cf6" stroke-width="2" class="flow-line"/>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- Appliances and Environmental Data -->
      <div class="content-grid">
        <!-- Appliances Section -->
        <div class="appliances-section">
          <h3>Fixed Power Appliances (Run Full Duration)</h3>
          <div class="appliances-grid">
            <div 
              v-for="appliance in appliancesGroup1" 
              :key="appliance.id"
              class="appliance-card group-1"
              :class="{ active: appliance.active }"
              @click="toggleAppliance(appliance.id)"
            >
              <div class="appliance-icon">{{ appliance.icon }}</div>
              <div class="appliance-name">{{ appliance.name }}</div>
              <div class="appliance-power">{{ appliance.power }} kW</div>
              <div class="appliance-status" :class="appliance.active ? 'on' : 'off'">
                {{ appliance.active ? 'ON' : 'OFF' }}
              </div>
            </div>
          </div>

          <h3>Variable Power Appliances</h3>
          <div class="appliances-grid">
            <div 
              v-for="appliance in appliancesGroup2" 
              :key="appliance.id"
              class="appliance-card group-2"
              :class="{ active: appliance.active }"
              @click="toggleAppliance(appliance.id)"
            >
              <div class="appliance-icon">{{ appliance.icon }}</div>
              <div class="appliance-name">{{ appliance.name }}</div>
              <div class="appliance-power">{{ appliance.power }} kW</div>
              <div class="appliance-status" :class="appliance.active ? 'on' : 'off'">
                {{ appliance.active ? 'ON' : 'OFF' }}
              </div>
            </div>
          </div>

          <h3>Fixed Power Appliances (Toggle Anytime)</h3>
          <div class="appliances-grid">
            <div 
              v-for="appliance in appliancesGroup3" 
              :key="appliance.id"
              class="appliance-card group-3"
              :class="{ active: appliance.active }"
              @click="toggleAppliance(appliance.id)"
            >
              <div class="appliance-icon">{{ appliance.icon }}</div>
              <div class="appliance-name">{{ appliance.name }}</div>
              <div class="appliance-power">{{ appliance.power }} kW</div>
              <div class="appliance-status" :class="appliance.active ? 'on' : 'off'">
                {{ appliance.active ? 'ON' : 'OFF' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Environmental Data Section -->
        <div class="environmental-section">
          <h3>Environmental Data</h3>
          
          <!-- Solar & Battery Chart -->
          <div class="chart-container">
            <h4>Solar & Battery (kW)</h4>
            <div class="chart-placeholder">
              <canvas ref="solarChart" width="400" height="200"></canvas>
            </div>
            <div class="current-value">Current: {{ solarOutput }} kW</div>
          </div>

          <!-- Electricity Price Chart -->
          <div class="chart-container">
            <h4>Electricity Price ($/kWh)</h4>
            <div class="chart-placeholder">
              <canvas ref="priceChart" width="400" height="200"></canvas>
            </div>
            <div class="current-value">Current: ${{ currentPrice }}/kWh</div>
          </div>

          <!-- Temperature Chart -->
          <div class="chart-container">
            <h4>Temperature (°C)</h4>
            <div class="chart-placeholder">
              <canvas ref="tempChart" width="400" height="200"></canvas>
            </div>
            <div class="current-value">Current: {{ currentTemperature }}°C</div>
          </div>
        </div>
      </div>

      <!-- Energy Statistics -->
      <div class="energy-stats">
        <div class="stat-card solar">
          <div class="stat-title">Solar Production</div>
          <div class="stat-value">{{ solarOutput }} kW</div>
        </div>
        <div class="stat-card battery">
          <div class="stat-title">Battery Level</div>
          <div class="stat-value">{{ batteryLevel }}%</div>
        </div>
        <div class="stat-card grid">
          <div class="stat-title">Grid Usage</div>
          <div class="stat-value">{{ gridPower }} kW</div>
        </div>
        <div class="stat-card home">
          <div class="stat-title">Home Demand</div>
          <div class="stat-value">{{ houseDemand }} kW</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SmartHomeEnergySimulator',
  
  data() {
    return {
      isLoading: false,
      simulationHours: 1,
      selectedSpeed: 2,
      
      // Simulation state
      simulationState: 'idle', // 'idle', 'running', 'paused'
      isRunning: false,
      simulationTimer: null,
      simulationElapsedTime: 0,
      simulationDay: 1,
      
      // Energy data
      solarOutput: 0,
      batteryLevel: 35,
      gridPower: 0,
      houseDemand: 0,
      currentPrice: 0.025,
      currentTemperature: 20,
      
      // Demo appliances data
      appliances: [
        // Group 1: Fixed power, must run for full duration
        { id: 1, name: 'Dishwasher', icon: '🍽️', power: 1.8, active: false, group: 1 },
        { id: 2, name: 'Wash Machine', icon: '👕', power: 0.4, active: false, group: 1 },
        { id: 3, name: 'Clothes Dryer', icon: '🌀', power: 1.2, active: false, group: 1 },
        
        // Group 2: Variable power, can be toggled during allowed time
        { id: 4, name: 'HVAC', icon: '❄️', power: 2.5, active: false, group: 2 },
        { id: 5, name: 'Water Heater', icon: '🚿', power: 4.5, active: false, group: 2 },
        { id: 6, name: 'EV Charger', icon: '🔌', power: 6.0, active: false, group: 2 },
        
        // Group 3: Fixed power, on for entire duration
        { id: 7, name: 'TV', icon: '📺', power: 0.1, active: false, group: 3 },
        { id: 8, name: 'Refrigerator', icon: '🧊', power: 0.2, active: true, group: 3 },
        { id: 9, name: 'Lights', icon: '💡', power: 0.2, active: false, group: 3 },
        { id: 10, name: 'Vacuum Cleaner', icon: '🧹', power: 1.2, active: false, group: 3 },
        { id: 11, name: 'Hair Dryer', icon: '💨', power: 1.0, active: false, group: 3 }
      ],
      
      // Chart data
      chartData: {
        solar: [],
        price: [],
        temperature: []
      }
    };
  },
  
  computed: {
    formattedSimulationTime() {
      const hours = Math.floor(this.simulationElapsedTime / 60);
      const minutes = Math.floor(this.simulationElapsedTime % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    },
    
    appliancesGroup1() {
      return this.appliances.filter(a => a.group === 1);
    },
    
    appliancesGroup2() {
      return this.appliances.filter(a => a.group === 2);
    },
    
    appliancesGroup3() {
      return this.appliances.filter(a => a.group === 3);
    }
  },
  
  methods: {
    loadConfiguration() {
      this.isLoading = true;
      // Simulate loading configuration
      setTimeout(() => {
        this.isLoading = false;
        console.log('Configuration loaded (demo mode)');
      }, 1000);
    },
    
    startSimulation() {
      this.simulationState = 'running';
      this.isRunning = true;
      this.simulationElapsedTime = 0;
      
      // Start simulation timer
      this.simulationTimer = setInterval(() => {
        this.updateSimulation();
      }, 1000);
      
      console.log('Simulation started');
    },
    
    pauseSimulation() {
      this.isRunning = false;
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
      console.log('Simulation paused');
    },
    
    resumeSimulation() {
      this.isRunning = true;
      this.simulationTimer = setInterval(() => {
        this.updateSimulation();
      }, 1000);
      console.log('Simulation resumed');
    },
    
    resetSimulation() {
      this.simulationState = 'idle';
      this.isRunning = false;
      this.simulationElapsedTime = 0;
      this.simulationDay = 1;
      
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
      
      // Reset all appliances
      this.appliances.forEach(app => {
        if (app.id !== 8) { // Keep refrigerator on
          app.active = false;
        }
      });
      
      // Reset energy values
      this.solarOutput = 0;
      this.batteryLevel = 35;
      this.gridPower = 0;
      this.updateHouseDemand();
      
      console.log('Simulation reset');
    },
    
    updateSimulation() {
      // Increment elapsed time based on speed
      this.simulationElapsedTime += this.selectedSpeed;
      
      // Update day counter
      this.simulationDay = Math.floor(this.simulationElapsedTime / (24 * 60)) + 1;
      
      // Simulate solar output based on time of day
      const timeOfDay = (this.simulationElapsedTime % (24 * 60)) / (24 * 60);
      this.updateSolarOutput(timeOfDay);
      
      // Simulate price fluctuations
      this.updateElectricityPrice(timeOfDay);
      
      // Simulate temperature changes
      this.updateTemperature(timeOfDay);
      
      // Update battery and grid based on energy balance
      this.updateEnergyBalance();
      
      // Auto-toggle some appliances based on time
      this.autoToggleAppliances(timeOfDay);
    },
    
    updateSolarOutput(timeOfDay) {
      // Solar production follows a bell curve during daylight hours
      if (timeOfDay >= 0.25 && timeOfDay <= 0.75) { // 6 AM to 6 PM
        const solarTime = (timeOfDay - 0.25) * 2; // Normalize to 0-1
        const efficiency = Math.sin(solarTime * Math.PI);
        this.solarOutput = parseFloat((5 * efficiency * (0.8 + Math.random() * 0.4)).toFixed(1));
      } else {
        this.solarOutput = 0;
      }
    },
    
    updateElectricityPrice(timeOfDay) {
      // Peak pricing during evening hours
      const hour = timeOfDay * 24;
      if (hour >= 16 && hour <= 20) {
        this.currentPrice = 0.045 + Math.random() * 0.01;
      } else if (hour >= 0 && hour <= 6) {
        this.currentPrice = 0.015 + Math.random() * 0.005;
      } else {
        this.currentPrice = 0.025 + Math.random() * 0.008;
      }
      this.currentPrice = parseFloat(this.currentPrice.toFixed(3));
    },
    
    updateTemperature(timeOfDay) {
      // Temperature varies throughout the day
      const hour = timeOfDay * 24;
      const baseTemp = 20 + 8 * Math.sin((hour - 6) / 24 * 2 * Math.PI);
      this.currentTemperature = parseFloat((baseTemp + Math.random() * 2 - 1).toFixed(1));
    },
    
    updateEnergyBalance() {
      const solarToHouse = Math.min(this.solarOutput, this.houseDemand);
      const remainingDemand = Math.max(0, this.houseDemand - solarToHouse);
      const excessSolar = Math.max(0, this.solarOutput - solarToHouse);
      
      // Battery logic
      if (excessSolar > 0 && this.batteryLevel < 100) {
        // Charge battery with excess solar
        const chargeRate = Math.min(excessSolar, 2.4); // Max charge rate
        this.batteryLevel = Math.min(100, this.batteryLevel + chargeRate * 0.1);
      } else if (remainingDemand > 0 && this.batteryLevel > 10) {
        // Discharge battery to meet demand
        const dischargeRate = Math.min(remainingDemand, 2.4);
        this.batteryLevel = Math.max(10, this.batteryLevel - dischargeRate * 0.1);
        this.gridPower = Math.max(0, remainingDemand - dischargeRate);
      } else {
        this.gridPower = remainingDemand;
      }
      
      // Export excess solar to grid
      if (excessSolar > 0 && this.batteryLevel >= 99) {
        this.gridPower = -excessSolar; // Negative indicates export
      }
      
      this.batteryLevel = parseFloat(this.batteryLevel.toFixed(1));
      this.gridPower = parseFloat(this.gridPower.toFixed(1));
    },
    
    autoToggleAppliances(timeOfDay) {
      const hour = timeOfDay * 24;
      
      // Auto-start dishwasher in evening
      if (hour >= 18 && hour < 18.1 && !this.appliances[0].active) {
        this.toggleAppliance(1);
      }
      
      // Auto-start HVAC when temperature is extreme
      const hvac = this.appliances.find(a => a.id === 4);
      if ((this.currentTemperature > 25 || this.currentTemperature < 18) && !hvac.active) {
        this.toggleAppliance(4);
      } else if (this.currentTemperature >= 18 && this.currentTemperature <= 25 && hvac.active) {
        this.toggleAppliance(4);
      }
      
      // Turn on lights in evening
      if (hour >= 18 && hour < 18.1 && !this.appliances[8].active) {
        this.toggleAppliance(9);
      }
      
      // Turn off lights in morning
      if (hour >= 7 && hour < 7.1 && this.appliances[8].active) {
        this.toggleAppliance(9);
      }
    },
    
    toggleAppliance(id) {
      const appliance = this.appliances.find(a => a.id === id);
      if (appliance) {
        appliance.active = !appliance.active;
        this.updateHouseDemand();
        console.log(`${appliance.name} ${appliance.active ? 'ON' : 'OFF'}`);
      }
    },
    
    updateHouseDemand() {
      this.houseDemand = parseFloat(
        this.appliances
          .filter(app => app.active)
          .reduce((sum, app) => sum + app.power, 0)
          .toFixed(1)
      );
    },
    
    onSpeedChange() {
      console.log(`Animation speed changed to: ${this.selectedSpeed}`);
    }
  },
  
  mounted() {
    console.log('Smart Home Energy Simulator Demo initialized');
    this.updateHouseDemand();
  },
  
  beforeUnmount() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
    }
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header h1 {
  margin: 0;
  color: #2d3748;
  font-size: 2rem;
  font-weight: 700;
}

.demo-badge {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(255,107,107,0.3);
}

.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.control-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.simulation-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-group input {
  width: 80px;
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.simulation-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-start {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
}

.btn-pause {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  color: white;
}

.btn-resume {
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  color: white;
}

.btn-reset {
  background: linear-gradient(45deg, #6b7280, #4b5563);
  color: white;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.config-btn {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.speed-control select {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.time-display {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(45deg, #f8fafc, #e2e8f0);
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-label {
  font-weight: 600;
  color: #4b5563;
}

.time-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.day-info {
  background: #3b82f6;
  color: white;
  padding: 0.2rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.energy-diagram-section {
  margin-bottom: 2rem;
}

.energy-flow-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.energy-flow-container h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.3rem;
}

.diagram-placeholder {
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

.energy-component {
  cursor: pointer;
  transition: all 0.3s ease;
}

.component-bg {
  fill: #f1f5f9;
  stroke: #cbd5e1;
  stroke-width: 2;
  transition: all 0.3s ease;
}

.energy-component.active .component-bg {
  fill: #dbeafe;
  stroke: #3b82f6;
}

.energy-component.solar.active .component-bg {
  fill: #fef3c7;
  stroke: #f59e0b;
}

.energy-component.battery.active .component-bg {
  fill: #d1fae5;
  stroke: #10b981;
}

.energy-component.grid.active .component-bg {
  fill: #f3e8ff;
  stroke: #8b5cf6;
}

.component-label {
  font-size: 12px;
  font-weight: 600;
  fill: #4b5563;
}

.component-value {
  font-size: 11px;
  font-weight: 700;
  fill: #1f2937;
}

.flow-line {
  stroke-dasharray: 5,5;
  animation: flow 2s linear infinite;
}

@keyframes flow {
  0% { stroke-dashoffset: 10; }
  100% { stroke-dashoffset: 0; }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.appliances-section,
.environmental-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.appliances-section h3,
.environmental-section h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.appliances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.appliance-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.appliance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.appliance-card.group-1 {
  border-left: 4px solid #f43f5e;
}

.appliance-card.group-2 {
  border-left: 4px solid #10b981;
}

.appliance-card.group-3 {
  border-left: 4px solid #3b82f6;
}

.appliance-card.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
}

.appliance-card.group-1.active {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-color: #f43f5e;
}

.appliance-card.group-2.active {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-color: #10b981;
}

.appliance-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.appliance-name {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
}

.appliance-power {
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.appliance-status {
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.appliance-status.on {
  background: #dcfce7;
  color: #166534;
}

.appliance-status.off {
  background: #fee2e2;
  color: #991b1b;
}

.chart-container {
  margin-bottom: 1.5rem;
  position: relative;
}

.chart-container h4 {
  margin: 0 0 0.8rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.chart-placeholder {
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-style: italic;
}

.chart-placeholder canvas {
  width: 100% !important;
  height: 100% !important;
}

.current-value {
  position: absolute;
  top: 8px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.energy-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border-left: 4px solid;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.solar {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.stat-card.battery {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}

.stat-card.grid {
  border-left-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff, #e7d3ff);
}

.stat-card.home {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.stat-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .simulation-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .time-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .app-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .appliances-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .energy-stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .simulation-buttons {
    flex-wrap: wrap;
  }
  
  .btn {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .appliances-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .energy-stats {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 1.4rem;
  }
}

/* Animation for active components */
.energy-component.active {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Loading states */
.btn:disabled {
  background: #e5e7eb !important;
  color: #9ca3af !important;
  cursor: not-allowed;
}

.config-btn:disabled {
  background: #e5e7eb !important;
  color: #9ca3af !important;
}

/* Focus states for accessibility */
.btn:focus,
.config-btn:focus,
.appliance-card:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .control-panel,
  .simulation-buttons {
    display: none;
  }
  
  .energy-stats {
    break-inside: avoid;
  }
}

/* Dark mode support (if needed later) */
@media (prefers-color-scheme: dark) {
  .app-container {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: #f9fafb;
  }
  
  .app-header,
  .control-panel,
  .energy-flow-container,
  .appliances-section,
  .environmental-section,
  .stat-card {
    background: #374151;
    color: #f9fafb;
  }
  
  .appliance-card {
    background: #4b5563;
  }
  
  .chart-placeholder {
    background: #4b5563;
    border-color: #6b7280;
  }
}