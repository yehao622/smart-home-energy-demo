<template>
  <div class="app">
    <header class="header">
      <h1>🏠 Smart Home Energy Simulator</h1>
      <p>AI-Powered Energy Management Demo</p>
    </header>
    
    <main class="content">
      <div class="demo-card">
        <h2>🎭 Live Demo</h2>
        <p>This is a working demonstration of the smart home energy management system.</p>
        
        <div class="status">
          <div class="status-item">
            <span class="icon">⚡</span>
            <span>System Status: <strong>{{ systemStatus }}</strong></span>
          </div>
          <div class="status-item">
            <span class="icon">🔋</span>
            <span>Battery: <strong>{{ batteryLevel }}%</strong></span>
          </div>
          <div class="status-item">
            <span class="icon">☀️</span>
            <span>Solar: <strong>{{ solarOutput }} kW</strong></span>
          </div>
        </div>
        
        <button @click="toggleDemo" class="demo-btn">
          {{ isRunning ? '⏸️ Pause Demo' : '▶️ Start Demo' }}
        </button>
        
        <div class="info" v-if="isRunning">
          <p>✅ Demo is running! The system is optimizing energy usage.</p>
        </div>
      </div>
    </main>
    
    <footer class="footer">
      <p>Built with Vue.js • Deployed on Vercel • AI-Powered Energy Management</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isRunning: false,
      systemStatus: 'Ready',
      batteryLevel: 45,
      solarOutput: 0,
      demoInterval: null
    }
  },
  methods: {
    toggleDemo() {
      if (this.isRunning) {
        this.stopDemo()
      } else {
        this.startDemo()
      }
    },
    
    startDemo() {
      this.isRunning = true
      this.systemStatus = 'Optimizing'
      
      // Simulate changing values
      this.demoInterval = setInterval(() => {
        this.batteryLevel = 20 + Math.random() * 60
        this.solarOutput = Math.random() * 5
      }, 2000)
    },
    
    stopDemo() {
      this.isRunning = false
      this.systemStatus = 'Ready'
      
      if (this.demoInterval) {
        clearInterval(this.demoInterval)
        this.demoInterval = null
      }
    }
  },
  
  beforeUnmount() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval)
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.content {
  flex: 1;
  width: 100%;
  max-width: 600px;
}

.demo-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  text-align: center;
}

.demo-card h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 2rem;
}

.status {
  display: grid;
  gap: 15px;
  margin: 30px 0;
  text-align: left;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.icon {
  font-size: 1.5rem;
}

.demo-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  margin: 20px 0;
}

.demo-btn:hover {
  transform: translateY(-2px);
}

.info {
  margin-top: 20px;
  padding: 15px;
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 8px;
  color: #047857;
}

.footer {
  margin-top: 40px;
  text-align: center;
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .demo-card {
    padding: 20px;
  }
}
</style>