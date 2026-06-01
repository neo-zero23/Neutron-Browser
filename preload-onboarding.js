/* ============================================
   Neutron Onboarding - Preload Bridge
   ============================================ */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Minimal IPC bridge for onboarding only
 * Exposes only onboarding completion functionality
 * No full API exposure to reduce memory footprint
 */
contextBridge.exposeInMainWorld('onboarding', {
  /**
   * Send onboarding completion data to main process
   * @param {Object} config - { language, theme, timestamp }
   */
  sendComplete: (config) => {
    console.log('[Preload] Sending onboarding-complete:', config);
    ipcRenderer.send('onboarding-complete', config);
  }
});

console.log('[Preload] Onboarding preload loaded. window.onboarding exposed.');
