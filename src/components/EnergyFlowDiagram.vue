<template>
  <div class="energy-flow-container">
    <!-- Controls Section -->
    <div class="controls">
      <div class="config-controls">
        <div class="simulation-time-input">
          <label>Simulation hours:</label>
          <input type="number" v-model.number="simulationHours" min="0.1" step="0.1" />
          <span>hours</span>
        </div>
      </div>
      
      <div class="control-buttons">
        <button v-if="simulationState === 'idle'" @click="$emit('start-simulation')" class="start-btn">
          ▶️ Start
        </button>
        <button v-if="isRunning && simulationState !== 'idle'" @click="$emit('pause-simulation')" class="pause-btn">
          ⏸️ Pause
        </button>
        <button v-if="!isRunning && simulationState !== 'idle'" @click="$emit('resume-simulation')" class="resume-btn">
          ▶️ Resume
        </button>
        <button v-if="simulationState !== 'idle'" @click="$emit('reset-simulation')" class="reset-btn">
          🔄 Reset
        </button>
        
        <div class="speed-control">
          <span>Animation speed:</span>
          <select v-model="selectedSpeed" @change="onSpeedChange">
            <option value="1">Slow</option>
            <option value="2">Medium</option>
            <option value="3">Fast</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Time Display -->
    <div class="simulation-time-display" v-if="isRunning || simulationState !== 'idle'">
      <div class="time-icon">🕒</div>
      <div class="time-value">{{ simulationFormattedTime }}</div>
      <div class="time-day" v-if="simulationDay > 1">Day {{ simulationDay }}</div>
    </div>
    
    <!-- Energy Flow Diagram -->
    <div class="diagram">
      <svg width="100%" height="400" viewBox="0 0 1000 400">
        <!-- Background -->
        <rect width="100%" height="100%" fill="#f8fafc" />
        
        <!-- Solar Panel -->
        <g class="device-icon" :class="{ active: solarOutput > 0 }">
          <rect x="50" y="50" width="100" height="80" rx="10" :fill="solarOutput > 0 ? '#fef3c7' : '#f3f4f6'" 
                stroke="#f59e0b" :stroke-width="solarOutput > 0 ? 3 : 2"/>
          <text x="100" y="75" text-anchor="middle" class="device-label">☀️ Solar</text>
          <text x="100" y="95" text-anchor="middle" class="device-value">{{ solarOutput.toFixed(1) }} kW</text>
        </g>

        <!-- Battery -->
        <g class="device-icon" :class="{ active: batteryLevel > 10 }">
          <rect x="300" y="100" width="100" height="80" rx="10" :fill="batteryLevel > 10 ? '#d1fae5' : '#f3f4f6'" 
                stroke="#10b981" :stroke-width="batteryLevel > 10 ? 3 : 2"/>
          <text x="350" y="125" text-anchor="middle" class="device-label">🔋 Battery</text>
          <text x="350" y="145" text-anchor="middle" class="device-value">{{ batteryLevel.toFixed(1) }}%</text>
          <text x="350" y="160" text-anchor="middle" class="device-status" :fill="getBatteryStatusColor()">
            {{ batteryStatus.toUpperCase() }}
          </text>
        </g>

        <!-- Grid -->
        <g class="device-icon" :class="{ active: Math.abs(gridPower) > 0 }">
          <rect x="650" y="50" width="100" height="80" rx="10" :fill="Math.abs(gridPower) > 0 ? '#e7d3ff' : '#f3f4f6'" 
                stroke="#8b5cf6" :stroke-width="Math.abs(gridPower) > 0 ? 3 : 2"/>
          <text x="700" y="75" text-anchor="middle" class="device-label">⚡ Grid</text>
          <text x="700" y="95" text-anchor="middle" class="device-value">{{ gridPower.toFixed(1) }} kW</text>
        </g>

        <!-- House -->
        <g class="device-icon active">
          <rect x="425" y="250" width="150" height="100" rx="10" fill="#dbeafe" 
                stroke="#3b82f6" stroke-width="3"/>
          <text x="500" y="285" text-anchor="middle" class="device-label">🏠 Home</text>
          <text x="500" y="305" text-anchor="middle" class="device-value">{{ houseDemand.toFixed(1) }} kW</text>
        </g>
        
        <!-- Energy Flow Lines with Animation -->
        <g v-if="isRunning">
          <!-- Solar to House -->
          <line v-if="solarOutput > 0 && houseDemand > 0" 
                x1="150" y1="90" x2="450" y2="280" 
                stroke="#f59e0b" stroke-width="4" class="flow-line">
            <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="2s" repeatCount="indefinite"/>
          </line>
          
          <!-- Battery to House -->
          <line v-if="batteryStatus === 'discharging'" 
                x1="400" y1="140" x2="470" y2="250" 
                stroke="#10b981" stroke-width="3" class="flow-line">
            <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1.5s" repeatCount="indefinite"/>
          </line>
          
          <!-- Solar to Battery -->
          <line v-if="batteryStatus === 'charging' && solarOutput > houseDemand" 
                x1="150" y1="100" x2="300" y2="130" 
                stroke="#f59e0b" stroke-width="2" class="flow-line">
            <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="1.2s" repeatCount="indefinite"/>
          </line>
          
          <!-- Grid to House -->
          <line v-if="gridPower > 0" 
                x1="650" y1="90" x2="550" y2="250" 
                stroke="#8b5cf6" stroke-width="3" class="flow-line">
            <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1.8s" repeatCount="indefinite"/>
          </line>

          <!-- Grid to Battery -->
          <line v-if="batteryStatus === 'charging' && solarOutput < batteryPower" 
                x1="650" y1="110" x2="400" y2="120" 
                stroke="#8b5cf6" stroke-width="2" class="flow-line">
            <animate attributeName="stroke-dasharray" values="0,12;12,0" dur="1.6s" repeatCount="indefinite"/>
          </line>
        </g>
      </svg>
    </div>
    
    <!-- Appliances Section -->
    <div class="appliances-and-charts">
      <div class="appliances-column">
        <!-- Group 1: Fixed Power Appliances -->
        <div class="appliance-group">
          <div class="appliance-group-header group-1">🔧 Fixed Power Appliances (Run Full Duration)</div>
          <div class="appliances-group">
            <div v-for="app in appliancesGroup1" :key="app.id"
                 class="appliance-card group-1"
                 :class="{ active: app.active, pulse: isRunning && app.active }"
                 @click="toggleAppliance(app.id)">
              <div class="appliance-icon">{{ getApplianceIcon(app.type) }}</div>
              <div class="appliance-name">{{ app.name }}</div>
              <div class="appliance-power" :class="{ active: app.active }">{{ parseFloat(app.power).toFixed(1) }} kW</div>
              <div class="appliance-status" :class="app.active ? 'on' : 'off'">
                {{ app.active ? 'ON' : 'OFF' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Group 2: Variable Power Appliances -->
        <div class="appliance-group">
          <div class="appliance-group-header group-2">⚙️ Variable Power Appliances</div>
          <div class="appliances-group">
            <div v-for="app in appliancesGroup2" :key="app.id"
                 class="appliance-card group-2"
                 :class="{ active: app.active, pulse: isRunning && app.active }"
                 @click="toggleAppliance(app.id)">
              <div class="appliance-icon">{{ getApplianceIcon(app.type) }}</div>
              <div class="appliance-name">{{ app.name }}</div>
              <div class="appliance-power" :class="{ active: app.active }">{{ parseFloat(app.power).toFixed(1) }} kW</div>
              <div class="appliance-status" :class="app.active ? 'on' : 'off'">
                {{ app.active ? 'ON' : 'OFF' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Group 3: Fixed Power Appliances -->
        <div class="appliance-group">
          <div class="appliance-group-header group-3">🎛️ Fixed Power Appliances (Toggle Anytime)</div>
          <div class="appliances-group">
            <div v-for="app in appliancesGroup3" :key="app.id"
                 class="appliance-card group-3"
                 :class="{ active: app.active, pulse: isRunning && app.active }"
                 @click="toggleAppliance(app.id)">
              <div class="appliance-icon">{{ getApplianceIcon(app.type) }}</div>
              <div class="appliance-name">{{ app.name }}</div>
              <div class="appliance-power" :class="{ active: app.active }">{{ parseFloat(app.power).toFixed(1) }} kW</div>
              <div class="appliance-status" :class="app.active ? 'on' : 'off'">
                {{ app.active ? 'ON' : 'OFF' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Column -->
      <div class="charts-column">
        <div class="environmental-charts">
          <h3>Environmental Data</h3>
          
          <!-- Simple Charts Placeholder -->
          <div class="chart-container">
            <h4>Solar & Battery (kW)</h4>
            <div class="simple-chart">
              <div class="chart-item">
                <div class="chart-bar" :style="{ height: solarBarHeight, backgroundColor: solarBarColor }"></div>
                <div class="chart-label">Solar</div>
              </div>
              <div class="chart-item">
                <div class="chart-bar" :style="{ height: batteryBarHeight, backgroundColor: batteryBarColor }"></div>
                <div class="chart-label">Battery</div>
              </div>
            </div>
            <div class="current-value">Solar: {{ solarOutput }}kW | Battery: {{ batteryLevel.toFixed(0) }}%</div>
          </div>

          <div class="chart-container">
            <h4>Temperature (°C)</h4>
            <div class="temp-chart">
              <div class="temp-chart-item">
                <div class="temp-bar-container">
                  <div class="temp-target-line" style="bottom: 60%"></div>
                  <div class="temp-bar" :style="{ height: ((indoorTemp - 15) / 20 * 100) + '%', backgroundColor: '#3b82f6' }"></div>
                </div>
                <div class="temp-label">🏠 Indoor</div>
                <div class="temp-value">{{ indoorTemp.toFixed(1) }}°C</div>
              </div>
              <div class="temp-chart-item">
                <div class="temp-bar-container">
                  <div class="temp-target-line" style="bottom: 75%"></div>
                  <div class="temp-bar" :style="{ height: ((waterTemp - 40) / 30 * 100) + '%', backgroundColor: '#f59e0b' }"></div>
                </div>
                <div class="temp-label">💧 Water</div>
                <div class="temp-value">{{ waterTemp.toFixed(1) }}°C</div>
              </div>
            </div>
            <div class="temp-targets">
              <span>🏠 Target: 22°C</span>
              <span>💧 Target: 60°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Energy Stats -->
    <div class="energy-stats">
      <div class="stat-card solar">
        <div class="stat-title">☀️ Solar Production</div>
        <div class="stat-value">{{ solarOutput.toFixed(1) }} kW</div>
      </div>
      <div class="stat-card battery">
        <div class="stat-title">🔋 Battery Level</div>
        <div class="stat-value">{{ batteryLevel.toFixed(1) }}%</div>
      </div>
      <div class="stat-card grid">
        <div class="stat-title">⚡ Grid Usage</div>
        <div class="stat-value">{{ gridPower.toFixed(1) }} kW</div>
      </div>
      <div class="stat-card home">
        <div class="stat-title">🏠 Home Demand</div>
        <div class="stat-value">{{ houseDemand.toFixed(1) }} kW</div>
      </div>
    </div>

    <!-- AI Insights -->
    <div class="rl-insights" v-if="rlPrediction">
      <h3>AI Energy Optimizer</h3>
      
      <div class="rl-stats">
        <div class="rl-stat-card">
          <div class="rl-stat-title">Current Time</div>
          <div class="rl-stat-value">Day {{ safeGet(rlPrediction, 'day', 1) }}, {{ formatTime(safeGet(rlPrediction, 'timestamp', 0)) }}</div>
        </div>
        <div class="rl-stat-card">
          <div class="rl-stat-title">Grid Price</div>
          <div class="rl-stat-value">${{ safeGet(rlPrediction, 'environment.price', 0.025).toFixed(3) }}/kWh</div>
        </div>
        <div class="rl-stat-card">
          <div class="rl-stat-title">Total Demand</div>
          <div class="rl-stat-value">{{ safeGet(rlPrediction, 'energy_flow.house.demand.total', 0).toFixed(1) }} kW</div>
        </div>
        <div class="rl-stat-card">
          <div class="rl-stat-title">Grid Import/Export</div>
          <div class="rl-stat-value">{{ Math.abs(safeGet(rlPrediction, 'energy_flow.grid.net_power', 0)).toFixed(1) }} kW {{ safeGet(rlPrediction, 'energy_flow.grid.net_power', 0) < 0 ? 'Export' : 'Import' }}</div>
        </div>
      </div>

      <!-- Temperature displays -->
      <div class="rl-temperatures">
        <div class="rl-temp-card">
          <div class="rl-temp-title">🏠 Home Temperature</div>
          <div class="rl-temp-display">
            <span>Current: {{ safeGet(rlPrediction, 'temperatures.home.current', 22).toFixed(1) }}°C</span>
            <span>Target: {{ safeGet(rlPrediction, 'temperatures.home.setpoint', 22) }}°C</span>
          </div>
        </div>
        <div class="rl-temp-card">
          <div class="rl-temp-title">💧 Water Temperature</div>
          <div class="rl-temp-display">
            <span>Current: {{ safeGet(rlPrediction, 'temperatures.water.current', 60).toFixed(1) }}°C</span>
            <span>Target: {{ safeGet(rlPrediction, 'temperatures.water.setpoint', 60) }}°C</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    solarOutput: { type: Number, default: 0 },
    batteryLevel: { type: Number, default: 35 },
    batteryStatus: { type: String, default: 'empty' },
    batteryPower: { type: Number, default: 0 },
    gridPower: { type: Number, default: 0 },
    houseDemand: { type: Number, default: 0 },
    appliances: { type: Array, default: () => [] },
    isRunning: { type: Boolean, default: false },
    simulationState: { type: String, default: 'idle' },
    rlPrediction: { type: Object, default: null },
    simulationFormattedTime: { type: String, default: "00:00" },
    simulationDay: { type: Number, default: 1 },
    indoorTemperature: { type: Number, default: 22 },
    waterTemperature: { type: Number, default: 55 },
    energyModels: { type: Object, default: () => ({}) }
  },

  data() {
    return {
      simulationHours: 1,
      selectedSpeed: 2,
      indoorTemp: 22,
      waterTemp: 55
    };
  },

  computed: {
    appliancesGroup1() {
      return this.appliances.filter(a => a.group === 1);
    },
    appliancesGroup2() {
      return this.appliances.filter(a => a.group === 2);
    },
    appliancesGroup3() {
      return this.appliances.filter(a => a.group === 3);
    },

    solarBarHeight() {
      return (this.solarOutput / 5 * 100) + '%';
    },
    batteryBarHeight() {
      return this.batteryLevel + '%';
    },
    solarBarColor() {
      return this.solarOutput > 0 ? '#f59e0b' : '#e5e7eb';
    },
    batteryBarColor() {
      return this.batteryLevel > 50 ? '#10b981' : this.batteryLevel > 20 ? '#f59e0b' : '#ef4444';
    }
  },

  watch: {
    // Watch for energy model updates from parent
    '$props': {
      handler() {
        // Update temperatures if available in RL prediction
        if (this.rlPrediction) {
          this.indoorTemp = this.safeGet(this.rlPrediction, 'temperatures.home.current', this.indoorTemp);
          this.waterTemp = this.safeGet(this.rlPrediction, 'temperatures.water.current', this.waterTemp);
        }
      },
      deep: true
    },

    '$parent.energyModelState': {
      handler(newModels) {
        if (newModels) {
          this.indoorTemp = newModels.indoorTemperature?.toFixed(1) || this.indoorTemp;
          this.waterTemp = newModels.waterTemperature?.toFixed(1) || this.waterTemp;
          this.currentHomeTemp = this.indoorTemp;
          this.currentWaterTemp = this.waterTemp;
        }
      },
      deep: true
    }
  },

  mounted() {
    // Mock socket connection for compatibility
    if (typeof window.io === 'function') {
      this.socket = window.io();
    }
  },

  methods: {
    getApplianceIcon(type) {
      const icons = {
        hvac: '🌡️',
        refrigerator: '🗄',
        lights: '💡',
        ev_charger: '🚗',
        dishwasher: '🧽',
        water_heater: '🔥',
        wash_machine: '🫧👕',
        clothes_dryer: '☀️',
        tv: '📺',
        vacuum: '🧹🪣',
        hair_dryer: '༄'
      };
      return icons[type] || '⚡';
    },

    getBatteryStatusColor() {
      if (this.batteryStatus === 'charging') return '#10b981';
      if (this.batteryStatus === 'discharging') return '#ef4444';
      return '#6b7280';
    },

    toggleAppliance(id) {
      this.$emit('toggle-appliance', id);
    },

    onSpeedChange() {
      this.$emit('speed-changed', { 
        animationSpeed: this.selectedSpeed,
        interval: 1000 / this.selectedSpeed
      });
    },

    formatTime(step) {
      const totalMinutes = step * 15;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    },

    safeGet(obj, path, defaultValue = null) {
      try {
        return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : defaultValue, obj);
      } catch (e) {
        return defaultValue;
      }
    }
  }
};
</script>

<style scoped>

.energy-flow-container {
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.flow-line {
  stroke-dasharray: 10, 5;
  animation: flow 2s linear infinite;
}

@keyframes flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: 15; }
}

.chart-container {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  height: 200px;
  margin-bottom: 15px;
}

.device-icon {
  transform: none !important;
}

.simple-chart {
  display: flex;
  gap: 20px;
  height: 120px;
  align-items: end;
  padding: 20px;
  justify-content: center;
}

.chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.chart-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
}

.temp-chart {
  display: flex;
  gap: 30px;
  height: 120px;
  align-items: end;
  padding: 20px;
  justify-content: center;
}

.chart-bar {
  width: 30px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 5px;
}

.temp-chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.temp-bar-container {
  position: relative;
  width: 30px;
  height: 100px;
  background: #f1f5f9;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.temp-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  border-radius: 0 0 3px 3px;
  transition: height 0.3s ease;
  min-height: 5px;
}

.temp-target-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: #ef4444;
  left: 0;
  border-radius: 1px;
}

.temp-target-line::before {
  content: 'Target';
  position: absolute;
  right: -45px;
  top: -8px;
  font-size: 10px;
  color: #ef4444;
  font-weight: 500;
}

.temp-targets {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
}

.temp-display {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.temp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 6px;
}

.temp-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
}

.temp-value {
  font-size: 13px;
  font-weight: bold;
  color: #1f2937;
  text-align: center;
}

.appliances-and-charts {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.appliances-column {
  flex: 1;
  min-width: 0;
}

.charts-column {
  flex: 0 0 300px;
  min-width: 300px;
}

.appliance-group {
  margin-bottom: 20px;
}

.appliance-group-header {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 10px;
  font-weight: bold;
  border-radius: 6px;
}

.appliance-group-header.group-1 {
  background: #fecdd3;
  color: #be123c;
}

.appliance-group-header.group-2 {
  background: #d1fae5;
  color: #047857;
}

.appliance-group-header.group-3 {
  background: #dbeafe;
  color: #1d4ed8;
}

.appliances-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
}

.appliance-card {
  flex: 1;
  min-width: 150px;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
}

.appliance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.appliance-card.group-1 {
  background: #fef3f2;
  border-left: 3px solid #f43f5e;
}

.appliance-card.group-2 {
  background: #f0fdf4;
  border-left: 3px solid #10b981;
}

.appliance-card.group-3 {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.appliance-name {
  font-weight: bold;
  margin-bottom: 4px;
  text-align: center;
}

.appliance-power {
  color: #9ca3af;
  font-size: 14px;
  font-weight: bold;
}

.appliance-power.active {
  color: #3b82f6;
}

.appliance-status {
  font-size: 12px;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 4px;
}

.appliance-status.on {
  background: #d1fae5;
  color: #047857;
}

.appliance-status.off {
  background: #fee2e2;
  color: #b91c1c;
}

.environmental-charts {
  background-color: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 15px;
}

.environmental-charts h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #1f2937;
}

.current-value {
  position: absolute;
  top: 10px;
  right: 12px;
  padding: 3px 6px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
}

.appliance-card.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.appliance-icon {
  font-size: 2rem;
  margin-bottom: 8px;
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
  gap: 10px;
  align-items: center;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.control-buttons button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.start-btn {
  background: #10b981;
  color: white;
}

.pause-btn {
  background: #ef4444;
  color: white;
}

.resume-btn {
  background: #10b981;
  color: white;
}

.reset-btn {
  background: #6b7280;
  color: white;
}

.control-buttons button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.simulation-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.simulation-time-input input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
}

.simulation-time-input label,
.simulation-time-input span {
  font-size: 14px;
  color: #4b5563;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speed-control select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.simulation-time-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 15px 0;
  padding: 10px 16px;
  background-color: #f3f4f6;
  border-radius: 8px;
  font-weight: bold;
  width: fit-content;
}

.time-value {
  font-size: 18px;
  color: #1f2937;
}

.time-day {
  font-size: 14px;
  color: #6b7280;
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 4px;
}

.energy-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.stat-card {
  padding: 15px;
  border-radius: 8px;
  background: #f9fafb;
  border-left: 4px solid;
}

.stat-card.solar {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.stat-card.battery {
  border-left-color: #10b981;
  background: #ecfdf5;
}

.stat-card.grid {
  border-left-color: #8b5cf6;
  background: #f5f3ff;
}

.stat-card.home {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.stat-title {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.rl-insights {
  margin-top: 30px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.rl-insights h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1f2937;
  font-size: 18px;
}

.rl-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.rl-stat-card {
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rl-stat-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.rl-stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
}

.rl-temperatures {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.rl-temp-card {
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rl-temp-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.rl-temp-display {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .appliances-and-charts {
    flex-direction: column;
  }
  
  .charts-column {
    flex: 1;
    min-width: 100%;
  }
  
  .energy-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .rl-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-buttons {
    justify-content: center;
  }
}

</style>