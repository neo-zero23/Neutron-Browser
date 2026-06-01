const downloadsList = document.getElementById('downloads-list');
const closeDownloadsBtn = document.getElementById('close-downloads-btn');
const downloads = {};
const I18N = window.NeutronI18n;
let currentLanguage = 'es';

function t(path) {
  return I18N ? I18N.t(currentLanguage, path) : path;
}

function applyLanguage(lang) {
  currentLanguage = I18N ? I18N.normalize(lang) : (lang || 'es');
  if (I18N) I18N.applyDownloadsPage(currentLanguage);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
}

function setActionButtons(el, buttons) {
  const old = el.querySelector('.dl-actions');
  if (old) old.remove();
  const actions = document.createElement('div');
  actions.className = 'dl-actions';
  buttons.forEach((btn) => actions.appendChild(btn));
  el.appendChild(actions);
}

function makeActionButton(className, label, title, onClick) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.type = 'button';
  btn.textContent = label;
  btn.title = title;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function renderDownloadActions(el, { id, state }) {
  const isComplete = state === 'complete' || state === 'completed';
  const isPaused = state === 'paused';
  const isActive = !isComplete && !isPaused;

  const buttons = [];
  if (isActive) {
    buttons.push(makeActionButton('dl-action dl-pause', '⏸', t('downloads.pause'), () => window.api.pauseDownload(id)));
  }
  if (isPaused) {
    buttons.push(makeActionButton('dl-action dl-resume', '▶', t('downloads.resume'), () => window.api.resumeDownload(id)));
  }
  if (isComplete) {
    buttons.push(makeActionButton('dl-action dl-open-folder', '📂', t('downloads.openFolder'), () => window.api.revealDownload(id)));
  }
  if (!isComplete) {
    buttons.push(makeActionButton('dl-action dl-cancel', '✕', t('downloads.cancel'), () => window.api.cancelDownload(id)));
  }
  setActionButtons(el, buttons);
}

function createDownloadElement({ id, fileName, fileSize, receivedBytes, progress, state, savePath }) {
  const el = document.createElement('div');
  el.className = 'dl-item';
  el.id = `dl-${id}`;

  const isComplete = state === 'complete' || state === 'completed';
  const isPaused = state === 'paused';
  const isError = state === 'error' || state === 'cancelled';
  const icon = isComplete ? '✅' : isPaused ? '⏸' : isError ? '❌' : '📥';
  const barClass = isComplete ? 'dl-bar-fill complete' : isError ? 'dl-bar-fill error' : 'dl-bar-fill';
  const sizeText = isComplete ? (savePath || fileName) : `${formatBytes(receivedBytes)}${fileSize > 0 ? ' / ' + formatBytes(fileSize) : ''}`;

  el.innerHTML = `
    <span class="dl-icon">${icon}</span>
    <div class="dl-info">
      <div class="dl-name">${fileName}</div>
      <div class="dl-meta">
        <span class="dl-size">${sizeText}</span>
        <span class="dl-pct">${Math.round(progress)}%</span>
      </div>
      <div class="dl-bar-track">
        <div class="${barClass}" id="dl-fill-${id}" style="width: ${progress}%"></div>
      </div>
    </div>
  `;

  renderDownloadActions(el, { id, state });

  return el;
}

async function loadActiveDownloads() {
  const actives = await window.api.getActiveDownloads();
  Object.keys(downloads).forEach((key) => delete downloads[key]);
  if (actives.length === 0) {
    downloadsList.innerHTML = `<div class="dl-empty">${t('downloads.empty')}</div>`;
    return;
  }
  downloadsList.innerHTML = '';
  for (const dl of actives) {
    const el = createDownloadElement(dl);
    downloads[dl.id] = el;
    downloadsList.appendChild(el);
  }
}

window.api.onDownloadStarted(({ id, fileName, fileSize }) => {
  const empty = downloadsList.querySelector('.dl-empty');
  if (empty) empty.remove();

  const el = createDownloadElement({ id, fileName, fileSize, receivedBytes: 0, progress: 0, state: 'progressing' });
  downloads[id] = el;
  downloadsList.appendChild(el);
});

window.api.onDownloadProgress(({ id, receivedBytes, fileSize, progress }) => {
  const el = downloads[id];
  if (!el) return;
  const fill = el.querySelector(`#dl-fill-${id}`);
  const sizeEl = el.querySelector('.dl-size');
  const pctEl = el.querySelector('.dl-pct');
  if (fill) fill.style.width = Math.round(progress) + '%';
  if (sizeEl) sizeEl.textContent = `${formatBytes(receivedBytes)} / ${formatBytes(fileSize)}`;
  if (pctEl) pctEl.textContent = Math.round(progress) + '%';
});

window.api.onDownloadStateChanged(({ id, fileName, fileSize, receivedBytes, progress, state }) => {
  const el = downloads[id];
  if (!el) return;
  const fill = el.querySelector(`#dl-fill-${id}`);
  const sizeEl = el.querySelector('.dl-size');
  const pctEl = el.querySelector('.dl-pct');
  const iconEl = el.querySelector('.dl-icon');
  if (fill) {
    fill.style.width = `${Math.round(progress || 0)}%`;
    fill.className = state === 'paused' ? 'dl-bar-fill paused' : 'dl-bar-fill';
  }
  if (sizeEl && fileSize !== undefined) {
    sizeEl.textContent = `${formatBytes(receivedBytes || 0)} / ${formatBytes(fileSize || 0)}`;
  }
  if (pctEl && state === 'paused') {
    pctEl.textContent = Math.round(progress || 0) + '%';
  }
  if (iconEl) iconEl.textContent = state === 'paused' ? '⏸' : '📥';
  renderDownloadActions(el, { id, state });
});

window.api.onDownloadComplete(({ id, fileName, savePath }) => {
  const el = downloads[id];
  if (!el) return;
  const fill = el.querySelector(`#dl-fill-${id}`);
  const sizeEl = el.querySelector('.dl-size');
  const pctEl = el.querySelector('.dl-pct');
  const iconEl = el.querySelector('.dl-icon');
  if (fill) {
    fill.style.width = '100%';
    fill.className = 'dl-bar-fill complete';
  }
  if (sizeEl) sizeEl.textContent = savePath || fileName;
  if (pctEl) {
    pctEl.className = 'dl-pct dl-status-complete';
    pctEl.textContent = t('downloads.complete');
  }
  if (iconEl) iconEl.textContent = '✅';
  renderDownloadActions(el, { id, state: 'completed' });
});

window.api.onDownloadCancelled(({ id }) => {
  const el = downloads[id];
  if (el) el.remove();
  delete downloads[id];
  if (Object.keys(downloads).length === 0) {
    downloadsList.innerHTML = `<div class="dl-empty">${t('downloads.empty')}</div>`;
  }
});

window.api.onDownloadError(({ id }) => {
  const el = downloads[id];
  if (!el) return;
  const fill = el.querySelector(`#dl-fill-${id}`);
  const pctEl = el.querySelector('.dl-pct');
  const iconEl = el.querySelector('.dl-icon');
  if (fill) fill.className = 'dl-bar-fill error';
  if (pctEl) {
    pctEl.className = 'dl-pct dl-status-error';
    pctEl.textContent = t('downloads.error');
  }
  if (iconEl) iconEl.textContent = '❌';
  const cancelBtn = el.querySelector('.dl-cancel');
  if (cancelBtn) cancelBtn.remove();
  delete downloads[id];
});

closeDownloadsBtn.addEventListener('click', () => {
  window.api.closeDownloadsWindow();
});

if (window.api && window.api.loadSettings) {
  window.api.loadSettings().then(config => {
    applyLanguage(config.language || 'es');
    loadActiveDownloads();
  });
}
if (window.api && window.api.onSettingsUpdated) {
  window.api.onSettingsUpdated((config) => {
    if (config.language !== undefined) {
      applyLanguage(config.language);
      loadActiveDownloads();
    }
  });
}

if (!window.api || !window.api.loadSettings) {
  loadActiveDownloads();
}
