const I18N = window.NeutronI18n;
let currentLanguage = 'en';
const shortcutContext = new URLSearchParams(window.location.search).get('context') || 'sidebar';

const nameInput = document.getElementById('sidebar-shortcut-name-input');
const urlInput = document.getElementById('sidebar-shortcut-url-input');
const closeBtn = document.getElementById('close-sidebar-modal-btn');
const saveBtn = document.getElementById('save-sidebar-shortcut-btn');

function t(path) {
  return I18N ? I18N.t(currentLanguage, path) : path;
}

function applyLanguage(lang) {
  currentLanguage = I18N ? I18N.normalize(lang) : (lang || 'en');
  document.documentElement.lang = currentLanguage;
  const title = document.getElementById('sidebar-shortcut-modal-title');
  const nameLabel = document.getElementById('sidebar-shortcut-name-label');
  const urlLabel = document.getElementById('sidebar-shortcut-url-label');
  const addTitle = shortcutContext === 'home'
    ? 'Add shortcut'
    : (I18N ? t('chrome.addSidebarShortcut') : 'Add sidebar shortcut');
  document.title = addTitle;
  if (title) title.textContent = addTitle;
  if (nameLabel) nameLabel.textContent = I18N ? t('chrome.sidebarShortcutName') : 'Name';
  if (urlLabel) urlLabel.textContent = I18N ? t('chrome.sidebarShortcutUrl') : 'URL (web address)';
  if (closeBtn) closeBtn.textContent = I18N ? t('chrome.sidebarShortcutCancel') : 'Cancel';
  if (saveBtn) saveBtn.textContent = I18N ? t('chrome.sidebarShortcutSave') : 'Save';
  if (nameInput && !nameInput.value) nameInput.placeholder = I18N ? t('chrome.sidebarShortcutNamePlaceholder') : 'e.g. Twitch';
  if (urlInput && !urlInput.value) urlInput.placeholder = I18N ? t('chrome.sidebarShortcutUrlPlaceholder') : 'e.g. https://twitch.tv';
}

function closeWindow() {
  if (window.api && window.api.closeShortcutWindow) {
    window.api.closeShortcutWindow(shortcutContext);
  } else if (window.api && window.api.closeSidebarShortcutWindow && shortcutContext === 'sidebar') {
    window.api.closeSidebarShortcutWindow();
  } else if (window.api && window.api.closeHomeShortcutWindow && shortcutContext === 'home') {
    window.api.closeHomeShortcutWindow();
  } else {
    window.close();
  }
}

function normalizeUrl(value) {
  if (!/^https?:\/\//i.test(value)) return 'https://' + value;
  return value;
}

if (closeBtn) {
  closeBtn.addEventListener('click', closeWindow);
}

if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    const title = nameInput.value.trim();
    let url = urlInput.value.trim();
    if (!title || !url) return;
    url = normalizeUrl(url);
    if (window.api && window.api.addBookmark) {
      window.api.addBookmark({ type: shortcutContext, url, title });
    }
    closeWindow();
  });
}

if (nameInput && urlInput) {
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') urlInput.focus();
  });
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });
}

if (window.api && window.api.loadSettings) {
  window.api.loadSettings().then((config) => {
    applyLanguage(config.language || 'en');
  });
}

if (window.api && window.api.onSettingsUpdated) {
  window.api.onSettingsUpdated((config) => {
    if (config.language) {
      applyLanguage(config.language);
    }
  });
}

window.addEventListener('load', () => {
  // Keep the window simple and avoid focus churn; let the first click place the caret naturally.
});
