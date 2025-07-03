<!-- src/components/MockEnergyFlowDiagram.vue -->
<template>
  <div class="energy-flow-container">
    <div class="controls">   
      <div class="config-controls">
        <div class="simulation-time-input">
          <label for="simulation-hours">Simulation hours:</label>
          <input 
            id="simulation-hours" 
            type="number" 
            v-model.number="simulationHours" 
            min="0.1" 
            step="0.1"
            placeholder="Hours"
          />
          <span>hours</span>
        </div>

        <button @click="loadConfigFile" class="config-btn">
          📁 Load Configuration
        </button>
      </div>
      
      <div class="control-buttons">
        <button 
          v-if="simulationState === 'idle'"
          @click="startSimulation"
          class="start-btn"
        >
          ▶️ Start
        </button>

        <button 
          v-if="isRunning && simulationState !== 'idle'"
          @click="pauseSimulation"
          class="pause-btn"
        >
          ⏸️ Pause
        </button>

        <button 
          v-if="!isRunning && simulationState !== 'idle' && !simulationCompleted"
          @click="resumeSimulation"
          class="resume-btn"
        >
          ▶️ Resume
        </button>

        <button 
          v-if="simulationState !== 'idle'"
          @click="resetSimulation"
          class="reset-btn"
        >
          🔄 Reset
        </button>
        
        <div class="speed-control">
          <span>⚡ Animation speed:</span>
          <select v-model="selectedSpeed" @change="onSpeedChange">
            <option value="1">🐌 Slow</option>
            <option value="2">🚶 Medium</option>
            <option value="3">🏃 Fast</option>
          </select>
        </div>
      </div>
    </div>

    <div class="simulation-time-display" v-if="isRunning || simulationState !== 'idle'">
      <div class="time-icon">🕒</div>
      <div class="time-value">{{ formattedSimulationTime }}</div>
      <div class="time-day" v-if="localSimulationDay > 1">Day {{ localSimulationDay }}</div>
    </div>
    
    <div class="diagram">
      <svg width="100%" height="400" viewBox="0 0 1000 400">
        <!-- Background Grid -->
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#eee" stroke-width="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Solar Panel -->
        <g class="device-icon solar" :class="{ active: solarOutput > 0 }">
          <rect x="50" y="50" width="100" height="80" rx="10" 
                :fill="solarOutput > 0 ? '#fff3cd' : '#f8f9fa'" 
                stroke="#f59e0b" 
                :stroke-width="solarOutput > 0 ? 4 : 2"/>
          <text x="100" y="75" text-anchor="middle" class="device-label">☀️ Solar</text>
          <text x="100" y="95" text-anchor="middle" class="device-value" :class="{ active: solarOutput > 0 }">
            {{ solarOutput }} kW
          </text>
        </g>

        <!-- Battery -->
        <g class="device-icon battery" :class="{ active: batteryLevel > 20 }">
          <rect x="400" y="80" width="100" height="80" rx="10" 
                :fill="batteryLevel > 20 ? '#d1fae5' : '#f8f9fa'" 
                stroke="#10b981" 
                :stroke-width="batteryLevel > 20 ? 4 : 2"/>
          <text x="450" y="105" text-anchor="middle" class="device-label">🔋 Battery</text>
          <text x="450" y="125" text-anchor="middle" class="device-value" :class="{ active: batteryLevel > 20 }">
            {{ batteryLevel.toFixed(1) }}%
          </text>
          <!-- Battery Level Indicator -->
          <rect x="420" y="135" width="60" height="8" rx="4" fill="#e5e7eb"/>
          <rect x="420" y="135" :width="60 * (batteryLevel / 100)" height="8" rx="4" 
                :fill="batteryLevel > 50 ? '#10b981' : batteryLevel > 20 ? '#f59e0b' : '#ef4444'"/>
        </g>

        <!-- Grid -->
        <g class="device-icon grid" :class="{ active: Math.abs(gridPower) > 0 }">
          <rect x="750" y="50" width="100" height="80" rx="10" 
                :fill="Math.abs(gridPower) > 0 ? '#e7d3ff' : '#f8f9fa'" 
                stroke="#8b5cf6" 
                :stroke-width="Math.abs(gridPower) > 0 ? 4 : 2"/>
          <text x="800" y="75" text-anchor="middle" class="device-label">⚡ Grid</text>
          <text x="800" y="95" text-anchor="middle" class="device-value" :class="{ active: Math.abs(gridPower) > 0 }">
            {{ gridPower }} kW
          </text>
        </g>

        <!-- House -->
        <g class="device-icon house">
          <rect x="425" y="250" width="150" height="100" rx="10" 
                fill="#dbeafe" 
                stroke="#3b82f6" 
                stroke-width="3"/>
          <text x="500" y="285" text-anchor="middle" class="device-label">🏠 Home</text>
          <text x="500" y="305" text-anchor="middle" class="device-value active">
            {{ houseDemand }} kW
          </text>
          
          <!-- Temperature displays inside house -->
          <text x="470" y="325" text-anchor="middle" class="temp-display" font-size="12">
            🌡️ {{ currentHomeTemp }}°C
          </text>
          <text x="530" y="325" text-anchor="middle" class="temp-display" font-size="12">
            🚿 {{ currentWaterTemp }}°C
          </text>
        </g>
        
        <!-- Energy Flow Lines with Enhanced Animation -->
        <g v-if="isRunning">
          <!-- Solar to House -->
          <line v-if="solarOutput > 0 && houseDemand > 0" 
                x1="150" y1="90" x2="450" y2="280" 
                stroke="#f59e0b" 
                :stroke-width="Math.min(8, 2 + solarOutput)"
                stroke-dasharray="10,5"
                class="flow-line">
            <animate attributeName="stroke-dashoffset" values="0;-15" dur="1.5s" repeatCount="indefinite"/>
          </line>
          
          <!-- Solar to Battery (charging) -->
          <line v-if="solarOutput > houseDemand && batteryLevel < 95" 
                x1="150" y1="90" x2="400" y2="120" 
                stroke="#f59e0b" 
                stroke-width="3"
                stroke-dasharray="8,4"
                class="flow-line">
            <animate attributeName="stroke-dashoffset" values="0;-12" dur="1.2s" repeatCount="indefinite"/>
          </line>
          
          <!-- Battery to House (discharging) -->
          <line v-if="batteryLevel > 20 && batteryPower < 0" 
                x1="450" y1="160" x2="480" y2="250" 
                stroke="#10b981" 
                :stroke-width="Math.min(6, 2 + Math.abs(batteryPower))"
                stroke-dasharray="8,4"
                class="flow-line">
            <animate attributeName="stroke-dashoffset" values="0;-12" dur="1.8s" repeatCount="indefinite"/>
          </line>
          
          <!-- Grid to House -->
          <line v-if="gridPower > 0" 
                x1="750" y1="90" x2="550" y2="250" 
                stroke="#8b5cf6" 
                :stroke-width="Math.min(6, 2 + gridPower)"
                stroke-dasharray="10,5"
                class="flow-line">
            <animate attributeName="stroke-dashoffset" values="0;-15" dur="2s" repeatCount="indefinite"/>
          </line>

          <!-- Solar to Grid (export) -->
          <line v-if="solarOutput > houseDemand && batteryLevel > 95" 
                x1="150" y1="80" x2="750" y2="80" 
                stroke="#f59e0b" 
                stroke-width="2"
                stroke-dasharray="5,3"
                class="flow-line">
            <animate attributeName="stroke-dashoffset" values="0;-8" dur="1s" repeatCount="indefinite"/>
          </line>
        </g>

        <!-- Power Flow Labels -->
        <text v-if="isRunning && solarOutput > 0" x="300" y="175" text-anchor="middle" 
              class="flow-label" fill="#f59e0b" font-weight="bold" font-size="12">
          {{ Math.min(solarOutput, houseDemand).toFixed(1) }} kW
        </text>
        
        <text v-if="isRunning && gridPower > 0" x="650" y="165" text-anchor="middle" 
              class="flow-label" fill="#8b5cf6" font-weight="bold" font-size="12">
          {{ gridPower }} kW
        </text>
      </svg>
    </div>
    
    <!-- Appliances Section with Groups -->
    <div class="appliances">
      <div class="appliance-group">
        <h4>🔧 Fixed Power Appliances (Run Full Duration)</h4>
        <div class="appliances-group">
          <div 
            v-for="app in appliancesGroup1" 
            :key="app.id"
            class="appliance-card group-1"
            :class="{ active: app.active }"
            @click="toggleAppliance(app.id)"
          >
            <div class="appliance-icon" :class="{ pulse: app.active && isRunning }">
              {{ getApplianceIcon(app.type) }}
            </div>
            <div class="appliance-name">{{ app.name }}</div>
            <div class="appliance-power" :class="{ 'power-active': app.active }">{{ app.power }} kW</div>
            <div class="appliance-status" :class="app.active ? 'on' : 'off'">
              {{ app.active ? 'ON' : 'OFF' }}
            </div>
          </div>
        </div>
      </div>

      <div class="appliance-group">
        <h4>⚙️ Variable Power Appliances</h4>
        <div class="appliances-group">
          <div 
            v-for="app in appliancesGroup2" 
            :key="app.id"
            class="appliance-card group-2"
            :class="{ active: app.active }"
            @click="toggleAppliance(app.id)"
          >
            <div class="appliance-icon" :class="{ pulse: app.active && isRunning }">
              {{ getApplianceIcon(app.type) }}
            </div>
            <div class="appliance-name">{{ app.name }}</div>
            <div class="appliance-power" :class="{ 'power-active': app.active }">{{ app.power }} kW</div>
            <div class="appliance-status" :class="app.active ? 'on' : 'off'">
              {{ app.active ? 'ON' : 'OFF' }}
            </div>
          </div>
        </div>
      </div>

      <div class="appliance-group">
        <h4>🎛️ Fixed Power Appliances (Toggle Anytime)</h4>
        <div class="appliances-group">
          <div 
            v-for="app in appliancesGroup3" 
            :key="app.id"
            class="appliance-card group-3"
            :class="{ active: app.active }"
            @click="toggleAppliance(app.id)"
          >
            <div class="appliance-icon" :class="{ pulse: app.active && isRunning }">
              {{ getApplianceIcon(app.type) }}
            </div>
            <div class="appliance-name">{{ app.name }}</div>
            <div class="appliance-power" :class="{ 'power-active': app.active }">{{ app.power }} kW</div>
            <div class="appliance-status" :class="app.active ? 'on' : 'off'">
              {{ app.active ? 'ON' : 'OFF' }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Energy Stats -->
    <div class="energy-stats">
      <div class="stat-card solar" :class="{ active: solarOutput > 0 }">
        <div class="stat-title">☀️ Solar Production</div>
        <div class="stat-value">{{ solarOutput }} kW</div>
        <div class="stat-trend">{{ solarOutput > 2 ? '📈 Peak' : solarOutput > 0 ? '☀️ Generating' : '🌙 Night' }}</div>
      </div>
      
      <div class="stat-card battery" :class="{ active: batteryLevel > 20 }">
        <div class="stat-title">🔋 Battery Level</div>
        <div class="stat-value">{{ batteryLevel.toFixed(1) }}%</div>
        <div class="stat-trend">
          {{ batteryStatus === 'charging' ? '⚡ Charging' : 
             batteryStatus === 'discharging' ? '🔋 Discharging' : '⏸️ Idle' }}
        </div>
      </div>
      
      <div class="stat-card grid" :class="{ active: Math.abs(gridPower) > 0 }">
        <div class="stat-title">⚡ Grid Usage</div>
        <div class="stat-value">{{ gridPower }} kW</div>
        <div class="stat-trend">
          {{ gridPower > 0 ? '📈 Importing' : gridPower < 0 ? '📤 Exporting' : '⚖️ Balanced' }}
        </div>
      </div>
      
      <div class="stat-card home active">
        <div class="stat-title">🏠 Home Demand</div>
        <div class="stat-value">{{ houseDemand }} kW</div>
        <div class="stat-trend">{{ appliances.filter(a => a.active).length }} devices on</div>
      </div>
    </div>

    <!-- Environmental Data Panel -->
    <div class="environmental-panel" v-if="isRunning">
      <h4>🌍 Environmental Data</h4>
      <div class="env-stats">
        <div class="env-stat">
          <span class="env-icon">🌡️</span>
          <span class="env-label">Outdoor</span>
          <span class="env-value">{{ currentOutdoorTemp }}°C</span>
        </div>
        <div class="env-stat">
          <span class="env-icon">💰</span>
          <span class="env-label">Electricity</span>
          <span class="env-value">${{ currentPrice }}/kWh</span>
        </div>
        <div class="env-stat">
          <span class="env-icon">🏠</span>
          <span class="env-label">Indoor</span>
          <span class="env-value">{{ currentHomeTemp }}°C</span>
        </div>
        <div class="env-stat">
          <span class="env-icon">🚿</span>
          <span class="env-label">Water</span>
          <span class="env-value">{{ currentWaterTemp }}°C</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MockEnergyFlowDiagram',
  
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
    simulationElapsedMinutes: { type: Number, default: 0 },
    simulationFormattedTime: { type: String, default: "00:00" },
    simulationDay: { type: Number, default: 1 },
    homeTemperatureHistory: { type: Array, default: () => [] },
    waterTemperatureHistory: { type: Array, default: () => [] },
    appliancePowerHistory: { type: Object, default: () => ({}) },
    simulationCompleted: { type: Boolean, default: false }
  },
  
  data() {
    return {
      simulationHours: 1,
      selectedSpeed: 2,
      localSimulationDay: 1,
      formattedSimulationTime: "00:00",
      
      // Mock environmental data
      currentOutdoorTemp: 25,
      currentPrice: 0.025,
      currentHomeTemp: 22.5,
      currentWaterTemp: 58
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
  
  methods: {
    getApplianceIcon(type) {
      const icons = {
        dishwasher: '🍽️',
        wash_machine: '👕',
        clothes_dryer: '🌀',
        hvac: '❄️',
        water_heater: '🚿',
        ev_charger: '🔌',
        tv: '📺',
        refrigerator: '🧊',
        lights: '💡',
        vacuum: '🧹',
        hair_dryer: '💨'
      };
      return icons[type] || '⚡';
    },
    
    toggleAppliance(id) {
      this.$emit('toggle-appliance', id);
    },
    
    startSimulation() {
      this.$emit('start-simulation');
    },
    
    pauseSimulation() {
      this.$emit('pause-simulation');
    },
    
    resumeSimulation() {
      this.$emit('resume-simulation');
    },
    
    resetSimulation() {
      this.$emit('reset-simulation');
    },
    
    loadConfigFile() {
      console.log('Load config in demo mode');
    },
    
    onSpeedChange() {
      this.$emit('speed-changed', { 
        animationSpeed: this.selectedSpeed,
        interval: this.selectedSpeed === 1 ? 3000 : this.selectedSpeed === 2 ? 2000 : 1000
      });
    }
  },
  
  watch: {
    simulationFormattedTime(newVal) {
      this.formattedSimulationTime = newVal;
    },
    
    simulationDay(newVal) {
      this.localSimulationDay = newVal;
    },
    
    // Watch for environmental updates from parent
    rlPrediction: {
      handler(newVal) {
        if (newVal && newVal.environment) {
          this.currentOutdoorTemp = newVal.environment.outside_temp?.toFixed(1) || this.currentOutdoorTemp;
          this.currentPrice = newVal.environment.price?.toFixed(3) || this.currentPrice;
        }
        if (newVal && newVal.temperatures) {
          this.currentHomeTemp = newVal.temperatures.home?.current?.toFixed(1) || this.currentHomeTemp;
          this.currentWaterTemp = newVal.temperatures.water?.current?.toFixed(1) || this.currentWaterTemp;
        }
      },
      deep: true
    }
  }
};
</script>

<style scoped>
/* Enhanced styling for mock component */
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
  margin-bottom: 20px;
}

.device-icon {
  cursor: pointer;
  transition: all 0.3s ease;
}

.device-icon.active {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.4));
}

.device-label {
  font-size: 14px;
  font-weight: bold;
  fill: #374151;
}

.device-value {
  font-size: 13px;
  font-weight: bold;
  fill: #6b7280;
  transition: all 0.3s ease;
}

.device-value.active {
  fill: #1f2937;
  font-size: 14px;
}

.temp-display {
  fill: #6b7280;
  font-weight: 500;
}

.flow-line {
  filter: drop-shadow(0 0 3px rgba(0,0,0,0.2));
}

.flow-label {
  font-family: 'Segoe UI', system-ui, sans-serif;
  filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.1));
}

.appliances {
  margin: 25px 0;
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
  transition: all 0.3s ease;
}

.appliance-icon.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
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
  transition: all 0.3s ease;
}

.appliance-power.power-active {
  color: #059669;
  font-weight: 700;
  font-size: 0.9rem;
}

.appliance-status {
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 15px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  transition: all 0.3s ease;
}

.appliance-status.on {
  background: linear-gradient(45deg, #dcfce7, #bbf7d0);
  color: #166534;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.appliance-status.off {
  background: linear-gradient(45deg, #fee2e2, #fecaca);
  color: #991b1b;
}

.energy-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 25px 0;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  border-left: 5px solid;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  opacity: 0.7;
}

.stat-card.active {
  opacity: 1;
  transform: scale(1.02);
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
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.environmental-panel {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  border-left: 4px solid #059669;
}

.environmental-panel h4 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.env-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.env-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 12px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.env-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.env-icon {
  font-size: 1.2rem;
}

.env-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  flex: 1;
}

.env-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1f2937;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .appliances-group {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .energy-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .env-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 768px) {
  .energy-flow-container {
    padding: 15px;
  }
  
  .appliances-group {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
  
  .energy-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .diagram {
    height: 350px;
  }
}

@media (max-width: 480px) {
  .appliances-group {
    grid-template-columns: 1fr 1fr;
  }
  
  .energy-stats {
    grid-template-columns: 1fr;
  }
  
  .env-stats {
    grid-template-columns: 1fr 1fr;
  }
  
  .control-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .control-buttons > * {
    width: 100%;
  }
}
