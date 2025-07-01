// Add these components to make your demo more engaging
// components/DemoWelcome.vue

<template>
  <div class="demo-welcome-overlay" v-if="showWelcome">
    <div class="welcome-modal">
      <div class="welcome-header">
        <h2>🏠 Smart Home Energy Management System</h2>
        <p>AI-Powered Energy Optimization Demo</p>
      </div>
      
      <div class="welcome-content">
        <div class="feature-highlights">
          <div class="feature">
            <span class="icon">🤖</span>
            <h4>AI Optimization</h4>
            <p>Machine learning algorithms optimize energy usage in real-time</p>
          </div>
          
          <div class="feature">
            <span class="icon">💰</span>
            <h4>Cost Savings</h4>
            <p>30-40% reduction in electricity bills through smart scheduling</p>
          </div>
          
          <div class="feature">
            <span class="icon">🌱</span>
            <h4>Renewable Integration</h4>
            <p>Maximizes solar energy utilization and reduces grid dependency</p>
          </div>
        </div>
        
        <div class="demo-scenarios">
          <h3>Try These Scenarios:</h3>
          <div class="scenarios">
            <button @click="startScenario('peak')" class="scenario-btn peak">
              ⚡ Peak Hour Management
            </button>
            <button @click="startScenario('solar')" class="scenario-btn solar">
              ☀️ Solar Optimization
            </button>
            <button @click="startScenario('night')" class="scenario-btn night">
              🌙 Night Charging
            </button>
          </div>
        </div>
      </div>
      
      <div class="welcome-actions">
        <button @click="startDemo" class="start-demo-btn">
          🚀 Start AI Demo
        </button>
        <button @click="closeWelcome" class="skip-btn">
          Skip Introduction
        </button>
      </div>
      
      <div class="technical-note">
        <p><strong>Technical Note:</strong> This demo showcases a Vue.js frontend with AI-powered backend simulation. 
        The full system includes Python RL algorithms, Node.js microservices, and real-time data processing.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DemoWelcome',
  data() {
    return {
      showWelcome: true
    };
  },
  methods: {
    startDemo() {
      this.$emit('start-demo', { scenario: 'auto' });
      this.closeWelcome();
    },
    
    startScenario(scenario) {
      this.$emit('start-demo', { scenario });
      this.closeWelcome();
    },
    
    closeWelcome() {
      this.showWelcome = false;
    }
  }
};
</script>

<style scoped>
.demo-welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.welcome-modal {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.welcome-header {
  text-align: center;
  margin-bottom: 25px;
}

.welcome-header h2 {
  margin: 0 0 10px 0;
  color: #1f2937;
  font-size: 24px;
}

.welcome-header p {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

.feature-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.feature {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  background: #f8fafc;
}

.feature .icon {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
}

.feature h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.feature p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.demo-scenarios {
  margin-bottom: 25px;
}

.demo-scenarios h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #1f2937;
}

.scenarios {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.scenario-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s;
}

.scenario-btn:hover {
  transform: translateY(-2px);
}

.scenario-btn.peak {
  background: #fef3c7;
  color: #92400e;
}

.scenario-btn.solar {
  background: #ecfdf5;
  color: #047857;
}

.scenario-btn.night {
  background: #ede9fe;
  color: #6366f1;
}

.welcome-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.start-demo-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
}

.skip-btn {
  padding: 12px 24px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.technical-note {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.technical-note p {
  margin: 0;
  font-size: 14px;
  color: #0369a1;
}
</style>
