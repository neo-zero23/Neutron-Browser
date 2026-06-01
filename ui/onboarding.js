/* ============================================
   Neutron Onboarding - Renderer Logic
   ============================================ */

let selectedLanguage = 'es';
let selectedTheme = 'dark';

/**
 * Initialize i18n strings in the DOM
 * Fallback to hardcoded Spanish/English if i18n not available
 */
const i18nStrings = {
  es: {
    'onboarding.title': 'Bienvenido a Neutron',
    'onboarding.subtitle': 'Navegador rápido, privado y optimizado',
    'onboarding.selectLanguage': 'Selecciona tu idioma',
    'onboarding.selectTheme': 'Elige tu tema',
    'onboarding.spanish': 'Español',
    'onboarding.english': 'English',
    'onboarding.darkTheme': 'Oscuro',
    'onboarding.lightTheme': 'Claro',
    'onboarding.start': 'Comenzar',
    'onboarding.canChangeAnytime': 'Puedes cambiar esto después en configuración'
  },
  en: {
    'onboarding.title': 'Welcome to Neutron',
    'onboarding.subtitle': 'Fast, private, and optimized browser',
    'onboarding.selectLanguage': 'Select your language',
    'onboarding.selectTheme': 'Choose your theme',
    'onboarding.spanish': 'Spanish',
    'onboarding.english': 'English',
    'onboarding.darkTheme': 'Dark',
    'onboarding.lightTheme': 'Light',
    'onboarding.start': 'Get Started',
    'onboarding.canChangeAnytime': 'You can change this later in settings'
  }
};

/**
 * Translate UI strings
 */
function translateUI(language) {
  const strings = i18nStrings[language] || i18nStrings['es'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) {
      el.textContent = strings[key];
    }
  });
}

/**
 * Handle language selection
 */
function setupLanguageSelection() {
  document.querySelectorAll('.language-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active state from all language buttons
      document.querySelectorAll('.language-btn').forEach(b => b.classList.remove('active'));
      
      // Add active state to clicked button
      btn.classList.add('active');
      
      // Update selected language
      selectedLanguage = btn.getAttribute('data-language');
      
      // Translate UI
      translateUI(selectedLanguage);
    });
  });

  // Set default language button as active
  const defaultLangBtn = document.querySelector(`[data-language="${selectedLanguage}"]`);
  if (defaultLangBtn) {
    defaultLangBtn.classList.add('active');
  }
}

/**
 * Handle theme selection
 */
function setupThemeSelection() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active state from all theme buttons
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      
      // Add active state to clicked button
      btn.classList.add('active');
      
      // Update selected theme
      selectedTheme = btn.getAttribute('data-theme');
    });
  });

  // Set default theme button as active
  const defaultThemeBtn = document.querySelector(`[data-theme="${selectedTheme}"]`);
  if (defaultThemeBtn) {
    defaultThemeBtn.classList.add('active');
  }
}

/**
 * Handle "Comenzar" button click
 * Send configuration to main.js via IPC and let main.js destroy the window
 */
function setupStartButton() {
  const startBtn = document.getElementById('btn-start');
  
  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Validate selections
    if (!selectedLanguage || !selectedTheme) {
      console.warn('[Onboarding] Invalid selections:', { selectedLanguage, selectedTheme });
      return;
    }

    // Disable button to prevent multiple clicks
    startBtn.disabled = true;

    // Send IPC to main.js with configuration
    const payload = {
      language: selectedLanguage,
      theme: selectedTheme,
      timestamp: Date.now()
    };

    console.log('[Onboarding] Sending completion payload to main.js:', payload);
    window.onboarding.sendComplete(payload);

    // NOTE: Do NOT close window here. Let main.js handle window.destroy()
    // This prevents synchronization issues and ensures clean cleanup
  });
}

/**
 * Initialize onboarding on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Onboarding] Initializing onboarding screen...');

  // Translate UI to default language
  translateUI(selectedLanguage);

  // Setup event listeners
  setupLanguageSelection();
  setupThemeSelection();
  setupStartButton();

  console.log('[Onboarding] Ready. Default selections:', { selectedLanguage, selectedTheme });
});

/**
 * Cleanup on window unload to prevent memory leaks
 */
window.addEventListener('unload', () => {
  console.log('[Onboarding] Cleaning up...');
  // Remove all event listeners (already done by DOM cleanup)
  // No explicit cleanup needed for vanilla JS DOM listeners
});
