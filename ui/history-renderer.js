const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const I18N = window.NeutronI18n;
let currentLanguage = 'es';

function t(path) {
  return I18N ? I18N.t(currentLanguage, path) : path;
}

function applyLanguage(lang) {
  currentLanguage = I18N ? I18N.normalize(lang) : (lang || 'es');
  if (I18N) I18N.applyHistoryPage(currentLanguage);
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return '';
  const now = new Date();
  const then = new Date(isoStr);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return currentLanguage === 'en' ? 'Now' : currentLanguage === 'pt' ? 'Agora' : currentLanguage === 'fr' ? 'Maintenant' : 'Ahora';
  if (diffMin < 60) return currentLanguage === 'en' ? `${diffMin}m ago` : currentLanguage === 'pt' ? `há ${diffMin}m` : currentLanguage === 'fr' ? `il y a ${diffMin}m` : `hace ${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return currentLanguage === 'en' ? `${diffHrs}h ago` : currentLanguage === 'pt' ? `há ${diffHrs}h` : currentLanguage === 'fr' ? `il y a ${diffHrs}h` : `hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return currentLanguage === 'en' ? `${diffDays}d ago` : currentLanguage === 'pt' ? `há ${diffDays}d` : currentLanguage === 'fr' ? `il y a ${diffDays}j` : `hace ${diffDays}d`;
  return then.toLocaleDateString(currentLanguage);
}

async function renderHistory() {
  const entries = await window.api.getHistory();
  historyList.innerHTML = '';

  if (!entries || entries.length === 0) {
    historyList.innerHTML = `<div class="history-empty">${t('history.empty')}</div>`;
    return;
  }

  for (const entry of entries) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-item-info">
        <div class="history-item-title">${entry.title || entry.url}</div>
        <div class="history-item-url">${entry.url}</div>
        <div class="history-item-meta">
      <span class="history-item-visits">${entry.visit_count || 1} ${t('history.visits')}</span>
      <span>${formatTimeAgo(entry.last_visited)}</span>
        </div>
      </div>
      <button class="history-delete-btn" title="${t('history.delete')}">✕</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.history-delete-btn')) return;
      window.api.createTab({ url: entry.url, profile: 'default' });
    });

    item.querySelector('.history-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.deleteHistoryEntry(entry.url);
      item.remove();
      if (historyList.children.length === 0 || (historyList.children.length === 1 && historyList.children[0].classList.contains('history-empty'))) {
        historyList.innerHTML = `<div class="history-empty">${t('history.empty')}</div>`;
      }
    });

    historyList.appendChild(item);
  }
}

closeHistoryBtn.addEventListener('click', () => {
  window.api.closeCurrentTab();
});

clearHistoryBtn.addEventListener('click', () => {
  window.api.clearHistory();
  historyList.innerHTML = `<div class="history-empty">${t('history.empty')}</div>`;
});

if (window.api && window.api.loadSettings) {
  window.api.loadSettings().then(config => {
    applyLanguage(config.language || 'es');
    renderHistory();
  });
}
if (window.api && window.api.onSettingsUpdated) {
  window.api.onSettingsUpdated((config) => {
    if (config.language !== undefined) {
      applyLanguage(config.language);
      renderHistory();
    }
  });
}
if (!window.api || !window.api.loadSettings) {
  renderHistory();
}
