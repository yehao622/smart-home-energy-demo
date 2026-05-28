<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { login } from './services/api';
import { saveToken, clearToken, isAuthenticated } from './services/auth';
import { DemoService } from './services/demoService';
import EnergyFlowDiagram from './components/EnergyFlowDiagram.vue';

// --- Auth ---
const username = ref('demo');
const password = ref('demo123');
const authError = ref('');
const loggedIn = ref(false);

async function handleLogin() {
  authError.value = '';
  try {
    const result = await login(username.value, password.value);
    saveToken(result.access_token);
    loggedIn.value = true;
    initSimulation();
  } catch (err) {
    authError.value = 'Login failed. Try demo / demo123';
    console.error(err);
  }
}

function handleLogout() {
  clearToken();
  loggedIn.value = false;
  demoService.stopSimulation();
  simulationState.value = 'idle';
}

onMounted(() => {
  if (isAuthenticated()) {
    loggedIn.value = true;
    initSimulation();
  }
});

// --- Simulation ---
const demoService = new DemoService();
const simulationState = ref('idle');
const simData = reactive({
  solarOutput: 0,
  batteryLevel: 45,
  batteryStatus: 'empty',
  batteryPower: 0,
  gridPower: 0,
  houseDemand: 0,
  appliances: [],
  simulationTime: '00:00',
  simulationDay: 1,
});
const rlPrediction = ref(null);
let pollInterval = null;

function initSimulation() {
  updateFromService();
}

async function updateFromService() {
  const state = await demoService.getCurrentState();
  Object.assign(simData, state);
}

function startPoll() {
  pollInterval = setInterval(updateFromService, 500);
}

function stopPoll() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function onStartSimulation() {
  await demoService.startSimulation();
  simulationState.value = 'running';
  startPoll();
}

async function onPauseSimulation() {
  await demoService.stopSimulation();
  simulationState.value = 'paused';
  stopPoll();
}

async function onResumeSimulation() {
  await demoService.startSimulation();
  simulationState.value = 'running';
  startPoll();
}

async function onResetSimulation() {
  await demoService.resetSimulation();
  simulationState.value = 'idle';
  stopPoll();
  updateFromService();
}

async function onToggleAppliance(id) {
  await demoService.toggleAppliance(id);
  updateFromService();
}

onUnmounted(() => {
  stopPoll();
  demoService.stopSimulation();
});
</script>

<template>
  <!-- Login Screen -->
  <div v-if="!loggedIn" style="max-width: 320px; margin: 6rem auto; padding: 2rem; font-family: sans-serif;">
    <h1 style="margin-bottom: 1.5rem;">Smart Home Energy Demo</h1>
    <div style="display: grid; gap: 0.75rem;">
      <input v-model="username" placeholder="Username" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;" />
      <input v-model="password" type="password" placeholder="Password" style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;" />
      <button @click="handleLogin" style="padding: 0.6rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
        Login
      </button>
      <p v-if="authError" style="color: #ef4444; margin: 0;">{{ authError }}</p>
    </div>
  </div>

  <!-- Dashboard -->
  <div v-else style="padding: 1rem; font-family: sans-serif;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h1 style="margin: 0;">Smart Home Energy Demo</h1>
      <button @click="handleLogout" style="padding: 0.4rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer;">
        Logout
      </button>
    </div>

    <EnergyFlowDiagram
      :solarOutput="simData.solarOutput"
      :batteryLevel="simData.batteryLevel"
      :batteryStatus="simData.batteryStatus"
      :batteryPower="simData.batteryPower"
      :gridPower="simData.gridPower"
      :houseDemand="simData.houseDemand"
      :appliances="simData.appliances"
      :isRunning="simulationState === 'running'"
      :simulationState="simulationState"
      :simulationFormattedTime="simData.simulationTime"
      :simulationDay="simData.simulationDay"
      :rlPrediction="rlPrediction"
      @start-simulation="onStartSimulation"
      @pause-simulation="onPauseSimulation"
      @resume-simulation="onResumeSimulation"
      @reset-simulation="onResetSimulation"
      @toggle-appliance="onToggleAppliance"
    />
  </div>
</template>