// src/errorHandler.js - Fixed JavaScript version

export function setupErrorHandling() {
  const originalConsoleError = console.error;
  console.error = function(...args) {  // Removed ': any[]'
    const errorMessage = args.length > 0 ? String(args[0]) : '';
    
    // Filter out common non-critical errors
    const ignoredErrors = [
      'ResizeObserver loop limit exceeded',
      'Non-passive event listener',
      'Chart.js'
    ];
    
    const shouldIgnore = ignoredErrors.some(ignored => 
      errorMessage.includes(ignored)
    );
    
    if (!shouldIgnore) {
      originalConsoleError.apply(console, args);
    }
  };

  // Global error handler
  window.addEventListener('error', (event) => {
    console.warn('Demo Mode - Error caught:', event.error?.message || event.message);
    event.preventDefault(); // Prevent error from breaking the demo
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Demo Mode - Promise rejection caught:', event.reason);
    event.preventDefault(); // Prevent unhandled rejection from breaking the demo
  });

  // Handle Vue component errors (if using Vue 3's global error handler)
  if (window.Vue && window.Vue.config) {
    window.Vue.config.errorHandler = (err, vm, info) => {
      console.warn('Demo Mode - Vue error caught:', err.message, info);
    };
  }

  console.log('✅ Demo Mode: Error handling initialized');
}
