(function() {
  if (window.__LS_PROXY_PATCHED__) return;
  const HIDDEN_ROLES = new Set(['system', 'tool', 'thinking']);

  function isVisible(node) {
    const role = node.message?.author?.role;
    return !!role && !HIDDEN_ROLES.has(role);
  }

  function trimMapping(mapping, currentId, limit) {
    const path = [];
    let cursor = currentId;
    const visited = new Set();
    while (cursor) {
      const node = mapping[cursor];
      if (!node || visited.has(cursor)) break;
      visited.add(cursor);
      path.push(cursor);
      cursor = node.parent || null;
    }
    path.reverse();

    let turnCount = 0, cutIndex = 0, lastRole = null;
    for (let i = path.length - 1; i >= 0; i--) {
      const node = mapping[path[i]];
      if (node && isVisible(node)) {
        const role = node.message.author.role;
        if (role !== lastRole) { turnCount++; lastRole = role; }
        if (turnCount > limit) { cutIndex = i + 1; break; }
      }
    }

    const kept = path.slice(cutIndex);
    if (kept.filter(id => isVisible(mapping[id])).length === 0) return null;

    const rootId = path[0];
    const rootNode = rootId ? mapping[rootId] : null;
    const hasRoot = rootId && rootNode && !isVisible(rootNode);

    const newMapping = {};
    if (hasRoot) {
      newMapping[rootId] = { ...rootNode, parent: null, children: kept[0] ? [kept[0]] : [] };
    }
    for (let i = 0; i < kept.length; i++) {
      const prev = i === 0 ? (hasRoot ? rootId : null) : kept[i - 1];
      const next = kept[i + 1] || null;
      newMapping[kept[i]] = { ...mapping[kept[i]], parent: prev, children: next ? [next] : [] };
    }
    return {
      mapping: newMapping,
      current_node: kept[kept.length - 1],
      root: hasRoot ? rootId : kept[0],
    };
  }

  function getConfig() {
    try {
      const stored = localStorage.getItem('ls_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { enabled: true, limit: 10 };
  }

  async function proxyFetch(nativeFetch, ...args) {
    const [input, init] = args;
    let urlStr, method;
    if (input instanceof Request) { urlStr = input.url; method = (init?.method || input.method || 'GET').toUpperCase(); }
    else if (input instanceof URL) { urlStr = input.href; method = (init?.method || 'GET').toUpperCase(); }
    else { urlStr = String(input); method = (init?.method || 'GET').toUpperCase(); }

    if (method !== 'GET') return nativeFetch(...args);
    try {
      const url = new URL(urlStr, location.href);
      if (!/^\/backend-api\/(conversation|shared_conversation)\/[^/]+\/?$/.test(url.pathname)) {
        return nativeFetch(...args);
      }
    } catch (e) { return nativeFetch(...args); }

    const cfg = getConfig();
    if (!cfg.enabled) return nativeFetch(...args);

    const res = await nativeFetch(...args);
    try {
      const ct = res.headers.get('content-type') || '';
      if (!ct.toLowerCase().includes('application/json')) return res;
      const clone = res.clone();
      const json = await clone.json();
      if (!json || !json.mapping || !json.current_node) return res;
      const trimmed = trimMapping(json.mapping, json.current_node, Math.max(1, cfg.limit || 10));
      if (!trimmed) return res;
      const modified = { ...json, ...trimmed };
      const headers = new Headers(res.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.set('content-type', 'application/json; charset=utf-8');
      const newRes = new Response(JSON.stringify(modified), { status: res.status, statusText: res.statusText, headers });
      try { Object.defineProperty(newRes, 'url', { value: res.url }); } catch (e) {}
      try { Object.defineProperty(newRes, 'type', { value: res.type }); } catch (e) {}
      return newRes;
    } catch (e) { return res; }
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function() { return proxyFetch(nativeFetch, ...arguments); };
  window.__LS_PROXY_PATCHED__ = true;
})();
