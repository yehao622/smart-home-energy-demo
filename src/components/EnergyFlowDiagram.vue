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
        <g class="device-icon" :class="{ active: solarOutput > 0, pulse: isRunning && solarOutput > 0 }">
          <rect x="50" y="50" width="100" height="80" rx="10" :fill="solarOutput > 0 ? '#fef3c7' : '#f3f4f6'" 
                stroke="#f59e0b" :stroke-width="solarOutput > 0 ? 3 : 2"/>
          <text x="100" y="75" text-anchor="middle" class="device-label">☀️ Solar</text>
          <text x="100" y="95" text-anchor="middle" class="device-value">{{ solarOutput }} kW</text>
        </g>

        <!-- Battery -->
        <g class="device-icon" :class="{ active: batteryLevel > 10, pulse: isRunning && Math.abs(batteryPower) > 0 }">
          <rect x="300" y="100" width="100" height="80" rx="10" :fill="batteryLevel > 10 ? '#d1fae5' : '#f3f4f6'" 
                stroke="#10b981" :stroke-width="batteryLevel > 10 ? 3 : 2"/>
          <text x="350" y="125" text-anchor="middle" class="device-label">🔋 Battery</text>
          <text x="350" y="145" text-anchor="middle" class="device-value">{{ batteryLevel.toFixed(1) }}%</text>
          <text x="350" y="160" text-anchor="middle" class="device-status" :fill="getBatteryStatusColor()">
            {{ batteryStatus.toUpperCase() }}
          </text>
        </g>

        <!-- Grid -->
        <g class="device-icon" :class="{ active: Math.abs(gridPower) > 0, pulse: isRunning && Math.abs(gridPower) > 0 }">
          <rect x="650" y="50" width="100" height="80" rx="10" :fill="Math.abs(gridPower) > 0 ? '#e7d3ff' : '#f3f4f6'" 
                stroke="#8b5cf6" :stroke-width="Math.abs(gridPower) > 0 ? 3 : 2"/>
          <text x="700" y="75" text-anchor="middle" class="device-label">⚡ Grid</text>
          <text x="700" y="95" text-anchor="middle" class="device-value">{{ gridPower }} kW</text>
        </g>

        <!-- House -->
        <g class="device-icon active">
          <rect x="425" y="250" width="150" height="100" rx="10" fill="#dbeafe" 
                stroke="#3b82f6" stroke-width="3"/>
          <text x="500" y="285" text-anchor="middle" class="device-label">🏠 Home</text>
          <text x="500" y="305" text-anchor="middle" class="device-value">{{ houseDemand }} kW</text>
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
              <div class="appliance-power" :class="{ active: app.active }">{{ app.power }} kW</div>
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
              <div class="appliance-power" :class="{ active: app.active }">{{ app.power }} kW</div>
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
              <div class="appliance-power" :class="{ active: app.active }">{{ app.power }} kW</div>
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
              <div class="chart-bar" :style="{ height: (solarOutput/5*100) + '%', backgroundColor: '#f59e0b' }"></div>
              <div class="chart-bar" :style="{ height: (batteryLevel) + '%', backgroundColor: '#10b981' }"></div>
            </div>
            <div class="current-value">Solar: {{ solarOutput }}kW | Battery: {{ batteryLevel.toFixed(0) }}%</div>
          </div>

          <div class="chart-container">
            <h4>Temperature (°C)</h4>
            <div class="temp-display">
              <div class="temp-item">
                <span class="temp-label">🌡️ Indoor:</span>
                <span class="temp-value">{{ indoorTemp.toFixed(1) }}°C</span>
              </div>
              <div class="temp-item">
                <span class="temp-label">💧 Water:</span>
                <span class="temp-value">{{ waterTemp.toFixed(1) }}°C</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Energy Stats -->
    <div class="energy-stats">
      <div class="stat-card solar">
        <div class="stat-title">☀️ Solar Production</div>
        <div class="stat-value">{{ solarOutput }} kW</div>
      </div>
      <div class="stat-card battery">
        <div class="stat-title">🔋 Battery Level</div>
        <div class="stat-value">{{ batteryLevel.toFixed(1) }}%</div>
      </div>
      <div class="stat-card grid">
        <div class="stat-title">⚡ Grid Usage</div>
        <div class="stat-value">{{ gridPower }} kW</div>
      </div>
      <div class="stat-card home">
        <div class="stat-title">🏠 Home Demand</div>
        <div class="stat-value">{{ houseDemand }} kW</div>
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
    simulationDay: { type: Number, default: 1 }
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
        hvac: '❄️',
        refrigerator: '🧊',
        lights: '💡',
        ev_charger: '🔌',
        dishwasher: '🍽️',
        water_heater: '🚿',
        wash_machine: '👕',
        clothes_dryer: '🌀',
        tv: '📺',
        vacuum: '🧹',
        hair_dryer: '💨'
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
/* Include all the CSS from your original EnergyFlowDiagram.css here */
/* I'll provide the essential styles */

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

.appliance-card.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.appliance-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

/* Add more styles as needed... */
</style>