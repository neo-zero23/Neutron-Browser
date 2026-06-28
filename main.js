const { app, BrowserWindow, WebContentsView, ipcMain, session, powerMonitor, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { fileURLToPath } = require('url');
const https = require('https');
const NeutronDB = require('./db');
const NeutronI18n = require('./ui/i18n');

function extractDomain(url) {
  try { return new URL(url).hostname || ''; } catch (e) { return ''; }
}

function mainText(key) {
  return NeutronI18n.t(neutronConfig.language || 'es', `main.${key}`);
}

function getTabById(tabId) {
  return tabs.find(t => t.id === tabId) || null;
}

function toggleTabPin(tabId) {
  const tab = getTabById(tabId);
  if (!tab) return false;
  tab.pinned = !tab.pinned;
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('tab-pinned-updated', { tabId, pinned: tab.pinned });
  }
  return tab.pinned;
}

function duplicateTab(tabId) {
  const tab = getTabById(tabId);
  if (!tab) return null;
  return createTab(tab.url || '', tab.profile);
}

function closeOtherTabs(tabId) {
  // Get all tab IDs except the current one and pinned tabs, slice/copy to avoid array mutation issues during loop
  const tabsToClose = tabs.filter(t => t.id !== tabId && !t.pinned).map(t => t.id);
  tabsToClose.forEach(id => closeTab(id));
}

function buildMainWindowContextMenu() {
  return Menu.buildFromTemplate([
    { label: mainText('back'), click: () => { const tab = getActiveTab(); if (tab?.view?.webContents && !tab.view.webContents.isDestroyed()) tab.view.webContents.goBack(); } },
    { label: mainText('forward'), click: () => { const tab = getActiveTab(); if (tab?.view?.webContents && !tab.view.webContents.isDestroyed()) tab.view.webContents.goForward(); } },
    { label: mainText('reload'), click: () => { const tab = getActiveTab(); if (tab?.view?.webContents && !tab.view.webContents.isDestroyed()) tab.view.webContents.reload(); } },
    { type: 'separator' },
    { label: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.newTab'), click: () => createTab('', getActiveProfileName()) },
    { label: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.closeTab'), click: () => { const tab = getActiveTab(); if (tab) closeTab(tab.id); } }
  ]);
}

function buildTabContextMenu(tabId) {
  const tab = getTabById(tabId);
  if (!tab) return buildMainWindowContextMenu();

  const isPinned = !!tab.pinned;
  return Menu.buildFromTemplate([
    { label: mainText('back'), click: () => { if (tab?.view?.webContents && !tab.view.webContents.isDestroyed()) tab.view.webContents.goBack(); } },
    { label: mainText('forward'), click: () => { if (tab?.view?.webContents && !tab.view.webContents.isDestroyed()) tab.view.webContents.goForward(); } },
    { label: mainText('reload'), click: () => { if (tab?.view?.webContents && !tab.view.webContents.isDestroyed()) tab.view.webContents.reload(); } },
    { type: 'separator' },
    { label: NeutronI18n.t(neutronConfig.language || 'es', isPinned ? 'chrome.unpinTab' : 'chrome.pinTab'), click: () => toggleTabPin(tab.id) },
    { label: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.duplicateTab'), click: () => duplicateTab(tab.id) },
    { label: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.closeOtherTabs'), enabled: tabs.some(t => t.id !== tab.id && !t.pinned), click: () => closeOtherTabs(tab.id) },
    { label: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.discardTab'), enabled: !tab.discarded && tab.id !== activeTabId, click: () => discardTab(tab) },
    { type: 'separator' },
    { label: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.closeTab'), click: () => closeTab(tab.id) }
  ]);
}

// ? OPTIMIZATIONS: Low Consumption Profile � set BEFORE app is ready
app.commandLine.appendSwitch('js-flags', '--expose-gc --max-old-space-size=256');
app.commandLine.appendSwitch('renderer-process-limit', '4');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('enable-low-end-device-mode');
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let mainWindow;
let onboardingResolve = null; // Promise resolver for onboarding completion
let isSwitchingFromOnboarding = false; // Prevents app.quit() during onboarding ? main window transition
let tabs = [];
let activeTabId = null;
let sidebarVisible = true;
let overlayWebviewsHidden = false;
let CONFIG_PATH;
let SESSION_PATH;
const DEFAULT_CONFIG = {
  firstLaunch: true,
  searchEngine: 'google',
  smartHibernation: false,
  energySaver: false,
  telemetryBlock: false,
  doNotTrack: false,
  autoClearCookiesOnExit: false,
  autoClearCacheOnExit: false,
  disableWebRTC: false,
  forceDarkMode: false,
  density: 'comfortable',
  disableHardwareAcceleration: false,
  showHomeButton: true,
  showSidebar: true,
  verticalTabs: false,
  restoreSession: false,
  language: 'es',
  homeBackgroundPath: '',
  theme: 'dark',
  accentColor: '#8c8c8c'
};
let neutronConfig = { ...DEFAULT_CONFIG };

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  startpage: 'https://www.startpage.com/do/search?q='
};

const WHATSAPP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const DARK_MODE_CSS = `
  html { filter: invert(1) hue-rotate(180deg) !important; }
  img, video, canvas, picture, embed, object { filter: invert(1) hue-rotate(180deg) !important; }
`;

function initConfigPath() {
  CONFIG_PATH = path.join(app.getPath('userData'), 'neutron-config.json');
}

function initSessionPath() {
  SESSION_PATH = path.join(app.getPath('userData'), 'neutron-session.json');
}

function loadNeutronConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      neutronConfig = { ...DEFAULT_CONFIG, ...data };
    }
  } catch (e) {
    console.error('[Neutron] Config load error:', e.message);
  }
  sidebarVisible = neutronConfig.showSidebar !== false;
  applyNeutronConfig();
}

function saveNeutronConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(neutronConfig, null, 2), 'utf8');
  } catch (e) {
    console.error('[Neutron] Config save error:', e.message);
  }
}

function saveSessionSnapshot() {
  if (!neutronConfig.restoreSession || !SESSION_PATH) return;
  try {
    const meaningfulTabs = tabs.filter(tab => {
      const effectiveUrl = tab.discarded ? tab.savedUrl : tab.url;
      return effectiveUrl && !effectiveUrl.startsWith('about:') && tab.profile !== 'invitado';
    });
    const tabsPayload = meaningfulTabs.map(tab => ({
      url: tab.discarded ? (tab.savedUrl || tab.url || '') : (tab.url || ''),
      profile: tab.profile || 'default'
    }));

    if (tabsPayload.length === 0) return;

    const activeIndex = meaningfulTabs.findIndex(tab => tab.id === activeTabId);
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      activeIndex: activeIndex >= 0 ? activeIndex : 0,
      tabs: tabsPayload
    };

    fs.writeFileSync(SESSION_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (e) {
    console.error('[Session] Save error:', e.message);
  }
}

let sessionSaveTimer = null;
function scheduleSessionSnapshot() {
  if (!neutronConfig.restoreSession) return;
  clearTimeout(sessionSaveTimer);
  sessionSaveTimer = setTimeout(saveSessionSnapshot, 400);
}

function loadSessionSnapshot() {
  if (!SESSION_PATH || !fs.existsSync(SESSION_PATH)) return null;
  try {
    const raw = fs.readFileSync(SESSION_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !Array.isArray(data.tabs)) return null;
    return data;
  } catch (e) {
    console.error('[Session] Load error:', e.message);
    return null;
  }
}

function restoreSessionSnapshot() {
  if (!neutronConfig.restoreSession) return false;
  const data = loadSessionSnapshot();
  if (!data || !data.tabs.length) return false;

  const restoredIds = [];
  data.tabs.forEach(entry => {
    if (!entry || typeof entry.url !== 'string') return;
    if (!entry.url.startsWith('http://') && !entry.url.startsWith('https://') && !entry.url.startsWith('file://')) return;
    const tabId = createTab(entry.url, entry.profile || 'default');
    restoredIds.push(tabId);
  });

  if (!restoredIds.length) return false;

  const desiredIndex = Math.min(Math.max(Number(data.activeIndex) || 0, 0), restoredIds.length - 1);
  switchTab(restoredIds[desiredIndex]);
  return true;
}

function applyNeutronConfig() {
  if (neutronConfig.smartHibernation) {
    app.commandLine.appendSwitch('disable-background-timer-throttling');
    app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  }
}

const SIDEBAR_WIDTH = 60;
const TABS_RAIL_WIDTH = 230;
const TOOLBAR_HEIGHT = 75;

function isWebContentsAlive(wc) {
  return wc && !wc.isDestroyed();
}

function getActiveTab() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && isWebContentsAlive(tab.view?.webContents)) return tab;
  return null;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, 'assets', 'new-logo.ico'),
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  mainWindow.webContents.on('context-menu', (event, params) => {
    buildMainWindowContextMenu().popup({ window: mainWindow });
  });

  mainWindow.on('resize', () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      updateViewBounds(activeTab.view);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('enter-full-screen', () => {
    if (mainWindow && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('fullscreen-changed', true);
    }
  });

  mainWindow.on('leave-full-screen', () => {
    if (mainWindow && !mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('fullscreen-changed', false);
    }
  });
}

// ? ONBOARDING WINDOW - First Launch Setup
let onboardingWindow = null;

function createOnboardingWindow() {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.focus();
    return;
  }

  onboardingWindow = new BrowserWindow({
    width: 600,
    height: 620,
    minWidth: 600,
    minHeight: 620,
    frame: false,
    modal: true,
    show: false,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload-onboarding.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true,
      devTools: false
    }
  });

  onboardingWindow.loadFile(path.join(__dirname, 'ui', 'onboarding.html'));

  onboardingWindow.once('ready-to-show', () => {
    if (onboardingWindow && !onboardingWindow.isDestroyed()) {
      onboardingWindow.show();
      console.log('[??] Onboarding window shown');
    }
  });

  onboardingWindow.on('closed', () => {
    onboardingWindow = null;
    // Handle Alt+F4 / unexpected close: resolve promise with defaults so app doesn't hang
    if (typeof onboardingResolve === 'function') {
      console.log('[Onboarding] Window closed without completing � falling back to defaults');
      neutronConfig.firstLaunch = false;
      saveNeutronConfig();
      isSwitchingFromOnboarding = true;
      onboardingResolve({
        language: neutronConfig.language || 'es',
        theme: neutronConfig.theme || 'dark'
      });
      onboardingResolve = null;
    }
  });

  return onboardingWindow;
}

function updateViewBounds(view) {
  if (!view || !mainWindow) return;
  const leftInset = neutronConfig.verticalTabs ? TABS_RAIL_WIDTH : (sidebarVisible ? SIDEBAR_WIDTH : 0);
  const rightInset = neutronConfig.verticalTabs && sidebarVisible ? SIDEBAR_WIDTH : 0;
  const bounds = mainWindow.getContentBounds();
  view.setBounds({
    x: leftInset,
    y: TOOLBAR_HEIGHT,
    width: bounds.width - leftInset - rightInset,
    height: bounds.height - TOOLBAR_HEIGHT
  });
}

const registeredShieldPartitions = new Set();

function hideActiveWebview() {
  overlayWebviewsHidden = true;
  tabs.forEach(t => {
    if (t.view && mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.contentView.removeChildView(t.view);
      } catch (e) { }
    }
  });
}

function showActiveWebview() {
  overlayWebviewsHidden = false;
  if (activeTabId) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.view && !tab.view.webContents.isDestroyed()) {
      try {
        mainWindow.contentView.addChildView(tab.view);
        updateViewBounds(tab.view);
      } catch (e) { }
    }
  }
}

function createTab(url = null, profileId = null) {
  const tabId = Date.now().toString();
  const tabProfile = profileId || getActiveProfileName();
  const partition = getProfilePartition(tabProfile);

  if (!registeredShieldPartitions.has(partition)) {
    registerShieldForPartition(partition);
    registeredShieldPartitions.add(partition);
    if (neutronConfig.disableWebRTC) {
      try { session.fromPartition(partition).setWebRTCIPHandlingPolicy('disable_non_proxied_udp'); } catch (e) { }
    }
  }

  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      partition,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: true
    }
  });

  mainWindow.contentView.addChildView(view);

  const tab = { id: tabId, view, url, title: NeutronI18n.t(neutronConfig.language || 'es', 'chrome.loading'), profile: tabProfile, lastActive: Date.now(), hibernated: false, mediaPlaying: false, pinned: false, zoomLevel: 0, discarded: false, savedUrl: null, savedTitle: null };
  tabs.push(tab);

  if (tabProfile === 'invitado') guestTabCount++;

  // WebContents Event Listeners
  view.webContents.on('context-menu', (event, params) => {
    try {
      if (view.webContents.isDestroyed()) return;
      if (!params) params = { x: 0, y: 0 };

      const wc = view.webContents;
      const nav = wc.navigationHistory;
      const menu = Menu.buildFromTemplate([
        ...(nav.canGoBack() ? [{ label: mainText('back'), click: () => { if (!wc.isDestroyed()) nav.goBack(); } }] : []),
        ...(nav.canGoForward() ? [{ label: mainText('forward'), click: () => { if (!wc.isDestroyed()) nav.goForward(); } }] : []),
        ...(nav.canGoBack() || nav.canGoForward() ? [{ type: 'separator' }] : []),
        { label: mainText('reload'), click: () => { if (!wc.isDestroyed()) wc.reload(); } },
        { type: 'separator' },
        { label: mainText('copy'), role: 'copy' },
        { label: mainText('paste'), role: 'paste' },
        { label: mainText('selectAll'), role: 'selectAll' },
        ...(params.mediaType === 'image' ? [
          { type: 'separator' },
          { label: mainText('saveImageAs'), click: () => { wc.downloadURL(params.srcURL); } }
        ] : []),
        ...(params.linkURL ? [
          { type: 'separator' },
          { label: mainText('saveLinkAs'), click: () => { wc.downloadURL(params.linkURL); } }
        ] : []),
        { type: 'separator' },
        { label: mainText('inspectElement'), click: () => { if (!wc.isDestroyed()) wc.inspectElement(params.x, params.y); } }
      ]);
      menu.popup({ window: mainWindow });
    } catch (e) {
      console.error('[??? Context menu error:', e.message);
    }
  });

  view.webContents.on('will-navigate', (event, url) => {
    if (isShieldBlocked(url)) {
      SHIELD_CONFIG.blockedCount++;
      console.log(`[??? Shield] Blocked navigation: ${url}`);
      event.preventDefault();
    }
  });

  view.webContents.on('did-start-navigation', (event, navigationUrl, isInPlace, isMainFrame) => {
    if (isMainFrame) {
      tab.url = navigationUrl;
      tab.lastActive = Date.now();
      tab.hibernated = false;
      mainWindow.webContents.send('tab-url-changed', { tabId, url: navigationUrl });
      scheduleSessionSnapshot();
    }
  });

  view.webContents.on('page-title-updated', (event, title) => {
    tab.title = title;
    mainWindow.webContents.send('tab-title-changed', { tabId, title });
  });

  view.webContents.on('did-start-loading', () => {
    mainWindow.webContents.send('tab-loading-started', { tabId });
  });

  view.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.send('tab-loading-finished', { tabId });

    if (tabProfile !== 'invitado') {
      const url = view.webContents.getURL();
      const title = view.webContents.getTitle();
      if (url && !url.startsWith('file://') && !url.startsWith('about:')) {
        NeutronDB.recordVisit(url, title);
      }
    }

    if (neutronConfig.forceDarkMode) {
      applyDarkModeToTab(tab);
    }
  });

  view.webContents.on('media-started-playing', () => {
    tab.mediaPlaying = true;
    if (tab.id === activeTabId && neutronConfig.energySaver) {
      tab.view.webContents.setFrameRate(60);
    }
  });

  view.webContents.on('media-paused', () => {
    tab.mediaPlaying = false;
    if (tab.id === activeTabId && neutronConfig.energySaver) {
      tab.view.webContents.setFrameRate(30);
    }
  });

  // Open links with target="_blank" in a new tab instead of new window
  view.webContents.setWindowOpenHandler((details) => {
    mainWindow.webContents.send('open-new-tab-from-web', { url: details.url, profile: tabProfile });
    return { action: 'deny' };
  });

  // Load home page or external URL
  if (resolveSpecialUrl(view.webContents, url || '')) {
    // Special URL handled (e.g. neutron admin.task)
  } else if (url && url.startsWith('file://')) {
    try {
      const filePath = fileURLToPath(url);
      view.webContents.loadFile(filePath);
    } catch (e) {
      view.webContents.loadFile(path.join(__dirname, 'ui', 'home.html'));
    }
  } else if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    if (isShieldBlocked(url)) {
      SHIELD_CONFIG.blockedCount++;
      console.log(`[??? Shield] Blocked tab load: ${url}`);
      view.webContents.loadFile(path.join(__dirname, 'ui', 'home.html'));
    } else {
      view.webContents.loadURL(url);
    }
  } else {
    view.webContents.loadFile(path.join(__dirname, 'ui', 'home.html'));
  }

  // Notify UI
  mainWindow.webContents.send('tab-created', { tabId, url, title: tab.title, profile: tabProfile, pinned: tab.pinned });
  scheduleSessionSnapshot();
  switchTab(tabId);
  return tabId;
}

function switchTab(tabId) {
  activeTabId = tabId;
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    tab.lastActive = Date.now();
    if (tab.discarded) {
      restoreTab(tab);
    }
  }
  tabs.forEach(t => {
    if (!t.view || t.view.webContents.isDestroyed()) return;

    if (t.id === tabId) {
      mainWindow.contentView.addChildView(t.view);
      updateViewBounds(t.view);
      t.view.webContents.focus();
      wakeTab(t);
      if (neutronConfig.energySaver && !t.mediaPlaying) {
        t.view.webContents.setFrameRate(30);
      }
    } else {
      mainWindow.contentView.removeChildView(t.view);
      t.view.webContents.setFrameRate(2);
    }
  });
  if (mainWindow && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('tab-switched', { tabId, profile: tab?.profile || 'default' });
  }
}

function closeTab(tabId, force = false) {
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;

  const tab = tabs[index];
  if (tab.pinned && !force) return; // Prevent closing pinned tabs unless forced

  if (tab.profile === 'invitado') {
    guestTabCount--;
    if (guestTabCount <= 0) {
      guestTabCount = 0;
      cleanupGuestSession();
    }
  }

  if (tab.view && tab.view.webContents && !tab.view.webContents.isDestroyed()) {
    tab.view.webContents.stop();
    tab.view.webContents.setAudioMuted(true);
    tab.view.webContents.loadURL('about:blank').catch(() => { });
  }
  try { mainWindow?.contentView?.removeChildView(tab.view); } catch (e) { }
  if (tab.view && tab.view.webContents && !tab.view.webContents.isDestroyed()) {
    tab.view.webContents.close();
  }
  tab.view = null;
  tabs.splice(index, 1);
  mainWindow.webContents.send('tab-closed', { tabId });
  scheduleSessionSnapshot();

  if (activeTabId === tabId) {
    if (tabs.length > 0) {
      const nextActiveIndex = Math.min(index, tabs.length - 1);
      switchTab(tabs[nextActiveIndex].id);
    } else {
      mainWindow.close();
    }
  }

  if (global.gc) {
    setTimeout(() => global.gc(), 500);
  }
}

// IPC Receivers for UI Communication
ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.on('window-close', () => mainWindow && mainWindow.close());

// Fullscreen
ipcMain.on('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

// DevTools
ipcMain.on('toggle-devtools', () => {
  const tab = getActiveTab();
  if (tab && tab.view && tab.view.webContents && !tab.view.webContents.isDestroyed()) {
    tab.view.webContents.toggleDevTools();
  }
});

// Zoom
ipcMain.on('zoom-in', () => { const t = getActiveTab(); if (t) zoomIn(t.id); });
ipcMain.on('zoom-out', () => { const t = getActiveTab(); if (t) zoomOut(t.id); });
ipcMain.on('zoom-reset', () => { const t = getActiveTab(); if (t) zoomReset(t.id); });

// Tab discard
ipcMain.on('discard-tab', (event, tabId) => {
  const tab = getTabById(tabId);
  if (tab) discardTab(tab);
});

ipcMain.on('create-tab', (event, { url, profile }) => createTab(url, profile));
ipcMain.on('switch-tab', (event, tabId) => switchTab(tabId));
ipcMain.on('close-tab', (event, tabId) => closeTab(tabId));
ipcMain.on('close-current-tab', (event) => {
  const tab = tabs.find(t => t.view && t.view.webContents && t.view.webContents === event.sender);
  if (tab) closeTab(tab.id);
});

ipcMain.on('clear-atomic-partition', async () => {
  try {
    const atomicSession = session.fromPartition('persist:atomic-mode');
    await atomicSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage']
    });
    console.log('[?? Atomic] Partition cleared');
  } catch (e) {
    console.error('[?? Atomic] Clear error:', e.message);
  }
});

function broadcastShieldStats() {
  const count = SHIELD_CONFIG.blockedCount || 0;
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.webContents.isDestroyed()) w.webContents.send('shield-stats-updated', count);
  });
}

function resolveSpecialUrl(webContents, urlStr) {
  const cleanUrl = urlStr.trim().toLowerCase();
  if (cleanUrl === 'neutron admin.task' || cleanUrl === 'neutron:admin.task' || cleanUrl === 'neutron://admin.task') {
    webContents.loadFile(path.join(__dirname, 'ui', 'task-manager.html')).catch(() => {});
    return true;
  }
  return false;
}

ipcMain.on('navigate-to', (event, url) => {
  const tab = getActiveTab();
  if (!tab) return;

  const targetUrlStr = url.trim();
  if (resolveSpecialUrl(tab.view.webContents, targetUrlStr)) {
    return;
  }

  let targetUrl = targetUrlStr;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
      targetUrl = 'https://' + targetUrl;
    } else {
      const engine = neutronConfig.searchEngine || 'google';
      targetUrl = SEARCH_ENGINES[engine] + encodeURIComponent(targetUrl);
    }
  }

  if (isShieldBlocked(targetUrl)) {
    SHIELD_CONFIG.blockedCount++;
    console.log(`[??? Shield] Blocked navigation: ${targetUrl}`);
    broadcastShieldStats();
    return;
  }

  if (!tab.view.webContents.isDestroyed()) tab.view.webContents.loadURL(targetUrl);
});

ipcMain.on('go-home', () => {
  const tab = getActiveTab();
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  tab.view.webContents.loadFile(path.join(__dirname, 'ui', 'home.html'));
});

ipcMain.handle('select-background', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select home background',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return '';
  return result.filePaths[0];
});

ipcMain.on('search-query', (event, query) => {
  const tab = getActiveTab();
  if (!tab) return;

  const q = query.trim();
  if (resolveSpecialUrl(tab.view.webContents, q)) {
    return;
  }

  let targetUrl;
  if (q.startsWith('http://') || q.startsWith('https://')) {
    targetUrl = q;
  } else if (q.includes('.') && !q.includes(' ')) {
    targetUrl = 'https://' + q;
  } else {
    const engine = neutronConfig.searchEngine || 'google';
    targetUrl = SEARCH_ENGINES[engine] + encodeURIComponent(q);
  }

  if (isShieldBlocked(targetUrl)) {
    SHIELD_CONFIG.blockedCount++;
    console.log(`[??? Shield] Blocked search: ${targetUrl}`);
    broadcastShieldStats();
    return;
  }

  if (!tab.view.webContents.isDestroyed()) tab.view.webContents.loadURL(targetUrl);
});

ipcMain.on('go-back', () => {
  const tab = getActiveTab();
  if (tab && tab.view.webContents.navigationHistory.canGoBack()) {
    tab.view.webContents.navigationHistory.goBack();
  }
});

ipcMain.on('go-forward', () => {
  const tab = getActiveTab();
  if (tab && tab.view.webContents.navigationHistory.canGoForward()) {
    tab.view.webContents.navigationHistory.goForward();
  }
});

ipcMain.on('reload', () => {
  const tab = getActiveTab();
  if (tab) {
    tab.view.webContents.reload();
  }
});

ipcMain.on('clear-memory', () => {
  const allPartitions = new Set(['default']);
  tabs.forEach(t => allPartitions.add(getProfilePartition(t.profile)));

  Promise.all([...allPartitions].map(p => {
    const sess = p === 'default' ? session.defaultSession : session.fromPartition(p);
    return sess.clearCache();
  })).then(() => {
    if (global.gc) global.gc();
    mainWindow.webContents.send('memory-cleared');
  });
});

ipcMain.on('panic-mode', () => {
  tabs.forEach(t => {
    if (t.view && t.view.webContents && !t.view.webContents.isDestroyed()) {
      t.view.webContents.setAudioMuted(true);
    }
  });
  if (mainWindow) mainWindow.minimize();
});

// ? ONBOARDING COMPLETION HANDLER
ipcMain.on('onboarding-complete', (event, config) => {
  console.log('[??] Onboarding completed with config:', config);

  if (!config || typeof config !== 'object') {
    console.warn('[??] Invalid onboarding config:', config);
    return;
  }

  // Update neutronConfig with onboarding selections
  if (config.language) {
    neutronConfig.language = config.language;
  }
  if (config.theme) {
    neutronConfig.theme = config.theme;
  }

  // Mark first launch as complete
  neutronConfig.firstLaunch = false;

  // Save configuration
  saveNeutronConfig();
  console.log('[??] Configuration saved:', { language: neutronConfig.language, theme: neutronConfig.theme, firstLaunch: neutronConfig.firstLaunch });

  // Resolve the onboarding promise FIRST so app.whenReady() can create mainWindow
  if (typeof onboardingResolve === 'function') {
    console.log('[??] Resolving onboarding promise � letting app.whenReady() create main window');
    onboardingResolve(config);
    onboardingResolve = null;
  }

  // Set flag so window-all-closed doesn't kill the app during transition
  isSwitchingFromOnboarding = true;

  // Destroy onboarding window AFTER resolving promise and setting flag
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.destroy();
    console.log('[??] Onboarding window destroyed');
  }
});

ipcMain.on('sidebar-toggle', (event, visible) => {
  sidebarVisible = visible;
  tabs.forEach(t => {
    if (isWebContentsAlive(t.view?.webContents)) updateViewBounds(t.view);
  });
});

ipcMain.on('save-settings', (event, settings) => {
  neutronConfig = { ...neutronConfig, ...settings };
  saveNeutronConfig();
  sendSettingsToRenderer();

  if (settings.forceDarkMode !== undefined) {
    applyDarkModeToAllTabs();
  }

  if (settings.disableWebRTC !== undefined) {
    applyWebRTCConfig();
  }

  if (settings.telemetryBlock !== undefined) {
    SHIELD_CONFIG.blockTelemetry = settings.telemetryBlock;
    saveShieldConfig();
    rebuildShieldSets();
  }

  if (settings.smartHibernation !== undefined) {
    if (settings.smartHibernation) {
      startHibernationTimer();
    } else {
      stopHibernationTimer();
    }
  }

  if (settings.energySaver !== undefined) {
    applyEnergySaverToTabs();
  }

  if (settings.showSidebar !== undefined) {
    sidebarVisible = settings.showSidebar;
    tabs.forEach(t => {
      if (isWebContentsAlive(t.view?.webContents)) updateViewBounds(t.view);
    });
  }

  if (settings.verticalTabs !== undefined) {
    tabs.forEach(t => {
      if (isWebContentsAlive(t.view?.webContents)) updateViewBounds(t.view);
    });
  }

  if (settings.homeBackgroundPath !== undefined) {
    tabs.forEach(tab => {
      if (tab.view && !tab.view.webContents.isDestroyed()) {
        tab.view.webContents.send('home-background-changed', settings.homeBackgroundPath);
      }
    });
  }

  if (settings.theme !== undefined || settings.accentColor !== undefined) {
    broadcastTheme();
  }

  if (settings.restoreSession !== undefined) {
    if (settings.restoreSession) {
      scheduleSessionSnapshot();
    } else if (SESSION_PATH && fs.existsSync(SESSION_PATH)) {
      try {
        fs.unlinkSync(SESSION_PATH);
      } catch (e) {
        console.error('[Session] Remove error:', e.message);
      }
    }
  }

  if (settings.disableWebRTC !== undefined || settings.disableHardwareAcceleration !== undefined || settings.doNotTrack !== undefined) {
    mainWindow.webContents.send('restart-requested', settings);
  }
});

ipcMain.on('request-restart', () => {
  app.relaunch();
  app.quit();
});

ipcMain.handle('hide-active-webview', () => {
  hideActiveWebview();
});

ipcMain.handle('show-active-webview', () => {
  showActiveWebview();
});

ipcMain.handle('load-settings', () => {
  return { ...neutronConfig, appVersion: app.getVersion() };
});

ipcMain.handle('purge-memory', async () => {
  const metricsBefore = app.getAppMetrics();
  const totalKbBefore = metricsBefore.reduce((sum, m) => sum + m.memory.workingSetSize, 0);
  const mbBefore = Math.round(totalKbBefore / 1024);

  await session.defaultSession.clearCache();
  await session.defaultSession.clearStorageData({
    storages: ['appcache', 'cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
  });

  const allSessions = new Set();
  tabs.forEach(t => {
    const partition = getProfilePartition(t.profile);
    allSessions.add(partition);
  });
  for (const partition of allSessions) {
    try {
      const sess = session.fromPartition(partition);
      await sess.clearCache();
      await sess.clearStorageData({
        storages: ['appcache', 'cookies', 'indexdb', 'localstorage', 'serviceworkers', 'cachestorage']
      });
    } catch (e) { }
  }

  tabs.forEach(t => {
    if (!t.view || t.view.webContents.isDestroyed()) return;
    if (t.id !== activeTabId) {
      t.view.webContents.setFrameRate(1);
      t.view.webContents.setAudioMuted(true);
    }
  });

  SHIELD_CONFIG.blockedCount = 0;

  if (global.gc) global.gc();
  if (global.gc) global.gc();

  const metricsAfter = app.getAppMetrics();
  const totalKbAfter = metricsAfter.reduce((sum, m) => sum + m.memory.workingSetSize, 0);
  const mbAfter = Math.round(totalKbAfter / 1024);
  const freed = mbBefore - mbAfter;

  return {
    before: mbBefore,
    after: mbAfter,
    freed: freed > 0 ? freed : 0,
    tabs: tabs.length,
    sessionsCleared: allSessions.size + 1
  };
});

function applyDarkModeToTab(tab) {
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  if (neutronConfig.forceDarkMode) {
    tab.view.webContents.insertCSS(DARK_MODE_CSS).then((cssId) => {
      tab.darkModeCssId = cssId;
    }).catch(() => {});
  }
}

function removeDarkModeFromTab(tab) {
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  if (tab.darkModeCssId) {
    tab.view.webContents.removeInsertedCSS(tab.darkModeCssId).catch(() => {});
    tab.darkModeCssId = null;
  }
}

function applyDarkModeToAllTabs() {
  if (neutronConfig.forceDarkMode) {
    tabs.forEach(t => applyDarkModeToTab(t));
  } else {
    tabs.forEach(t => removeDarkModeFromTab(t));
  }
}

function sendSettingsToRenderer() {
  const config = { ...neutronConfig };
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.webContents.isDestroyed()) {
      w.webContents.send('settings-updated', config);
    }
  });
}

function broadcastTheme() {
  const payload = { theme: neutronConfig.theme, accentColor: neutronConfig.accentColor };
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.webContents.isDestroyed()) w.webContents.send('theme-changed', payload);
  });
  tabs.forEach(tab => {
    if (tab.view && !tab.view.webContents.isDestroyed()) {
      tab.view.webContents.send('theme-changed', payload);
    }
  });
}

function applyWebRTCConfig() {
  if (!neutronConfig.disableWebRTC) return;
  const policy = 'disable_non_proxied_udp';
  try {
    session.defaultSession.setWebRTCIPHandlingPolicy(policy);
  } catch (e) { }
  const partitions = new Set();
  tabs.forEach(t => partitions.add(getProfilePartition(t.profile)));
  partitions.forEach(p => {
    try {
      session.fromPartition(p).setWebRTCIPHandlingPolicy(policy);
    } catch (e) { }
  });
}

// =====================================================================
// ?? ZOOM
// =====================================================================

const ZOOM_LEVELS = [-4, -3, -2, -1, 0, 1, 2, 3, 4]; // maps to setZoomLevel values

function zoomIn(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  const nextZoom = Math.min(tab.zoomLevel + 1, ZOOM_LEVELS.length - 1);
  if (nextZoom !== tab.zoomLevel) {
    tab.zoomLevel = nextZoom;
    tab.view.webContents.setZoomLevel(ZOOM_LEVELS[nextZoom]);
    broadcastZoomLevel(tabId, ZOOM_LEVELS[nextZoom]);
  }
}

function zoomOut(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  const nextZoom = Math.max(tab.zoomLevel - 1, 0);
  if (nextZoom !== tab.zoomLevel) {
    tab.zoomLevel = nextZoom;
    tab.view.webContents.setZoomLevel(ZOOM_LEVELS[nextZoom]);
    broadcastZoomLevel(tabId, ZOOM_LEVELS[nextZoom]);
  }
}

function zoomReset(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  const defaultIdx = ZOOM_LEVELS.indexOf(0);
  if (tab.zoomLevel !== defaultIdx) {
    tab.zoomLevel = defaultIdx;
    tab.view.webContents.setZoomLevel(0);
    broadcastZoomLevel(tabId, 0);
  }
}

function broadcastZoomLevel(tabId, level) {
  if (mainWindow && !mainWindow.webContents.isDestroyed()) {
    const pct = Math.round((1 + level * 0.25) * 100);
    mainWindow.webContents.send('zoom-changed', { tabId, level, percent: pct });
  }
}

// =====================================================================
// ??? TAB DISCARDING
// =====================================================================

function discardTab(tab) {
  if (!tab || !tab.view || tab.view.webContents.isDestroyed() || tab.discarded || tab.id === activeTabId) return;
  tab.savedUrl = tab.url;
  tab.savedTitle = tab.title;
  tab.discarded = true;
  // Only throttle + mute. No contentView manipulation, no setVisible, no setBounds.
  // switchTab handles contentView add/remove as usual.
  tab.view.webContents.setFrameRate(1);
  tab.view.webContents.setAudioMuted(true);
  if (mainWindow && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('tab-discarded', { tabId: tab.id, url: tab.savedUrl, title: tab.savedTitle });
  }
  console.log(`[??? Discard] Tab ${tab.id} discarded`);
}

function restoreTab(tab) {
  if (!tab || !tab.view || tab.view.webContents.isDestroyed() || !tab.discarded) return;
  tab.discarded = false;
  // Just restore speed + audio. switchTab handles addChildView + bounds + focus + wakeTab.
  tab.view.webContents.setFrameRate(60);
  tab.view.webContents.setAudioMuted(false);
  tab.savedUrl = null;
  tab.savedTitle = null;
  if (mainWindow && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('tab-restored', { tabId: tab.id });
  }
  console.log(`[??? Discard] Tab ${tab.id} restored`);
}

// =====================================================================
// ?? SMART HIBERNATION
// =====================================================================

let hibernationTimer = null;

function getHibernationTimeout() {
  return neutronConfig.energySaver ? 2 * 60 * 1000 : 5 * 60 * 1000;
}

function hibernateTab(tab) {
  if (!tab || !tab.view || tab.view.webContents.isDestroyed() || tab.hibernated) return;
  tab.hibernated = true;
  tab.view.webContents.setFrameRate(1);
  tab.view.webContents.setAudioMuted(true);
  tab.view.setVisible(false);
  console.log(`[?? Hibernation] Tab ${tab.id} hibernated`);
}

function wakeTab(tab) {
  if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return;
  tab.hibernated = false;
  tab.view.setVisible(true);
  tab.view.webContents.setFrameRate(60);
  tab.view.webContents.setAudioMuted(false);
}

function runHibernationCheck() {
  if (!neutronConfig.smartHibernation) return;
  const timeout = getHibernationTimeout();
  const now = Date.now();
  tabs.forEach(t => {
    if (t.id === activeTabId || t.hibernated) return;
    if (now - t.lastActive > timeout) {
      hibernateTab(t);
    }
  });
}

function startHibernationTimer() {
  stopHibernationTimer();
  hibernationTimer = setInterval(runHibernationCheck, 60000);
  console.log('[?? Hibernation] Timer started');
}

function stopHibernationTimer() {
  if (hibernationTimer) {
    clearInterval(hibernationTimer);
    hibernationTimer = null;
    console.log('[?? Hibernation] Timer stopped');
  }
}

// =====================================================================
// ? ENERGY SAVER
// =====================================================================

function applyEnergySaverToTabs() {
  const active = neutronConfig.energySaver;
  sendSettingsToRenderer();
  tabs.forEach(t => {
    if (!t.view || t.view.webContents.isDestroyed()) return;
    if (t.id === activeTabId) {
      if (active && !t.mediaPlaying) {
        t.view.webContents.setFrameRate(30);
      } else {
        t.view.webContents.setFrameRate(60);
      }
    }
  });
  console.log(`[? Energy Saver] ${active ? 'ON' : 'OFF'} � applied to ${tabs.length} tabs`);
}

// =====================================================================
// ?? LOCAL HISTORY SUGGESTIONS
// =====================================================================

ipcMain.on('get-local-suggestions', (event, query) => {
  const results = NeutronDB.searchHistory(query);
  event.reply('local-suggestions-results', results);
});

ipcMain.handle('get-history', () => {
  return NeutronDB.getHistory();
});

ipcMain.on('delete-history-entry', (event, url) => {
  NeutronDB.deleteEntry(url);
});

ipcMain.on('clear-history', () => {
  NeutronDB.clearHistory();
});

// =====================================================================
// ? FAVORITES
// =====================================================================

let favoritesWindow = null;

// =====================================================================
// ?? BOOKMARKS MANAGER (sidebar + home + fav)
// =====================================================================

let BOOKMARKS_PATH;
const DEFAULT_BOOKMARKS = {
  sidebar: [
    { url: 'https://discord.com', title: 'Discord', domain: 'discord.com', added_at: new Date().toISOString() },
    { url: 'https://www.twitch.tv', title: 'Twitch', domain: 'www.twitch.tv', added_at: new Date().toISOString() },
    { url: 'https://gemini.google.com', title: 'Gemini', domain: 'gemini.google.com', added_at: new Date().toISOString() },
    { url: 'https://open.spotify.com', title: 'Spotify', domain: 'open.spotify.com', added_at: new Date().toISOString() }
  ],
  home: [
    { url: 'https://www.youtube.com', title: 'YouTube', domain: 'www.youtube.com', added_at: new Date().toISOString() },
    { url: 'https://github.com', title: 'GitHub', domain: 'github.com', added_at: new Date().toISOString() }
  ],
  fav: []
};
let bookmarksData;

function initBookmarksPath() {
  BOOKMARKS_PATH = path.join(app.getPath('userData'), 'neutron-bookmarks.json');
}

function loadBookmarks() {
  initBookmarksPath();
  bookmarksData = { sidebar: [], home: [], fav: [] };
  try {
    if (fs.existsSync(BOOKMARKS_PATH)) {
      const data = JSON.parse(fs.readFileSync(BOOKMARKS_PATH, 'utf8'));
      bookmarksData.sidebar = data.sidebar || [];
      bookmarksData.home = data.home || [];
      bookmarksData.fav = data.fav || [];
    }
  } catch (e) {
    bookmarksData = { sidebar: [], home: [], fav: [] };
  }
  migrateFavorites();
}

function migrateFavorites() {
  const oldFavPath = path.join(app.getPath('userData'), 'neutron-favorites.json');
  try {
    if (fs.existsSync(oldFavPath)) {
      const oldData = JSON.parse(fs.readFileSync(oldFavPath, 'utf8'));
      if (Array.isArray(oldData) && oldData.length > 0) {
        const existingUrls = new Set(bookmarksData.fav.map(b => b.url));
        oldData.forEach(f => {
          if (!existingUrls.has(f.url)) {
            bookmarksData.fav.push({
              url: f.url,
              title: f.title || '',
              domain: extractDomain(f.url),
              added_at: f.added_at || new Date().toISOString()
            });
            existingUrls.add(f.url);
          }
        });
        saveBookmarks();
        fs.unlinkSync(oldFavPath);
        console.log('[Bookmarks] Migrated', oldData.length, 'favorites');
      }
    }
  } catch (e) { }
  if (bookmarksData.sidebar.length === 0 && bookmarksData.home.length === 0 && bookmarksData.fav.length === 0) {
    bookmarksData = DEFAULT_BOOKMARKS;
    saveBookmarks();
  }
}

function saveBookmarks() {
  try {
    fs.writeFileSync(BOOKMARKS_PATH, JSON.stringify(bookmarksData, null, 2), 'utf8');
  } catch (e) {
    console.error('[Bookmarks] Save error:', e.message);
  }
}

function broadcastBookmarks() {
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.webContents.isDestroyed()) {
      w.webContents.send('bookmarks-updated', bookmarksData);
    }
  });
  tabs.forEach(tab => {
    if (tab.view && !tab.view.webContents.isDestroyed()) {
      tab.view.webContents.send('bookmarks-updated', bookmarksData);
    }
  });
}

ipcMain.handle('get-bookmarks', () => bookmarksData);

ipcMain.on('add-bookmark', (event, { type, url, title }) => {
  try {
    if (!url || !bookmarksData || !bookmarksData[type]) return;
    const domain = extractDomain(url);
    const existing = bookmarksData[type].find(b => b.url === url);
    if (!existing) {
      bookmarksData[type].push({ url, title: title || '', domain, added_at: new Date().toISOString() });
      saveBookmarks();
      broadcastBookmarks();
    }
  } catch (e) {
    console.error('[Bookmarks] add-bookmark error:', e.message);
  }
});

ipcMain.on('remove-bookmark', (event, { type, url }) => {
  if (!bookmarksData[type]) return;
  bookmarksData[type] = bookmarksData[type].filter(b => b.url !== url);
  saveBookmarks();
  broadcastBookmarks();
});

// Keep old favorites IPC for favorites.html backward compat
ipcMain.handle('get-favorites', () => bookmarksData.fav);
ipcMain.on('add-favorite', (event, data) => {
  const domain = extractDomain(data.url);
  const existing = bookmarksData.fav.find(b => b.url === data.url);
  if (!existing) {
    bookmarksData.fav.push({ url: data.url, title: data.title || '', domain, added_at: new Date().toISOString() });
    saveBookmarks();
    broadcastBookmarks();
  }
});
ipcMain.on('remove-favorite', (event, url) => {
  bookmarksData.fav = bookmarksData.fav.filter(b => b.url !== url);
  saveBookmarks();
  broadcastBookmarks();
});
ipcMain.handle('is-favorite', (event, url) => bookmarksData.fav.some(b => b.url === url));

ipcMain.on('open-favorites-window', () => {
  if (favoritesWindow && !favoritesWindow.isDestroyed()) {
    favoritesWindow.focus();
    return;
  }

  favoritesWindow = new BrowserWindow({
    width: 420,
    height: 600,
    minHeight: 300,
    minWidth: 350,
    frame: true,
    backgroundColor: '#131314',
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  favoritesWindow.loadFile(path.join(__dirname, 'ui', 'favorites.html'));
  favoritesWindow.setMenuBarVisibility(false);

  favoritesWindow.on('closed', () => { favoritesWindow = null; });
});

ipcMain.on('close-favorites-window', () => {
  if (favoritesWindow && !favoritesWindow.isDestroyed()) {
    favoritesWindow.close();
  }
});

// =====================================================================
// ?? LOCAL SYNC
// =====================================================================

function buildSyncPayload() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: neutronConfig,
    profiles: profilesData,
    bookmarks: bookmarksData,
    history: NeutronDB.getHistory()
  };
}

function applyImportedState(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid sync payload');
  }

  if (payload.config && typeof payload.config === 'object') {
    neutronConfig = { ...DEFAULT_CONFIG, ...payload.config };
    sidebarVisible = neutronConfig.showSidebar !== false;
    saveNeutronConfig();
    applyNeutronConfig();
    if (neutronConfig.forceDarkMode !== undefined) applyDarkModeToAllTabs();
    if (neutronConfig.disableWebRTC !== undefined) applyWebRTCConfig();
    sendSettingsToRenderer();
    broadcastTheme();
  }

  if (payload.profiles && typeof payload.profiles === 'object') {
    profilesData = {
      lastUsed: payload.profiles.lastUsed || 'default',
      profiles: Array.isArray(payload.profiles.profiles) ? payload.profiles.profiles : [{ id: 'default', name: 'Default', color: '#8c8c8c' }]
    };
    ensureDefaultProfile();
    saveProfiles();
    if (!profilesData.profiles.some(p => p.id === activeProfile)) {
      activeProfile = profilesData.lastUsed || 'default';
    }
    broadcastProfiles();
  }

  if (payload.bookmarks && typeof payload.bookmarks === 'object') {
    bookmarksData = {
      sidebar: Array.isArray(payload.bookmarks.sidebar) ? payload.bookmarks.sidebar : [],
      home: Array.isArray(payload.bookmarks.home) ? payload.bookmarks.home : [],
      fav: Array.isArray(payload.bookmarks.fav) ? payload.bookmarks.fav : []
    };
    saveBookmarks();
    broadcastBookmarks();
  }

  if (Array.isArray(payload.history)) {
    NeutronDB.replaceHistory(payload.history);
  }
}

ipcMain.handle('export-local-data', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Neutron data',
    defaultPath: 'neutron-backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return { cancelled: true };

  fs.writeFileSync(result.filePath, JSON.stringify(buildSyncPayload(), null, 2), 'utf8');
  return { success: true, filePath: result.filePath };
});

ipcMain.handle('import-local-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Neutron data',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return { cancelled: true };

  const raw = fs.readFileSync(result.filePaths[0], 'utf8');
  const payload = JSON.parse(raw);
  applyImportedState(payload);
  return { success: true, filePath: result.filePaths[0] };
});

// =====================================================================
// ?? PROFILES & SESSIONS
// =====================================================================

let PROFILES_PATH;
let profilesData = { lastUsed: null, profiles: [{ id: 'default', name: 'Default', color: '#8c8c8c', photo: '' }] };
let activeProfile = null;
const GUEST_PARTITION = 'persist:invitado';
let guestTabCount = 0;

function ensureDefaultProfile() {
  if (!profilesData.profiles.some(p => p.id === 'default')) {
    profilesData.profiles.unshift({ id: 'default', name: 'Default', color: '#8c8c8c', photo: '' });
  }
}

function initProfilesPath() {
  PROFILES_PATH = path.join(app.getPath('userData'), 'neutron-profiles.json');
}

function loadProfiles() {
  try {
    if (fs.existsSync(PROFILES_PATH)) {
      const data = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
      profilesData = { ...profilesData, ...data };
    }
  } catch (e) {
    console.error('[Profiles] Load error:', e.message);
  }
  ensureDefaultProfile();
}

function saveProfiles() {
  try {
    ensureDefaultProfile();
    fs.writeFileSync(PROFILES_PATH, JSON.stringify(profilesData, null, 2), 'utf8');
  } catch (e) {
    console.error('[Profiles] Save error:', e.message);
  }
}

function broadcastProfiles() {
  const payload = { profiles: profilesData.profiles, lastUsed: profilesData.lastUsed, activeProfile };
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.webContents.isDestroyed()) {
      w.webContents.send('profiles-updated', payload);
    }
  });
}

function setActiveProfile(profileId) {
  if (profileId === 'invitado') {
    activeProfile = 'invitado';
    return;
  }
  const profile = profilesData.profiles.find(p => p.id === profileId);
  if (profile) {
    activeProfile = profileId;
    profilesData.lastUsed = profileId;
    saveProfiles();
  }
}

function getProfilePartition(profileId) {
  if (profileId === 'invitado') return GUEST_PARTITION;
  return `persist:${profileId || 'neutron_profile'}`;
}

function getActiveProfileName() {
  return activeProfile || 'default';
}

async function cleanupGuestSession() {
  try {
    const guestSession = session.fromPartition(GUEST_PARTITION);
    await guestSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage']
    });
    console.log('[?? Guest] Session cleared');
  } catch (e) {
    console.error('[?? Guest] Cleanup error:', e.message);
  }
}

ipcMain.handle('get-profiles', () => {
  return { profiles: profilesData.profiles, lastUsed: profilesData.lastUsed, activeProfile };
});

ipcMain.on('select-profile', (event, profileId) => {
  const oldProfile = activeProfile;
  setActiveProfile(profileId);

  const oldTabs = tabs.filter(t => t.profile === oldProfile);
  oldTabs.forEach(t => {
    if (t.profile === 'invitado') guestTabCount--;
    t.view.webContents.stop();
    t.view.webContents.setAudioMuted(true);
    t.view.webContents.loadURL('about:blank').catch(() => {});
    mainWindow.contentView.removeChildView(t.view);
    t.view.webContents.close();
    t.view = null;
  });
  tabs = tabs.filter(t => t.profile !== oldProfile);

  if (oldProfile === 'invitado') {
    guestTabCount = 0;
    cleanupGuestSession();
  }

  createTab(null, profileId);
  mainWindow.webContents.send('profile-selected', { profileId });
});

ipcMain.on('create-profile', (event, data) => {
  if (profilesData.profiles.find(p => p.id === data.id)) return;
  profilesData.profiles.push({ id: data.id, name: data.name, color: data.color || '#8c8c8c' });
  saveProfiles();
  setActiveProfile(data.id);
  createTab(null, data.id);
  mainWindow.webContents.send('profile-selected', { profileId: data.id });
  broadcastProfiles();
});

ipcMain.on('update-profile', (event, data) => {
  if (!data || !data.id) return;
  const profile = profilesData.profiles.find(p => p.id === data.id);
  if (!profile) return;
  if (data.name !== undefined) profile.name = data.name || profile.name;
  if (data.color !== undefined) profile.color = data.color || profile.color || '#8c8c8c';
  if (data.photo !== undefined) profile.photo = data.photo;
  saveProfiles();
  broadcastProfiles();
  if (activeProfile === data.id) {
    mainWindow.webContents.send('profile-selected', { profileId: data.id });
  }
});

ipcMain.on('delete-profile', (event, profileId) => {
  if (profileId === 'default') return;
  profilesData.profiles = profilesData.profiles.filter(p => p.id !== profileId);
  if (profilesData.lastUsed === profileId) profilesData.lastUsed = 'default';
  if (activeProfile === profileId) activeProfile = 'default';
  saveProfiles();
  mainWindow.webContents.send('profile-deleted', { profileId });
  broadcastProfiles();
});

ipcMain.handle('select-profile-photo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select profile photo',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  try {
    const data = fs.readFileSync(result.filePaths[0]);
    const ext = path.extname(result.filePaths[0]).slice(1).toLowerCase();
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${data.toString('base64')}`;
  } catch (e) {
    return null;
  }
});

ipcMain.on('start-guest', () => {
  const oldProfile = activeProfile;

  const nonGuestTabs = tabs.filter(t => t.profile !== 'invitado');
  nonGuestTabs.forEach(t => {
    t.view.webContents.stop();
    t.view.webContents.setAudioMuted(true);
    t.view.webContents.loadURL('about:blank').catch(() => {});
    mainWindow.contentView.removeChildView(t.view);
    t.view.webContents.close();
    t.view = null;
  });
  tabs = tabs.filter(t => t.profile === 'invitado');

  guestTabCount = 0;
  activeProfile = 'invitado';
  createTab(null, 'invitado');
  mainWindow.webContents.send('profile-selected', { profileId: 'invitado' });
});

// =====================================================================
// ?? DOWNLOAD MANAGER
// =====================================================================

const activeDownloads = new Map();
let downloadsWindow = null;
let shortcutWindow = null;

function openShortcutWindow(kind) {
  if (shortcutWindow && !shortcutWindow.isDestroyed()) {
    shortcutWindow.focus();
    return;
  }

  shortcutWindow = new BrowserWindow({
    width: 400,
    height: 280,
    parent: mainWindow,
    modal: true,
    frame: false,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  shortcutWindow.loadFile(path.join(__dirname, 'ui', 'sidebar-shortcut.html'), {
    query: { context: kind }
  });

  shortcutWindow.setMenuBarVisibility(false);

  shortcutWindow.on('closed', () => {
    shortcutWindow = null;
  });
}

function closeShortcutWindow(kind) {
  if (shortcutWindow && !shortcutWindow.isDestroyed()) {
    shortcutWindow.close();
  }
}

function broadcastToDownloads(channel, data) {
  if (downloadsWindow && !downloadsWindow.isDestroyed() && downloadsWindow.webContents) {
    downloadsWindow.webContents.send(channel, data);
  }
}

function initDownloadManager() {
  function registerSessionListener(sess) {
    sess.on('will-download', (event, item, webContents) => {
      const downloadId = Date.now().toString() + '-' + item.getFilename();
      const fileName = item.getFilename();
      const fileSize = item.getTotalBytes();
      const savePath = item.getSavePath ? item.getSavePath() : '';

      activeDownloads.set(downloadId, {
        fileName,
        fileSize,
        id: downloadId,
        state: 'progressing',
        savePath,
        item
      });

      const startedData = { id: downloadId, fileName, fileSize, receivedBytes: 0 };
      mainWindow.webContents.send('download-started', startedData);
      broadcastToDownloads('download-started', startedData);

      item.on('updated', (e, state) => {
        if (state === 'progressing') {
          const receivedBytes = item.getReceivedBytes();
          const progressData = {
            id: downloadId,
            fileName,
            fileSize,
            receivedBytes,
            progress: fileSize > 0 ? (receivedBytes / fileSize) * 100 : 0
          };
          mainWindow.webContents.send('download-progress', progressData);
          broadcastToDownloads('download-progress', progressData);
        }
      });

      item.once('done', (e, state) => {
        if (state === 'completed') {
          const finalSavePath = item.getSavePath ? item.getSavePath() : savePath;
          const entry = activeDownloads.get(downloadId);
          if (entry) {
            entry.state = 'completed';
            entry.savePath = finalSavePath;
            entry.item = null;
            activeDownloads.set(downloadId, entry);
          }
          const completeData = { id: downloadId, fileName, savePath: finalSavePath, state: 'completed' };
          mainWindow.webContents.send('download-complete', completeData);
          broadcastToDownloads('download-complete', completeData);
        } else if (state === 'cancelled') {
          const cancelledData = { id: downloadId, fileName };
          mainWindow.webContents.send('download-cancelled', cancelledData);
          broadcastToDownloads('download-cancelled', cancelledData);
          activeDownloads.delete(downloadId);
        } else {
          const entry = activeDownloads.get(downloadId);
          if (entry) {
            entry.state = state || 'error';
            activeDownloads.set(downloadId, entry);
          }
          const errorData = { id: downloadId, fileName, error: state || 'error' };
          mainWindow.webContents.send('download-error', errorData);
          broadcastToDownloads('download-error', errorData);
          activeDownloads.delete(downloadId);
        }
      });

      item.once('interrupted', () => {
        const errorData = { id: downloadId, fileName, error: 'Interrupted' };
        mainWindow.webContents.send('download-error', errorData);
        broadcastToDownloads('download-error', errorData);
        activeDownloads.delete(downloadId);
      });
    });
  }

  registerSessionListener(session.defaultSession);
  registerSessionListener(session.fromPartition('persist:neutron_profile'));
}

ipcMain.handle('get-active-downloads', () => {
  return Array.from(activeDownloads.values()).map(d => ({
    id: d.id,
    fileName: d.fileName,
    fileSize: d.fileSize,
    receivedBytes: d.state === 'completed'
      ? d.fileSize
      : d.item
        ? d.item.getReceivedBytes()
        : 0,
    progress: d.state === 'completed'
      ? 100
      : d.fileSize > 0 && d.item
        ? (d.item.getReceivedBytes() / d.fileSize) * 100
        : 0,
    state: d.state || 'progressing',
    savePath: d.savePath || ''
  }));
});

ipcMain.on('cancel-download', (event, downloadId) => {
  const dl = activeDownloads.get(downloadId);
  if (dl && dl.item && !dl.item.isDestroyed()) {
    dl.item.cancel();
  }
});

ipcMain.on('pause-download', (event, downloadId) => {
  const dl = activeDownloads.get(downloadId);
  if (!dl || !dl.item || dl.item.isDestroyed() || typeof dl.item.pause !== 'function') return;
  try {
    dl.item.pause();
    dl.state = 'paused';
    activeDownloads.set(downloadId, dl);
    const payload = {
      id: downloadId,
      fileName: dl.fileName,
      fileSize: dl.fileSize,
      receivedBytes: dl.item.getReceivedBytes(),
      progress: dl.fileSize > 0 ? (dl.item.getReceivedBytes() / dl.fileSize) * 100 : 0,
      state: 'paused'
    };
    mainWindow.webContents.send('download-state-changed', payload);
    broadcastToDownloads('download-state-changed', payload);
  } catch (e) {
    console.error('[Downloads] Pause error:', e.message);
  }
});

ipcMain.on('resume-download', (event, downloadId) => {
  const dl = activeDownloads.get(downloadId);
  if (!dl || !dl.item || dl.item.isDestroyed() || typeof dl.item.resume !== 'function') return;
  try {
    dl.item.resume();
    dl.state = 'progressing';
    activeDownloads.set(downloadId, dl);
    const payload = {
      id: downloadId,
      fileName: dl.fileName,
      fileSize: dl.fileSize,
      receivedBytes: dl.item.getReceivedBytes(),
      progress: dl.fileSize > 0 ? (dl.item.getReceivedBytes() / dl.fileSize) * 100 : 0,
      state: 'progressing'
    };
    mainWindow.webContents.send('download-state-changed', payload);
    broadcastToDownloads('download-state-changed', payload);
  } catch (e) {
    console.error('[Downloads] Resume error:', e.message);
  }
});

ipcMain.on('reveal-download', (event, downloadId) => {
  const dl = activeDownloads.get(downloadId);
  const savePath = dl?.savePath || (dl?.item && typeof dl.item.getSavePath === 'function' ? dl.item.getSavePath() : '');
  if (savePath) {
    try {
      shell.showItemInFolder(savePath);
    } catch (e) {
      console.error('[Downloads] Reveal error:', e.message);
    }
  }
});

ipcMain.on('open-downloads-window', () => {
  if (downloadsWindow && !downloadsWindow.isDestroyed()) {
    downloadsWindow.focus();
    return;
  }

  downloadsWindow = new BrowserWindow({
    width: 370,
    height: 450,
    minHeight: 200,
    minWidth: 300,
    frame: true,
    backgroundColor: '#131314',
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  downloadsWindow.loadFile(path.join(__dirname, 'ui', 'downloads.html'));
  downloadsWindow.setMenuBarVisibility(false);

  downloadsWindow.on('closed', () => { downloadsWindow = null; });
});

ipcMain.on('close-downloads-window', () => {
  if (downloadsWindow && !downloadsWindow.isDestroyed()) {
    downloadsWindow.close();
  }
});

ipcMain.on('open-sidebar-shortcut-window', () => openShortcutWindow('sidebar'));
ipcMain.on('open-home-shortcut-window', () => openShortcutWindow('home'));
ipcMain.on('close-sidebar-shortcut-window', () => closeShortcutWindow('sidebar'));
ipcMain.on('close-home-shortcut-window', () => closeShortcutWindow('home'));

// =====================================================================
// ?? SUGGESTIONS � Google Suggest API
// =====================================================================

ipcMain.on('get-suggestions', (event, query) => {
  if (!query || query.trim().length === 0) {
    event.reply('suggestions-results', []);
    return;
  }

  const encoded = encodeURIComponent(query.trim());
  const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encoded}`;

  const req = https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) {
          return event.reply('suggestions-results', []);
        }
        const parsed = JSON.parse(data);
        const suggestions = Array.isArray(parsed) && parsed[1] ? parsed[1] : [];
        event.reply('suggestions-results', suggestions);
      } catch (e) {
        event.reply('suggestions-results', []);
      }
    });
  });

  req.on('error', () => event.reply('suggestions-results', []));

  req.setTimeout(5000, () => {
    req.destroy();
    event.reply('suggestions-results', []);
  });
});

// =====================================================================
// ??? NEUTRON SHIELD
// =====================================================================

ipcMain.on('show-context-menu', (event, data = {}) => {
  const menu = data && data.tabId ? buildTabContextMenu(data.tabId) : buildMainWindowContextMenu();
  menu.popup({ window: mainWindow });
});

ipcMain.handle('block-current-site', () => {
  const tab = getActiveTab();
  const url = tab?.url || '';
  const domain = extractDomain(url);
  if (!domain) {
    return { success: false, reason: 'no-domain' };
  }
  if (!SHIELD_CONFIG.blacklistedDomains.includes(domain)) {
    SHIELD_CONFIG.blacklistedDomains.push(domain);
    saveShieldConfig();
    rebuildShieldSets();
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send('shield-config-updated', SHIELD_CONFIG);
    }
  }
  return { success: true, domain };
});

let SHIELD_CONFIG = {
  blockAds: true,
  blockTrackers: true,
  blockTelemetry: false,
  blacklistedDomains: [],
  blockedCount: 0
};

let SHIELD_DOMAINS = new Set();
let SHIELD_SUBSTRINGS = [];
let shieldInitialized = false;

const DEFAULT_AD_DOMAINS = [
  "doubleclick.net", "googleadservices.com", "google-analytics.com",
  "googletagmanager.com", "googlesyndication.com", "adservice.google.com",
  "adsystem.com", "amazon-adsystem.com", "serving-sys.com",
  "casalemedia.com", "rubiconproject.com", "openx.net", "pubmatic.com",
  "taboola.com", "outbrain.com", "criteo.com", "adsafeprotected.com",
  "33across.com", "indexww.com", "yieldmo.com", "ads.twitter.com",
  "connect.facebook.net", "facebook.net", "pixel.facebook.com",
  "analytics.twitter.com", "ads.linkedin.com", "scorecardresearch.com",
  "quantserve.com", "comscore.com", "hotjar.com", "crazyegg.com",
  "optimizely.com", "mixpanel.com", "newrelic.com", "pingdom.net",
  "clicktale.net", "userreport.com", "popads.net", "propellerads.com",
  "exoclick.com", "trafficjunky.net"
];

const DEFAULT_TRACKER_DOMAINS = [
  "scorecardresearch.com", "quantserve.com", "comscore.com",
  "hotjar.com", "crazyegg.com", "optimizely.com", "mixpanel.com",
  "newrelic.com", "pingdom.net", "clicktale.net", "userreport.com"
];

const TELEMETRY_DOMAINS = [
  "clientservices.googleapis.com", "ssl.google-analytics.com",
  "google-analytics.com", "analytics.google.com",
  "telemetry.mozilla.org", "metrics.icloud.com",
  "tracking-protection.cdn.mozilla.net", "incoming.telemetry.mozilla.org",
  "bat.bing.com", "bing.com/fd/ls",
  "clarity.ms", "hotjar.com", "mixpanel.com",
  "amplitude.com", "segment.io", "segment.com",
  "sentry.io", "bugsnag.com",
  "datadoghq.com", "datad0g.com",
  "newrelic.com", "nr-data.net", "appdynamics.com",
  "pixel.facebook.com", "connect.facebook.net",
  "analytics.twitter.com", "ads.linkedin.com",
  "scorecardresearch.com", "comscore.com",
  "pingdom.net", "clicktale.net",
  "userreport.com", "crazyegg.com",
  "optimizely.com", "kissmetrics.com",
  "chartbeat.com", "parsely.com",
  "hubspot.com/collect", "mailchi.mp",
  "telemetry.trafficmanager.net", "vortex.data.microsoft.com",
  "watson.telemetry.microsoft.com", "oca.telemetry.microsoft.com",
  "settings.data.microsoft.com", "events.data.microsoft.com",
  "mobile.events.data.microsoft.com", "eu-mobile.events.data.microsoft.com",
  "diagnostics.support.microsoft.com", "corp.sts.microsoft.com",
  "i.s-microsoft.com", "a.msftncsi.com",
  "in.appcenter.ms", "api.crashlytics.com",
  "reports.crashlytics.com", "sdk.crashlytics.com",
  "e.crashlytics.com", "firebase-settings.crashlytics.com",
  "perf-events.cloud.unity3d.com", "config.uca.cloud.unity3d.com",
  "data-optout-service.uca.cloud.unity3d.com",
  "adservice.google.com", "pagead2.googlesyndication.com",
  "tpc.googlesyndication.com", "doubleclick.net",
  "googleadservices.com", "googletagmanager.com",
  "googlesyndication.com"
];

const TELEMETRY_SUBSTRINGS = [
  "/telemetry", "/analytics", "/collect?", "/beacon?",
  "/metrics", "/track?", "/tracking", "/ping?",
  "/stats?", "/report?", "/log?", "/event?",
  "telemetry.", "analytics.", "tracking.",
  "/fd/ls/", "/clarity", "/batch", "/ingest",
  "crashlytics", "bugsnag", "sentry", "datadog"
];

const DEFAULT_SUBSTRINGS = [
  "pagead.js", "/ads?", "/ads/", "/adservice", "/doubleclick/",
  "/adframe.", "/adserver/", "/adclick", "/adbanner", "/adv.",
  "/_ads/", "/analytics.", "/tracking.", "/telemetry", "/beacon?"
];

let SHIELD_PATH;

function initShieldConfig() {
  SHIELD_PATH = path.join(app.getPath('userData'), 'neutron-shield.json');

  try {
    const projectPath = path.join(__dirname, 'neutron-shield.json');
    if (fs.existsSync(projectPath)) {
      const data = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
      SHIELD_CONFIG = { ...SHIELD_CONFIG, ...data };
    }
  } catch (e) {
    console.error('[Shield] Project template error:', e.message);
  }

  try {
    if (fs.existsSync(SHIELD_PATH)) {
      const data = JSON.parse(fs.readFileSync(SHIELD_PATH, 'utf8'));
      SHIELD_CONFIG = { ...SHIELD_CONFIG, ...data };
    }
  } catch (e) {
    console.error('[Shield] User config load error:', e.message);
  }

  saveShieldConfig();
}

function saveShieldConfig() {
  try {
    fs.writeFileSync(SHIELD_PATH, JSON.stringify(SHIELD_CONFIG, null, 2), 'utf8');
  } catch (e) {
    console.error('[Shield] Config save error:', e.message);
  }
}

function rebuildShieldSets() {
  SHIELD_DOMAINS.clear();
  SHIELD_SUBSTRINGS = DEFAULT_SUBSTRINGS.map(s => s.toLowerCase());

  if (SHIELD_CONFIG.blockAds) {
    DEFAULT_AD_DOMAINS.forEach(d => SHIELD_DOMAINS.add(d.toLowerCase()));
  }

  if (SHIELD_CONFIG.blockTrackers) {
    DEFAULT_TRACKER_DOMAINS.forEach(d => SHIELD_DOMAINS.add(d.toLowerCase()));
  }

  if (SHIELD_CONFIG.blockTelemetry) {
    TELEMETRY_DOMAINS.forEach(d => SHIELD_DOMAINS.add(d.toLowerCase()));
    TELEMETRY_SUBSTRINGS.forEach(s => {
      if (!SHIELD_SUBSTRINGS.includes(s.toLowerCase())) {
        SHIELD_SUBSTRINGS.push(s.toLowerCase());
      }
    });
  }

  if (Array.isArray(SHIELD_CONFIG.blacklistedDomains)) {
    SHIELD_CONFIG.blacklistedDomains.forEach(d => SHIELD_DOMAINS.add(d.toLowerCase()));
  }
}

function isShieldBlocked(urlStr) {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    if (SHIELD_DOMAINS.has(host)) return true;
    for (const d of SHIELD_DOMAINS) {
      if (host.endsWith('.' + d)) return true;
    }
  } catch (e) { }
  const urlLower = urlStr.toLowerCase();
  if (SHIELD_SUBSTRINGS.some(s => urlLower.includes(s))) return true;
  return false;
}

function initNetworkShield() {
  rebuildShieldSets();
  shieldInitialized = true;

  function registerSessionListener(sess) {
    sess.webRequest.onBeforeRequest((details, callback) => {
      const urlStr = details.url;

      if (isShieldBlocked(urlStr)) {
        SHIELD_CONFIG.blockedCount++;
        return callback({ cancel: true });
      }

      callback({ cancel: false });
    });

    sess.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders };

      // Override User-Agent for WhatsApp Web compatibility
      if (details.url && details.url.includes('web.whatsapp.com')) {
        headers['User-Agent'] = WHATSAPP_UA;
      }

      if (neutronConfig.doNotTrack) {
        headers['DNT'] = '1';
      }

      callback({ requestHeaders: headers });
    });
  }

  registerSessionListener(session.defaultSession);

  setInterval(() => {
    if (SHIELD_CONFIG.blockedCount > 0) {
      console.log(`[??? Shield] ${SHIELD_CONFIG.blockedCount} requests blocked`);
      broadcastShieldStats();
    }
  }, 60000);
}

function registerShieldForPartition(partitionName) {
  if (!shieldInitialized) return;
  try {
    const sess = session.fromPartition(partitionName);
    sess.webRequest.onBeforeRequest((details, callback) => {
      if (isShieldBlocked(details.url)) {
        SHIELD_CONFIG.blockedCount++;
        return callback({ cancel: true });
      }
      callback({ cancel: false });
    });

    sess.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders };

      // Override User-Agent for WhatsApp Web compatibility
      if (details.url && details.url.includes('web.whatsapp.com')) {
        headers['User-Agent'] = WHATSAPP_UA;
      }

      if (neutronConfig.doNotTrack) {
        headers['DNT'] = '1';
      }

      callback({ requestHeaders: headers });
    });
  } catch (e) {
    console.error('[Shield] Partition register error:', e.message);
  }
}

ipcMain.handle('get-app-metrics', async () => {
  const metrics = app.getAppMetrics();
  const tabPidMap = {};
  tabs.forEach(t => {
    if (t.view && t.view.webContents && !t.view.webContents.isDestroyed()) {
      try {
        const pid = t.view.webContents.getOSProcessId();
        tabPidMap[pid] = t.title || t.url || 'New tab';
      } catch (e) {}
    }
  });

  return metrics.map(m => {
    const mType = (m.type || '').toLowerCase();
    let name = 'System Process';
    let type = m.type;

    if (mType === 'browser' || mType === 'main') {
      name = 'Neutron (Main Process)';
      type = 'Main';
    } else if (mType === 'gpu-process' || mType === 'gpu') {
      name = 'Graphics Accelerator (GPU)';
      type = 'GPU';
    } else if (mType === 'renderer') {
      type = 'tab';
      name = tabPidMap[m.pid] || 'Browser Tab';
    } else if (mType === 'utility') {
      name = 'Network Service / Utility';
      type = 'Utility';
    } else if (mType === 'zygote') {
      name = 'Startup Process (Zygote)';
      type = 'Zygote';
    } else if (mType === 'sandbox-helper') {
      name = 'Security Helper (Sandbox)';
      type = 'Sandbox';
    }

    return {
      pid: m.pid,
      type: type,
      name: name,
      cpu: m.cpu.percentCPUUsage,
      memory: m.memory.privateBytes || m.memory.workingSetSize
    };
  });
});

ipcMain.on('kill-process', (event, pid) => {
  try {
    process.kill(pid);
    console.log(`[? Process Manager] Force-killed PID: ${pid}`);
  } catch (e) {
    console.error(`[? Process Manager] Failed to kill PID ${pid}:`, e.message);
  }
});

ipcMain.handle('get-shield-config', () => {
  return { ...SHIELD_CONFIG, blockedCount: SHIELD_CONFIG.blockedCount };
});

ipcMain.on('save-shield-config', (event, config) => {
  SHIELD_CONFIG = { ...SHIELD_CONFIG, ...config };
  saveShieldConfig();
  rebuildShieldSets();
  mainWindow.webContents.send('shield-config-updated', SHIELD_CONFIG);
  if (config.blockTelemetry !== undefined) {
    neutronConfig.telemetryBlock = config.blockTelemetry;
    saveNeutronConfig();
    sendSettingsToRenderer();
  }
});

ipcMain.on('add-blacklisted-domain', (event, domain) => {
  const d = domain.toLowerCase().trim();
  if (!d || !SHIELD_CONFIG.blacklistedDomains.includes(d)) {
    SHIELD_CONFIG.blacklistedDomains.push(d);
    saveShieldConfig();
    rebuildShieldSets();
  }
});

ipcMain.on('remove-blacklisted-domain', (event, domain) => {
  SHIELD_CONFIG.blacklistedDomains = SHIELD_CONFIG.blacklistedDomains.filter(d => d !== domain.toLowerCase().trim());
  saveShieldConfig();
  rebuildShieldSets();
});

// App lifecycle
initConfigPath();
initSessionPath();
loadNeutronConfig();

if (neutronConfig.disableHardwareAcceleration) {
  app.disableHardwareAcceleration();
  console.log('[??] Hardware acceleration disabled');
}

initShieldConfig();

if (neutronConfig.telemetryBlock !== undefined) {
  SHIELD_CONFIG.blockTelemetry = neutronConfig.telemetryBlock;
}

if (neutronConfig.smartHibernation) {
  startHibernationTimer();
}

if (!fs.existsSync(CONFIG_PATH)) {
  saveNeutronConfig();
}

function forceGarbageCollection() {
  if (global.gc) {
    global.gc();
    console.log('[? GC] Forced garbage collection');
  }
}

powerMonitor.on('suspend', () => {
  forceGarbageCollection();
});

powerMonitor.on('on-battery', () => {
  if (!neutronConfig.energySaver) {
    neutronConfig.energySaver = true;
    saveNeutronConfig();
    applyEnergySaverToTabs();
    console.log('[? Energy Saver] Auto-activated � on battery');
  }
});

powerMonitor.on('on-ac', () => {
  if (neutronConfig.energySaver) {
    neutronConfig.energySaver = false;
    saveNeutronConfig();
    applyEnergySaverToTabs();
    console.log('[? Energy Saver] Deactivated � on AC');
  }
});

powerMonitor.on('resume', () => {
  forceGarbageCollection();
});

app.whenReady().then(async () => {
  await NeutronDB.init();
  initProfilesPath();
  loadProfiles();
  loadBookmarks();
  initDownloadManager();
  initNetworkShield();
  applyWebRTCConfig();
  broadcastShieldStats();

  // ? FIRST LAUNCH CHECK
  if (neutronConfig.firstLaunch === true) {
    console.log('[??] First launch detected. Showing onboarding screen...');
    createOnboardingWindow();

    // Wait for onboarding to complete (Promise resolves in IPC handler)
    await new Promise((resolve) => {
      onboardingResolve = resolve;
    });

    console.log('[??] Onboarding completed, proceeding with app initialization...');
  }

  // Create main browser window (after onboarding or if not first launch)
  if (!mainWindow) {
    createMainWindow();
  }

  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.send('profiles-initialized', {
      profiles: profilesData.profiles,
      lastUsed: profilesData.lastUsed
    });

    // Send initial settings to renderer
    mainWindow.webContents.send('settings-updated', { ...neutronConfig });

    broadcastTheme();

    const restored = restoreSessionSnapshot();
    if (!restored) {
      setTimeout(() => {
        if (tabs.length === 0) {
          if (profilesData.lastUsed) {
            setActiveProfile(profilesData.lastUsed);
            createTab();
          }
        }
      }, 500);
    }
  });

  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const metrics = app.getAppMetrics();
      const totalMemoryKb = metrics.reduce((sum, m) => sum + (m.memory.privateBytes || m.memory.workingSetSize), 0);
      const totalMemoryMb = Math.round(totalMemoryKb / 1024);
      mainWindow.webContents.send('ram-usage-updated', totalMemoryMb);
    }
  }, 2000);
}).catch(e => {
  console.error('[Neutron] Startup error:', e);
});

app.on('window-all-closed', async () => {
  // Prevent app.quit() during onboarding ? main window transition
  if (isSwitchingFromOnboarding) {
    console.log('[??] window-all-closed suppressed � switching from onboarding to main window');
    isSwitchingFromOnboarding = false;
    return;
  }
  if (neutronConfig.restoreSession) {
    saveSessionSnapshot();
  }
  if (neutronConfig.autoClearCookiesOnExit) {
    const partitions = new Set(['default']);
    tabs.forEach(t => partitions.add(getProfilePartition(t.profile)));
    for (const p of partitions) {
      try {
        await session.fromPartition(p).clearStorageData({ storages: ['cookies'] });
      } catch (e) { }
    }
  }
  if (neutronConfig.autoClearCacheOnExit) {
    const partitions = new Set(['default']);
    tabs.forEach(t => partitions.add(getProfilePartition(t.profile)));
    for (const p of partitions) {
      try {
        await session.fromPartition(p).clearCache();
      } catch (e) { }
    }
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
