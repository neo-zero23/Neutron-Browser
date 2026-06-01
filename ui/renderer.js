// =====================================================================
// ✅ NEUTRON BROWSER - INTERACTION & RENDERER CONTROLLER (ELECTRON EDITION)
// =====================================================================

// State tracking
let activeTabId = null;
const tabData = {}; // Maps tabId -> { url, title, profile }
let activeProfile = null;
let profilesList = [];
let currentThemePreference = 'dark';
let currentAccentColor = '#4ea8de';
let themeMediaQuery = null;
let themeMediaListener = null;

// Elements
const winMinimize = document.getElementById('win-minimize');
const winMaximize = document.getElementById('win-maximize');
const winClose = document.getElementById('win-close');

const navBack = document.getElementById('nav-back');
const navForward = document.getElementById('nav-forward');
const navReload = document.getElementById('nav-reload');
const navGo = document.getElementById('nav-go');
const urlInput = document.getElementById('url-input');
const suggestionsList = document.getElementById('suggestions-list');
const loadingProgress = document.getElementById('loading-progress');

const addTabBtn = document.getElementById('add-tab-btn');
const tabsList = document.getElementById('tabs-list');
const verticalTabsRail = document.getElementById('vertical-tabs-rail');
const dragRegion = document.querySelector('.drag-region');

const cleanCacheBtn = document.getElementById('clean-cache-btn');
const ramFill = document.getElementById('ram-fill');
const ramText = document.getElementById('ram-text');
const panicBtn = document.getElementById('panic-btn');
const toggleSidebar = document.getElementById('toggle-sidebar');
const settingsBtn = document.getElementById('settings-btn');
const historyBtn = document.getElementById('history-btn');
const mainLayout = document.getElementById('main-layout');
const toggleIconOpen = document.getElementById('toggle-icon-open');
const toggleIconClosed = document.getElementById('toggle-icon-closed');
const I18N = window.NeutronI18n;
let currentLanguage = 'es';

// Profile elements
const profileIndicator = document.getElementById('profile-indicator');
const profileIndicatorName = document.getElementById('profile-indicator-name');
const profileDropdown = document.getElementById('profile-dropdown');
const profileDropdownList = document.getElementById('profile-dropdown-list');
const newProfileBtn = document.getElementById('new-profile-btn');
const guestModeBtn = document.getElementById('guest-mode-btn');
const profileModal = document.getElementById('profile-modal');
const modalProfileList = document.getElementById('modal-profile-list');
const modalNewProfileBtn = document.getElementById('modal-new-profile-btn');
const modalGuestBtn = document.getElementById('modal-guest-btn');
const newProfileDialog = document.getElementById('new-profile-dialog');
const newProfileNameInput = document.getElementById('new-profile-name');
const newProfileColorInput = document.getElementById('new-profile-color');
const cancelProfileBtn = document.getElementById('cancel-profile-btn');
const confirmProfileBtn = document.getElementById('confirm-profile-btn');

// --- 1. WINDOW CONTROLS ---
winMinimize.addEventListener('click', () => window.api.minimizeWindow());
winMaximize.addEventListener('click', () => window.api.maximizeWindow());
winClose.addEventListener('click', () => window.api.closeWindow());

// --- 2. NAVIGATION CONTROLS ---
navBack.addEventListener('click', () => window.api.goBack());
navForward.addEventListener('click', () => window.api.goForward());
navReload.addEventListener('click', () => window.api.reload());

function handleNavigation() {
  const url = urlInput.value.trim();
  if (url) {
    window.api.navigateTo(url);
  }
}

navGo.addEventListener('click', () => {
  const input = SuggestionManager.activeInput || 'url-input';
  const value = document.getElementById(input)?.value.trim();
  if (value) window.api.navigateTo(value);
});

const navHome = document.getElementById('nav-home');
navHome.addEventListener('click', () => window.api.goHome());

// --- 2b. SUGGESTION MANAGER ---
// Register inputs with the SuggestionManager (defined below)

// =====================================================================
// 🖼️ FAVICON HELPERS
// =====================================================================

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname || '';
  } catch (e) {
    return '';
  }
}

function getFaviconUrl(domain, size) {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size || 16}`;
}

const FALLBACK_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2371717a'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E";

function loadFavicon(imgEl, domain, size) {
  const url = getFaviconUrl(domain, size || 16);
  if (!url) {
    imgEl.src = FALLBACK_FAVICON;
    imgEl.classList.add('loaded');
    return;
  }
  imgEl.onload = () => imgEl.classList.add('loaded');
  imgEl.onerror = () => {
    imgEl.src = FALLBACK_FAVICON;
    imgEl.classList.add('loaded');
  };
  imgEl.src = url;
}

// =====================================================================
// 🔮 SuggestionManager — Modular autosuggest controller
// =====================================================================

const SuggestionManager = {
  lists: new Map(),
  debouncers: new Map(),
  activeIndexes: new Map(),
  activeInput: null,
  lastQuery: '',
  _hidden: false,
  _pending: new Map(),

  register(inputId, listEl) {
    this.lists.set(inputId, listEl);

    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', (e) => {
      this._onInput(inputId, e.target.value);
    });

    input.addEventListener('keydown', (e) => {
      this._onKeyDown(inputId, e);
    });

    input.addEventListener('focus', () => {
      this.activeInput = inputId;
      const list = this.lists.get(inputId);
      if (list && list.children.length > 0) {
        list.style.display = 'block';
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => this.hide(inputId), 150);
    });
  },

  _onInput(inputId, value) {
    this.activeInput = inputId;
    this.activeIndexes.set(inputId, -1);

    let timer = this.debouncers.get(inputId);
    if (timer) clearTimeout(timer);

    if (!value.trim()) {
      this.hide(inputId);
      return;
    }

    this.lastQuery = value;
    this._pending.set(inputId, { local: null, google: null });

    window.api.requestLocalSuggestions(value);

    timer = setTimeout(() => {
      window.api.requestSuggestions(value);
    }, 500);

    this.debouncers.set(inputId, timer);
  },

  _onKeyDown(inputId, event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const list = this.lists.get(inputId);
      const activeIdx = this.activeIndexes.get(inputId) ?? -1;
      const activeLi = list && list.querySelector('li.active');

      if (activeLi && list.style.display !== 'none') {
        this._select(inputId, activeLi.textContent);
      } else {
        this._navigate(inputId);
      }

      document.getElementById(inputId).blur();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._highlight(inputId, 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._highlight(inputId, -1);
    } else if (event.key === 'Escape') {
      this.hide(inputId);
      document.getElementById(inputId).blur();
    }
  },

  show(inputId, localResults, googleResults) {
    const list = this.lists.get(inputId);

    const merged = this._merge(localResults, googleResults);
    if (!list || merged.length === 0) {
      this.hide(inputId);
      return;
    }

    if (!this._hidden) {
      window.api.hideWebview();
      this._hidden = true;
    }

    this.activeIndexes.set(inputId, -1);
    list.innerHTML = '';

    for (const text of merged) {
      const li = document.createElement('li');
      li.textContent = text;
      li.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._select(inputId, text);
      });
      list.appendChild(li);
    }

    list.style.display = 'block';
  },

  _merge(local, google) {
    const seen = new Set();
    const result = [];

    if (local) {
      for (const s of local) {
        if (!seen.has(s)) { seen.add(s); result.push(s); }
      }
    }
    if (google) {
      for (const s of google) {
        if (!seen.has(s)) { seen.add(s); result.push(s); }
      }
    }

    return result.slice(0, 12);
  },

  hide(inputId) {
    const list = inputId ? this.lists.get(inputId) : null;
    if (list) {
      list.style.display = 'none';
      list.innerHTML = '';
    }
    this.activeIndexes.set(inputId, -1);

    if (this._hidden) {
      window.api.showWebview();
      this._hidden = false;
    }
  },

  _highlight(inputId, direction) {
    const list = this.lists.get(inputId);
    if (!list) return;
    const items = list.querySelectorAll('li');
    if (items.length === 0) return;

    let idx = this.activeIndexes.get(inputId) ?? -1;
    if (idx !== -1) items[idx].classList.remove('active');

    idx += direction;
    if (idx < 0) idx = items.length - 1;
    if (idx >= items.length) idx = 0;

    this.activeIndexes.set(inputId, idx);
    items[idx].classList.add('active');
    items[idx].scrollIntoView({ block: 'nearest' });
  },

  _select(inputId, text) {
    const input = document.getElementById(inputId);
    if (input) input.value = text;
    this.hide(inputId);
    this._navigate(inputId);
  },

  _navigate(inputId) {
    const input = document.getElementById(inputId);
    if (input && input.value.trim()) {
      window.api.navigateTo(input.value.trim());
    }
  }
};

window.api.onLocalSuggestions((results) => {
  const inputId = SuggestionManager.activeInput;
  const pending = SuggestionManager._pending.get(inputId);
  if (pending) {
    pending.local = results;
    SuggestionManager.show(inputId, pending.local, pending.google);
  }
});

window.api.onSuggestions((results) => {
  const inputId = SuggestionManager.activeInput;
  const pending = SuggestionManager._pending.get(inputId);
  if (pending) {
    pending.google = results;
    SuggestionManager.show(inputId, pending.local, pending.google);
  }
});

// Global click-outside handler
document.addEventListener('click', (e) => {
  if (SuggestionManager.activeInput) {
    const list = SuggestionManager.lists.get(SuggestionManager.activeInput);
    const input = document.getElementById(SuggestionManager.activeInput);
    if (list && input && !list.contains(e.target) && e.target !== input) {
      SuggestionManager.hide(SuggestionManager.activeInput);
    }
  }
});

// Wire up the toolbar URL bar with suggestions
SuggestionManager.register('url-input', suggestionsList);

// --- 3. TAB CONTROLS ---
addTabBtn.addEventListener('click', () => {
  window.api.createTab({ url: '', profile: activeProfile || 'default' });
});

// --- 4. SIDEBAR ACTIONS ---
// App Shortcuts
document.querySelectorAll('.sidebar-btn[data-url]').forEach(btn => {
  btn.addEventListener('click', () => {
    const url = btn.getAttribute('data-url');
    window.api.navigateTo(url);
  });
  const img = btn.querySelector('.sidebar-favicon');
  const url = btn.getAttribute('data-url');
  if (img && url) loadFavicon(img, extractDomain(url), 20);
});

// Favorites
const sidebarFavBtn = document.getElementById('sidebar-fav-btn');
sidebarFavBtn.addEventListener('click', () => {
  window.api.openFavoritesWindow();
});
sidebarFavBtn.addEventListener('auxclick', (e) => {
  if (e.button === 1) {
    e.preventDefault();
    window.api.openFavoritesWindow();
  }
});
sidebarFavBtn.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  window.api.openFavoritesWindow();
});

// Atomic Mode -> Guest Profile quick toggle
const atomicModeBtn = document.getElementById('atomic-mode-btn');
atomicModeBtn.addEventListener('click', () => {
  if (activeProfile === 'invitado') {
    // Switch back to default/lastUsed
    const info = profilesList.find(p => p.id !== 'invitado');
    if (info) {
      window.api.selectProfile(info.id);
    }
  } else {
    window.api.startGuest();
  }
});

// Cache Cleaning
cleanCacheBtn.addEventListener('click', () => {
  window.api.clearMemory();
});

// Panic Button
panicBtn.addEventListener('click', () => {
  window.api.triggerPanic();
});

// --- 5. PROFILE UI ---
function getProfileInfo(profileId) {
  if (profileId === 'invitado') {
    return { id: 'invitado', name: tr('chrome.guestProfile'), color: '#00FF41' };
  }
  return profilesList.find(p => p.id === profileId) || { id: 'default', name: tr('chrome.defaultProfile'), color: '#4ea8de' };
}

function updateProfileIndicator(profileId) {
  activeProfile = profileId;
  const info = getProfileInfo(profileId);
  profileIndicatorName.textContent = info.name;
  profileIndicator.style.borderColor = info.color + '40';
  profileIndicator.style.color = info.color;

  const isGuest = profileId === 'invitado';
  document.body.classList.toggle('invitado-mode', isGuest);
  document.body.classList.toggle('atomic-mode', isGuest);
  document.getElementById('logo-text').textContent = isGuest ? tr('chrome.atomicMode') : tr('chrome.brand');
  atomicModeBtn.classList.toggle('atomic-active', isGuest);
}

function renderProfileDropdown() {
  profileDropdownList.innerHTML = '';
  profilesList.forEach(p => {
    const displayName = p.id === 'default' ? tr('chrome.defaultProfile') : p.name;
    const item = document.createElement('div');
    item.className = 'profile-dropdown-item' + (p.id === activeProfile ? ' active' : '');
    item.innerHTML = `
      <span class="profile-dot" style="background:${p.color}"></span>
      <span>${displayName}</span>
      ${p.id !== 'default' ? '<button class="delete-profile-btn" data-id="' + p.id + '" title="' + tr('chrome.deleteProfile') + '">✕</button>' : ''}
    `;
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-profile-btn') || e.target.classList.contains('edit-profile-btn')) return;
      window.api.selectProfile(p.id);
      profileDropdown.classList.add('hidden');
    });
    const deleteBtn = item.querySelector('.delete-profile-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.api.deleteProfile(p.id);
        profileDropdown.classList.add('hidden');
        window.api.showWebview();
      });
    }
    profileDropdownList.appendChild(item);
  });
}

function renderModalProfiles() {
  modalProfileList.innerHTML = '';
  profilesList.forEach(p => {
    const displayName = p.id === 'default' ? tr('chrome.defaultProfile') : p.name;
    const card = document.createElement('div');
    card.className = 'modal-profile-card';
    card.innerHTML = `
      <div class="modal-profile-avatar" style="background:${p.color}">${displayName[0].toUpperCase()}</div>
      <div class="modal-profile-info">
        <div class="modal-profile-name">${displayName}</div>
        <div class="modal-profile-sub">${tr('chrome.customBrowsing')}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      window.api.selectProfile(p.id);
      profileModal.classList.add('hidden');
    });
    modalProfileList.appendChild(card);
  });
}

function openProfileDropdown() {
  renderProfileDropdown();
  window.api.hideWebview();
  profileDropdown.classList.remove('hidden');
}

function closeProfileDropdown() {
  profileDropdown.classList.add('hidden');
  window.api.showWebview();
}

profileIndicator.addEventListener('click', (e) => {
  e.stopPropagation();
  if (profileDropdown.classList.contains('hidden')) {
    openProfileDropdown();
  } else {
    closeProfileDropdown();
  }
});

document.addEventListener('click', (e) => {
  if (!profileDropdown.classList.contains('hidden') && !profileDropdown.contains(e.target) && e.target !== profileIndicator) {
    closeProfileDropdown();
  }
});

newProfileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.add('hidden');
  newProfileDialog.classList.remove('hidden');
  newProfileNameInput.value = '';
  newProfileNameInput.focus();
});

guestModeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.add('hidden');
  window.api.startGuest();
});

modalNewProfileBtn.addEventListener('click', () => {
  profileModal.classList.add('hidden');
  newProfileDialog.classList.remove('hidden');
  newProfileNameInput.value = '';
  newProfileNameInput.focus();
});

modalGuestBtn.addEventListener('click', () => {
  profileModal.classList.add('hidden');
  window.api.showWebview();
  window.api.startGuest();
});

cancelProfileBtn.addEventListener('click', () => {
  newProfileDialog.classList.add('hidden');
  window.api.showWebview();
});

newProfileDialog.querySelector('.profile-modal-backdrop').addEventListener('click', () => {
  newProfileDialog.classList.add('hidden');
  window.api.showWebview();
});

confirmProfileBtn.addEventListener('click', () => {
  const name = newProfileNameInput.value.trim();
  if (!name) return;
  const color = newProfileColorInput.value;
  const id = 'profile_' + Date.now();
  profilesList.push({ id, name, color });
  window.api.createProfile({ id, name, color });
  newProfileDialog.classList.add('hidden');
  window.api.showWebview();
});

newProfileNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmProfileBtn.click();
});

profileModal.querySelector('.profile-modal-backdrop').addEventListener('click', () => {
  profileModal.classList.add('hidden');
  window.api.showWebview();
});

// --- 6. IPC EVENT HANDLERS (BACKEND TO UI) ---

// Profile events
window.api.onProfilesInitialized((data) => {
  profilesList = data.profiles || [];
  if (data.lastUsed) {
    updateProfileIndicator(data.lastUsed);
    profileModal.classList.add('hidden');
  } else {
    renderModalProfiles();
    window.api.hideWebview();
    profileModal.classList.remove('hidden');
  }
});

window.api.onProfileSelected((data) => {
  updateProfileIndicator(data.profileId);
  closeProfileDropdown();
  profileModal.classList.add('hidden');
  window.api.showWebview();
});

window.api.onProfileDeleted((data) => {
  profilesList = profilesList.filter(p => p.id !== data.profileId);
  if (data.profileId === activeProfile) {
    updateProfileIndicator('default');
  }
  renderProfileDropdown();
  renderModalProfiles();
});

// Handle Tab Creation
window.api.onTabCreated(({ tabId, url, title, profile, pinned }) => {
  tabData[tabId] = { url, title, profile, pinned: !!pinned };

  const profileInfo = getProfileInfo(profile);
  const domain = extractDomain(url);
  const tabEl = document.createElement('div');
  tabEl.className = 'tab-item';
  tabEl.id = `tab-${tabId}`;
  tabEl.style.borderLeft = '2px solid var(--accent-blue)';
  tabEl.classList.toggle('pinned', !!pinned);
  tabEl.innerHTML = `
    <img class="tab-favicon" alt="">
    <span class="tab-title-text">${title || tr('chrome.tabTitleDefault')}</span>
    <span class="tab-pin" title="${tr('chrome.pinnedTab')}">📌</span>
    <button class="tab-close" title="${tr('chrome.closeTab')}">✕</button>
  `;

  const favicon = tabEl.querySelector('.tab-favicon');
  if (domain) {
    loadFavicon(favicon, domain, 16);
  } else {
    favicon.src = FALLBACK_FAVICON;
    favicon.classList.add('loaded');
  }

  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close') || e.target.parentElement.classList.contains('tab-close')) {
      e.stopPropagation();
      const tData = tabData[tabId];
      if (tData && tData.pinned) return; // Block closing pinned tabs
      destruirPestaña(tabId);
    } else {
      window.api.switchTab(tabId);
    }
  });

  tabEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.api.showContextMenu({ tabId });
  });

  tabsList.appendChild(tabEl);
});

// Handle Tab Switch
window.api.onTabSwitched(({ tabId, profile }) => {
  activeTabId = tabId;
  window.api.showWebview();

  document.querySelectorAll('.tab-item').forEach(el => {
    if (el.id === `tab-${tabId}`) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  const tab = tabData[tabId];
  if (tab) {
    const tabProfileInfo = getProfileInfo(tab.profile);
    document.body.classList.toggle('invitado-mode', tab.profile === 'invitado');
    document.body.classList.toggle('atomic-mode', tab.profile === 'invitado');
    document.getElementById('logo-text').textContent = tab.profile === 'invitado' ? tr('chrome.atomicMode') : tr('chrome.brand');
    urlInput.value = tab.url || '';
  }
});

// Handle Tab Close
window.api.onTabClosed(({ tabId }) => {
  delete tabData[tabId];
  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    tabEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    tabEl.style.opacity = '0';
    tabEl.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (tabEl && tabEl.parentNode) {
        tabEl.remove();
      }
    }, 150);
  }
});

window.api.onTabPinnedUpdated(({ tabId, pinned }) => {
  if (tabData[tabId]) {
    tabData[tabId].pinned = !!pinned;
  }
  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    tabEl.classList.toggle('pinned', !!pinned);
    const pin = tabEl.querySelector('.tab-pin');
    if (pin) pin.title = pinned ? tr('chrome.pinnedTab') : tr('chrome.pinTab');
  }
});

// Handle URL Changes
window.api.onTabUrlChanged(({ tabId, url }) => {
  if (tabData[tabId]) {
    tabData[tabId].url = url;
  }
  if (tabId === activeTabId) {
    urlInput.value = url;
  }
  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    const img = tabEl.querySelector('.tab-favicon');
    const domain = extractDomain(url);
    if (img) {
      if (domain) loadFavicon(img, domain, 16);
      else { img.src = FALLBACK_FAVICON; img.classList.add('loaded'); }
    }
  }
});

// Handle Title Changes
window.api.onTabTitleChanged(({ tabId, title }) => {
  if (tabData[tabId]) {
    tabData[tabId].title = title;
  }
  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    const titleSpan = tabEl.querySelector('.tab-title-text');
    if (titleSpan) {
      titleSpan.textContent = title || tr('chrome.tabTitleDefault');
    }
  }
});

// Handle Loading Indicators
window.api.onTabLoadingStarted(({ tabId }) => {
  if (tabId === activeTabId) {
    loadingProgress.className = 'progress-bar-loading';
    loadingProgress.style.width = '65%';
  }
});

window.api.onTabLoadingFinished(({ tabId }) => {
  if (tabId === activeTabId) {
    loadingProgress.style.width = '100%';
    setTimeout(() => {
      if (tabId === activeTabId) {
        loadingProgress.className = 'progress-bar-hidden';
      }
    }, 400);
  }
});

// Open link in new tab request
window.api.onOpenNewTabFromWeb(({ url, profile }) => {
  window.api.createTab({ url, profile: profile || activeProfile });
});

// Handle RAM usage updates
window.api.onRamUsageUpdated((ramMb) => {
  ramText.textContent = `${ramMb}MB`;
  // Scale bar: 1.5GB (1500MB) as standard threshold for visual high-pressure warning
  const percent = Math.min(Math.round((ramMb / 1500) * 100), 100);
  ramFill.style.height = `${percent}%`;
});

// Handle memory cleanup finished animation
window.api.onMemoryCleared(() => {
  const originalEmoji = cleanCacheBtn.textContent;
  cleanCacheBtn.textContent = '✨';
  cleanCacheBtn.style.color = 'var(--accent-green)';

  setTimeout(() => {
    cleanCacheBtn.textContent = originalEmoji;
    cleanCacheBtn.style.color = '';
  }, 1000);
});

// --- 7. SIDEBAR TOGGLE ---
toggleSidebar.addEventListener('click', () => {
  mainLayout.classList.toggle('sidebar-hidden');
  const isHidden = mainLayout.classList.contains('sidebar-hidden');
  toggleIconOpen.style.display = isHidden ? 'none' : 'block';
  toggleIconClosed.style.display = isHidden ? 'block' : 'none';
  window.api.toggleSidebar(!isHidden);
});

// --- 8. SETTINGS PAGE ---
const pathToSettings = new URL('settings.html', window.location.href).href;
settingsBtn.addEventListener('click', () => {
  window.api.createTab({ url: pathToSettings, profile: activeProfile || 'default' });
});

// --- 9. INACTIVITY DETECTION — Energy Saver (30s timeout) ---
let inactivityTimer = null;
let isInactive = false;

function resetInactivityTimer() {
  isInactive = false;
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    isInactive = true;
    // Inject visual indicator that energy saver is active
    const style = document.createElement('style');
    style.id = 'neutron-energy-saver';
    style.textContent = `
      video:not([paused="true"]) { filter: brightness(0.85); }
      canvas { filter: brightness(0.85); }
    `;
    if (!document.getElementById('neutron-energy-saver')) {
      document.head.appendChild(style);
    }
    console.log('[⚡ Energy] Inactive — media throttled');
  }, 30000);
}

['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart', 'click'].forEach(event => {
  window.addEventListener(event, resetInactivityTimer, { passive: true });
});

resetInactivityTimer();

// --- 10. DESTRUIR PESTAÑA — Full Lifecycle Cleanup ---
function destruirPestaña(tabId) {
  const tData = tabData[tabId];
  if (tData && tData.pinned) return; // Prevent closing pinned tabs

  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) {
    // Animate out
    tabEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    tabEl.style.opacity = '0';
    tabEl.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (tabEl && tabEl.parentNode) {
        tabEl.remove();
      }
    }, 150);
  }

  // Clean local data
  delete tabData[tabId];

  // Notify main process to destroy WebContentsView and kill process
  if (window.api && window.api.closeTab) {
    window.api.closeTab(tabId);
  }
}

// --- 11. RIGHT-CLICK CONTEXT MENU ---
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.api.showContextMenu();
});

// --- 12. HISTORY PANEL (separate window to avoid WebContentsView z-index) ---
historyBtn.addEventListener('click', () => {
  window.api.openHistoryWindow();
});

// --- 13. FAVORITES ---
const favBtn = document.getElementById('fav-btn');
const favStar = document.getElementById('fav-star');

async function updateFavStar() {
  const isFav = await window.api.isFavorite(urlInput.value.trim());
  favBtn.classList.toggle('favorited', isFav);
}

favBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url || url.startsWith('file://') || url.startsWith('about:')) return;

  const isFav = await window.api.isFavorite(url);
  if (isFav) {
    window.api.removeFavorite(url);
    favBtn.classList.remove('favorited');
  } else {
    const activeTab = Object.entries(tabData).find(([id]) => id === activeTabId);
    const title = activeTab ? activeTab[1].title : url;
    window.api.addFavorite({ url, title });
    favBtn.classList.add('favorited');
  }
});

favBtn.addEventListener('auxclick', (e) => {
  if (e.button === 1) {
    e.preventDefault();
    window.api.openFavoritesWindow();
  }
});

favBtn.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  e.stopPropagation();
  window.api.openFavoritesWindow();
});

// --- 14. DOWNLOAD MANAGER (separate window — always above WebContentsView) ---
const downloadsBtn = document.getElementById('downloads-btn');
const downloadCountBadge = document.getElementById('download-count-badge');
let activeDownloadCount = 0;

function updateDownloadBadge() {
  if (activeDownloadCount > 0) {
    downloadCountBadge.textContent = activeDownloadCount;
    downloadCountBadge.style.display = 'flex';
  } else {
    downloadCountBadge.style.display = 'none';
  }
}

downloadsBtn.addEventListener('click', () => {
  window.api.openDownloadsWindow();
});

window.api.onDownloadStarted(() => {
  activeDownloadCount++;
  updateDownloadBadge();
});

window.api.onDownloadComplete(() => {
  activeDownloadCount--;
  updateDownloadBadge();
});

window.api.onDownloadCancelled(() => {
  activeDownloadCount--;
  updateDownloadBadge();
});

window.api.onDownloadError(() => {
  activeDownloadCount--;
  updateDownloadBadge();
});

window.api.onTabUrlChanged(() => { updateFavStar(); });
window.api.onTabSwitched(() => { updateFavStar(); });

// Shield blocked count
const shieldCountBadge = document.getElementById('shield-count-badge');
window.api.onShieldStatsUpdated((count) => {
  if (shieldCountBadge) {
    shieldCountBadge.textContent = count;
    shieldCountBadge.style.display = count > 0 ? 'flex' : 'none';
  }
});

// Apply density class to body
function applyDensity(density) {
  document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
  if (density && density !== 'comfortable') {
    document.body.classList.add('density-' + density);
  }
}

// Apply energy saver class to body
function applyEnergySaver(enabled) {
  document.body.classList.toggle('energy-saver', !!enabled);
}

function applyHomeButtonVisibility(visible) {
  if (navHome) navHome.style.display = visible ? '' : 'none';
}

function tr(path) {
  return I18N ? I18N.t(currentLanguage, path) : path;
}

function applyLanguage(lang) {
  currentLanguage = lang || 'es';
  if (I18N) {
    I18N.applyIndexPage(currentLanguage);
  }
  if (activeProfile !== null) {
    updateProfileIndicator(activeProfile);
  }
  renderProfileDropdown();
  renderModalProfiles();
}

function applyTheme(theme, accentColor) {
  currentThemePreference = theme || 'dark';
  currentAccentColor = accentColor || currentAccentColor || '#4ea8de';
  const resolvedTheme = theme === 'auto'
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(resolvedTheme === 'light' ? 'theme-light' : 'theme-dark');
  const color = currentAccentColor || '#4ea8de';
  document.documentElement.style.setProperty('--accent-blue-current', color);
  document.documentElement.style.setProperty('--accent-blue', color);

  if (window.matchMedia) {
    if (!themeMediaQuery) {
      themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }
    if (themeMediaListener) {
      if (typeof themeMediaQuery.removeEventListener === 'function') {
        themeMediaQuery.removeEventListener('change', themeMediaListener);
      } else if (typeof themeMediaQuery.removeListener === 'function') {
        themeMediaQuery.removeListener(themeMediaListener);
      }
      themeMediaListener = null;
    }
    if (currentThemePreference === 'auto') {
      themeMediaListener = () => {
        if (currentThemePreference === 'auto') {
          applyTheme('auto', currentAccentColor);
        }
      };
      if (typeof themeMediaQuery.addEventListener === 'function') {
        themeMediaQuery.addEventListener('change', themeMediaListener);
      } else if (typeof themeMediaQuery.addListener === 'function') {
        themeMediaQuery.addListener(themeMediaListener);
      }
    }
  }
}

function applySidebarVisibility(visible) {
  mainLayout.classList.toggle('sidebar-hidden', !visible);
  const isHidden = !visible;
  toggleIconOpen.style.display = isHidden ? 'none' : 'block';
  toggleIconClosed.style.display = isHidden ? 'block' : 'none';
}

function applyVerticalTabs(enabled) {
  const vertical = !!enabled;
  document.body.classList.toggle('vertical-tabs', vertical);

  if (!verticalTabsRail || !tabsList || !addTabBtn || !dragRegion) return;

  if (vertical) {
    verticalTabsRail.appendChild(tabsList);
    verticalTabsRail.appendChild(addTabBtn);
  } else {
    dragRegion.appendChild(tabsList);
    dragRegion.appendChild(addTabBtn);
  }
}

window.api.onThemeChanged(({ theme, accentColor }) => {
  applyTheme(theme, accentColor);
});

// Listen for settings changes from main process
window.api.onSettingsUpdated((settings) => {
  if (settings.language !== undefined) applyLanguage(settings.language);
  applyDensity(settings.density);
  if (settings.energySaver !== undefined) applyEnergySaver(settings.energySaver);
  if (settings.showHomeButton !== undefined) applyHomeButtonVisibility(settings.showHomeButton);
  if (settings.verticalTabs !== undefined) applyVerticalTabs(settings.verticalTabs);
  if (settings.showSidebar !== undefined) applySidebarVisibility(settings.showSidebar);
  if (settings.theme !== undefined || settings.accentColor !== undefined) {
    applyTheme(settings.theme || 'dark', settings.accentColor || '#4ea8de');
  }
  if (settings.forceDarkMode !== undefined) {
    // Main process handles this via applyDarkModeToAllTabs
  }
});

// Apply initial settings on startup
if (window.api && window.api.loadSettings) {
  console.log('[DEBUG] loadSettings found, calling...');
  window.api.loadSettings().then((settings) => {
    applyLanguage(settings.language || 'es');
    applyDensity(settings.density);
    if (settings.energySaver) applyEnergySaver(true);
    applyHomeButtonVisibility(settings.showHomeButton !== false);
    applyVerticalTabs(settings.verticalTabs);
    applySidebarVisibility(settings.showSidebar !== false);
    applyTheme(settings.theme || 'dark', settings.accentColor || '#4ea8de');
    if (settings.forceDarkMode) {
      // Dark mode applied by main process on tab creation
    }
  });
}

// =====================================================================
// 📑 BOOKMARKS — Dynamic Sidebar Rendering + Fav Dropdown + Context Menu
// =====================================================================

let bookmarksData = { sidebar: [], home: [], fav: [] };

function renderSidebar(data) {
  const container = document.getElementById('sidebar-apps-list');
  if (!container) return;
  container.innerHTML = '';
  (data.sidebar || []).forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-btn';
    btn.setAttribute('data-url', item.url);
    btn.title = item.title || item.domain || '';
    const img = document.createElement('img');
    img.className = 'sidebar-favicon';
    img.alt = item.title || '';
    btn.appendChild(img);
    btn.addEventListener('click', () => window.api.navigateTo(item.url));
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showBookmarkCtxMenu(e, 'sidebar', item.url);
    });
    container.appendChild(btn);
    if (item.domain || item.url) {
      loadFavicon(img, item.domain || extractDomain(item.url), 20);
    } else {
      img.src = FALLBACK_FAVICON;
      img.classList.add('loaded');
    }
  });
}

function showBookmarkCtxMenu(e, type, url) {
  const menu = document.getElementById('bookmark-ctx-menu');
  if (!menu) return;
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.setAttribute('data-ctx-url', url);
  menu.setAttribute('data-ctx-type', type);
  menu.classList.remove('hidden');
  window.api.hideWebview();
}

function positionFavDropdown() {
  const group = document.getElementById('fav-btn-group');
  const dropdown = document.getElementById('fav-dropdown');
  if (!group || !dropdown) return;
  const rect = group.getBoundingClientRect();
  dropdown.style.left = Math.max(4, rect.left - 80) + 'px';
  dropdown.style.top = (rect.bottom + 4) + 'px';
}

function dismissBookmarkOverlays() {
  if (favDropdown) favDropdown.classList.add('hidden');
  const ctx = document.getElementById('bookmark-ctx-menu');
  if (ctx) ctx.classList.add('hidden');
  window.api.showWebview();
}

// Fav chevron dropdown
const favChevron = document.getElementById('fav-chevron');
const favDropdown = document.getElementById('fav-dropdown');
if (favChevron && favDropdown) {
  favChevron.addEventListener('click', (e) => {
    e.stopPropagation();
    if (favDropdown.classList.contains('hidden')) {
      positionFavDropdown();
      favDropdown.classList.remove('hidden');
      window.api.hideWebview();
    } else {
      dismissBookmarkOverlays();
    }
  });

  favDropdown.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = li.getAttribute('data-type');
      const url = urlInput.value.trim();
      if (!url || url.startsWith('file://') || url.startsWith('about:')) return;
      const activeTabData = tabData[activeTabId];
      const title = activeTabData ? activeTabData.title : url;
      window.api.addBookmark({ type, url, title });
      dismissBookmarkOverlays();
    });
  });
}

document.addEventListener('click', (e) => {
  if (favDropdown && !favDropdown.contains(e.target) && e.target !== favChevron) {
    dismissBookmarkOverlays();
  }
});

// Bookmark context menu remove
const ctxRemove = document.getElementById('bookmark-ctx-remove');
if (ctxRemove) {
  ctxRemove.addEventListener('click', () => {
    const menu = document.getElementById('bookmark-ctx-menu');
    if (!menu) return;
    const type = menu.getAttribute('data-ctx-type');
    const url = menu.getAttribute('data-ctx-url');
    if (type && url) {
      window.api.removeBookmark({ type, url });
    }
    dismissBookmarkOverlays();
  });
}

// Sidebar fav btn auxclick/contextmenu already defined above

// Init bookmarks
function initBookmarks() {
  window.api.getBookmarks().then(data => {
    bookmarksData = data;
    renderSidebar(data);
  });
}

window.api.onBookmarksUpdated((data) => {
  bookmarksData = data;
  renderSidebar(data);
});

initBookmarks();
