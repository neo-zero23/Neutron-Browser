const favoritesList = document.getElementById('favorites-list');
const closeFavoritesBtn = document.getElementById('close-favorites-btn');
const I18N = window.NeutronI18n;
let currentLanguage = 'es';

function t(path) {
  return I18N ? I18N.t(currentLanguage, path) : path;
}

function applyLanguage(lang) {
  currentLanguage = I18N ? I18N.normalize(lang) : (lang || 'es');
  if (I18N) I18N.applyFavoritesPage(currentLanguage);
}

async function renderFavorites() {
  const favorites = await window.api.getFavorites();
  favoritesList.innerHTML = '';

  if (!favorites || favorites.length === 0) {
    favoritesList.innerHTML = `<div class="favorites-empty">${t('favorites.empty')}</div>`;
    return;
  }

  for (const fav of favorites) {
    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.innerHTML = `
      <span class="favorite-star-icon">★</span>
      <div class="favorite-info">
        <div class="favorite-title">${fav.title || fav.url}</div>
        <div class="favorite-url">${fav.url}</div>
      </div>
      <button class="favorite-remove-btn" title="${t('favorites.remove')}">✕</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.favorite-remove-btn')) return;
      window.api.navigateTo(fav.url);
    });

    item.querySelector('.favorite-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.removeFavorite(fav.url);
      item.remove();
      if (favoritesList.children.length === 0 || (favoritesList.children.length === 1 && favoritesList.children[0].classList.contains('favorites-empty'))) {
        favoritesList.innerHTML = `<div class="favorites-empty">${t('favorites.empty')}</div>`;
      }
    });

    favoritesList.appendChild(item);
  }
}

closeFavoritesBtn.addEventListener('click', () => {
  window.api.closeFavoritesWindow();
});

if (window.api && window.api.loadSettings) {
  window.api.loadSettings().then(config => {
    applyLanguage(config.language || 'es');
    renderFavorites();
  });
}
if (window.api && window.api.onSettingsUpdated) {
  window.api.onSettingsUpdated((config) => {
    if (config.language !== undefined) {
      applyLanguage(config.language);
      renderFavorites();
    }
  });
}

if (!window.api || !window.api.loadSettings) {
  renderFavorites();
}
