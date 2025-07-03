import { setupErrorHandling } from './errorHandler';
setupErrorHandling();

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// import { DEMO_MODE } from './config/productionDemo.js'

import { io } from 'socket.io-client';
window.io = io;

createApp(App).mount('#app')
