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
   * Send wizard completion data to main process
   * @param {Object} config - full setup-wizard payload (language, theme, searchEngine, ...)
   */
  sendComplete: (config) => {
    console.log('[Preload] Sending onboarding-complete:', config);
    ipcRenderer.send('onboarding-complete', config);
  },
  rerun: () => ipcRenderer.send('rerun-setup-wizard')
});

console.log('[Preload] Onboarding preload loaded. window.onboarding exposed.');
