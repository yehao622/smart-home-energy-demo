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
    console.error('Global error:', event.error);
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}