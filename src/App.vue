<script setup>
import { ref, onMounted } from 'vue';
import { login, fetchDevices, fetchEnergyStats } from './services/api';
import { saveToken, clearToken, isAuthenticated } from './services/auth';

const username = ref('demo');
const password = ref('demo123');
const error = ref('');
const loggedIn = ref(false);
const devices = ref([]);
const stats = ref(null);

async function loadDashboard() {
  error.value = '';
  try {
    devices.value = await fetchDevices();
    stats.value = await fetchEnergyStats();
    loggedIn.value = true;
  } catch (err) {
    error.value = 'Failed to load protected data.';
    console.error(err);
  }
}

async function handleLogin() {
  error.value = '';
  try {
    const result = await login(username.value, password.value);
    saveToken(result.access_token);
    await loadDashboard();
  } catch (err) {
    error.value = 'Login failed. Try demo / demo123';
    console.error(err);
  }
}

function handleLogout() {
  clearToken();
  loggedIn.value = false;
  devices.value = [];
  stats.value = null;
}

onMounted(async () => {
  if (isAuthenticated()) {
    await loadDashboard();
  }
});
</script>

<template>
  <main style="max-width: 900px; margin: 0 auto; padding: 2rem;">
    <h1>Smart Home Energy Demo</h1>

    <div v-if="!loggedIn" style="margin-top: 2rem;">
      <h2>Login</h2>
      <div style="display: grid; gap: 1rem; max-width: 320px;">
        <input v-model="username" placeholder="Username" />
        <input v-model="password" type="password" placeholder="Password" />
        <button @click="handleLogin">Login</button>
        <p v-if="error" style="color: red;">{{ error }}</p>
      </div>
    </div>

    <div v-else style="margin-top: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2>Dashboard</h2>
        <button @click="handleLogout">Logout</button>
      </div>

      <p v-if="stats">
        Net Power: {{ stats.netW }} W |
        Consumption: {{ stats.totalConsumptionW }} W |
        Generation: {{ stats.totalGenerationW }} W
      </p>

      <h3>Devices</h3>
      <ul>
        <li v-for="device in devices" :key="device.id">
          {{ device.name }} — {{ device.status }} — {{ device.powerW }} W
        </li>
      </ul>
    </div>
  </main>
</template>