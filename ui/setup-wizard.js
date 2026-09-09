/* Neutron Setup Wizard v1.1 — lógica 5 pasos */
(function () {
  const state = {
    step: 1, total: 5,
    language: 'es', theme: 'dark',
    searchEngine: 'google', accentColor: '#4ea8de', density: 'comfortable',
    shieldEnabled: true, blockAds: true, blockTrackers: true,
    doNotTrack: false, disableWebRTC: false,
    profileName: '', restoreSession: false, showSidebar: true
  };

  const I18N = window.NeutronI18n;
  function t(key) { return (I18N ? I18N.t(state.language, key) : key) || key; }
  function translate() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.getElementById('wiz-step-label').textContent =
      (state.language === 'en' ? `Step ${state.step} of ${state.total}` : `Paso ${state.step} de ${state.total}`);
  }

  function showStep(n) {
    state.step = Math.min(Math.max(n, 1), state.total);
    document.querySelectorAll('.wiz-step').forEach(s => {
      s.classList.toggle('hidden', Number(s.dataset.step) !== state.step);
    });
    document.getElementById('wiz-progress-fill').style.width = (state.step / state.total * 100) + '%';
    document.getElementById('wiz-back').disabled = state.step === 1;
    document.getElementById('wiz-next').textContent = state.step === state.total
      ? t('onboarding.start') : '→';
    if (state.step === state.total) renderSummary();
    translate();
  }

  function renderSummary() {
    const el = document.getElementById('wiz-summary');
    el.textContent =
      `Idioma: ${state.language} | Tema: ${state.theme}\n` +
      `Buscador: ${state.searchEngine} | Acento: ${state.accentColor} | Densidad: ${state.density}\n` +
      `Shield: ${state.shieldEnabled ? 'ON' : 'OFF'} (ads:${state.blockAds ? 'Y' : 'N'} trackers:${state.blockTrackers ? 'Y' : 'N'})\n` +
      `DNT:${state.doNotTrack ? 'Y' : 'N'} WebRTC-off:${state.disableWebRTC ? 'Y' : 'N'}\n` +
      `Perfil: ${state.profileName || 'Default'} | restoreSession:${state.restoreSession ? 'Y' : 'N'}`;
  }

  function bindGroup(selector, attr, key) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state[key] = btn.getAttribute(attr);
        if (key === 'language') translate();
      });
    });
  }

  function finish(sendDefaults) {
    const btn = document.getElementById('wiz-next');
    btn.disabled = true;
    const payload = sendDefaults ? { language: 'es', theme: 'dark', timestamp: Date.now(), skipped: true } : { ...state, timestamp: Date.now() };
    // profileName se aplica en main.js al crear perfil default si viene distinto
    if (window.onboarding && window.onboarding.sendComplete) {
      window.onboarding.sendComplete(payload);
    }
    // main.js destruye la ventana; no cerrar aquí
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindGroup('.lang-btn', 'data-language', 'language');
    bindGroup('.theme-btn', 'data-theme', 'theme');
    bindGroup('.engine-btn', 'data-engine', 'searchEngine');
    bindGroup('.accent-btn', 'data-accent', 'accentColor');
    bindGroup('.density-btn', 'data-density', 'density');
    // defaults activos
    const mark = (sel, attr, val) => {
      const b = document.querySelector(`${sel}[${attr}="${val}"]`);
      if (b) b.classList.add('active');
    };
    mark('.lang-btn', 'data-language', 'es');
    mark('.theme-btn', 'data-theme', 'dark');
    mark('.engine-btn', 'data-engine', 'google');
    mark('.accent-btn', 'data-accent', '#4ea8de');
    mark('.density-btn', 'data-density', 'comfortable');

    ['shield', 'blockAds', 'blockTrackers', 'doNotTrack', 'disableWebRTC', 'restoreSession', 'showSidebar'].forEach(id => {
      const map = { shield: 'shieldEnabled', blockAds: 'blockAds', blockTrackers: 'blockTrackers', doNotTrack: 'doNotTrack', disableWebRTC: 'disableWebRTC', restoreSession: 'restoreSession', showSidebar: 'showSidebar' };
      const input = document.getElementById('wiz-' + id);
      if (input) input.addEventListener('change', () => { state[map[id]] = input.checked; });
    });
    document.getElementById('wiz-profile-name').addEventListener('input', e => { state.profileName = e.target.value.trim().slice(0, 24); });

    document.getElementById('wiz-back').addEventListener('click', () => showStep(state.step - 1));
    document.getElementById('wiz-next').addEventListener('click', () => {
      if (state.step < state.total) showStep(state.step + 1);
      else finish(false);
    });
    document.getElementById('wiz-skip').addEventListener('click', () => finish(true));

    showStep(1);
  });
})();
