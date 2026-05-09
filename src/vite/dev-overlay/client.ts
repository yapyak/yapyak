export const CLIENT_SCRIPT = `
(() => {
  if (window.__yapyakOverlayInjected) return;
  window.__yapyakOverlayInjected = true;

  const API = '/.yapyak';
  const STYLE = \`
    .yp-root { all: initial; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #1a1a1a; }
    .yp-fab { all: initial; position: fixed; bottom: 16px; right: 16px; z-index: 2147483646; cursor: pointer;
              background: #1a1a1a; color: white; width: 44px; height: 44px; border-radius: 22px;
              display: flex; align-items: center; justify-content: center; font-size: 18px;
              box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: transform 120ms; }
    .yp-fab:hover { transform: scale(1.05); }
    .yp-panel { all: initial; position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 90vw;
                z-index: 2147483647; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.12);
                display: flex; flex-direction: column; font-family: system-ui, sans-serif; font-size: 13px;
                color: #1a1a1a; }
    .yp-panel-header { padding: 14px 16px; border-bottom: 1px solid #e5e5e5; display: flex;
                       align-items: center; gap: 8px; }
    .yp-panel-title { font-weight: 600; font-size: 14px; flex: 1; }
    .yp-panel-close { all: initial; cursor: pointer; padding: 4px 8px; border-radius: 4px; color: #666;
                     font-size: 16px; line-height: 1; }
    .yp-panel-close:hover { background: #f0f0f0; }
    .yp-search { all: initial; display: block; width: 100%; box-sizing: border-box; padding: 8px 12px;
                 border: 1px solid #d4d4d4; border-radius: 6px; font-size: 13px; font-family: inherit;
                 color: #1a1a1a; background: white; outline: none; }
    .yp-search:focus { border-color: #1a1a1a; }
    .yp-panel-search-row { padding: 12px 16px; border-bottom: 1px solid #e5e5e5; }
    .yp-list { flex: 1; overflow-y: auto; }
    .yp-list-item { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer;
                    transition: background 80ms; }
    .yp-list-item:hover { background: #fafafa; }
    .yp-list-item.expanded { background: #fafafa; }
    .yp-list-source { font-weight: 500; line-height: 1.4; word-break: break-word; }
    .yp-list-meta { color: #888; font-size: 11px; margin-top: 4px; font-family: ui-monospace, monospace; }
    .yp-list-incomplete { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 3px;
                          background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 600;
                          text-transform: uppercase; letter-spacing: 0.05em; }
    .yp-section-header { padding: 8px 16px; background: #fafafa; border-bottom: 1px solid #e5e5e5;
                          font-size: 11px; font-weight: 600; text-transform: uppercase;
                          letter-spacing: 0.05em; color: #666; display: flex; align-items: center;
                          justify-content: space-between; gap: 8px; position: sticky; top: 0; z-index: 1; }
    .yp-section-count { font-weight: 500; color: #999; }
    .yp-toggle { all: initial; cursor: pointer; padding: 2px 8px; border-radius: 3px;
                  font-size: 10px; font-family: inherit; color: #666; background: white;
                  border: 1px solid #d4d4d4; }
    .yp-toggle.active { background: #1a1a1a; color: white; border-color: #1a1a1a; }
    .yp-detail { padding: 16px; background: white; border-bottom: 1px solid #f0f0f0; }
    .yp-locale-row { margin-bottom: 14px; }
    .yp-locale-row:last-child { margin-bottom: 0; }
    .yp-locale-label { display: flex; align-items: center; justify-content: space-between;
                       margin-bottom: 6px; }
    .yp-locale-tag { font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;
                     color: #666; font-family: ui-monospace, monospace; }
    .yp-locale-actions { display: flex; gap: 4px; }
    .yp-btn { all: initial; cursor: pointer; padding: 4px 10px; border-radius: 4px; font-size: 11px;
              font-family: inherit; transition: background 80ms; }
    .yp-btn-secondary { background: #f0f0f0; color: #1a1a1a; }
    .yp-btn-secondary:hover { background: #e5e5e5; }
    .yp-btn-primary { background: #1a1a1a; color: white; }
    .yp-btn-primary:hover { background: #333; }
    .yp-btn:disabled { opacity: 0.5; cursor: wait; }
    .yp-textarea { all: initial; display: block; width: 100%; box-sizing: border-box; padding: 8px 10px;
                   border: 1px solid #d4d4d4; border-radius: 4px; font-size: 13px; font-family: inherit;
                   color: #1a1a1a; background: white; outline: none; resize: vertical; min-height: 36px;
                   line-height: 1.4; }
    .yp-textarea:focus { border-color: #1a1a1a; }
    .yp-textarea.missing { background: #fffbeb; border-color: #fbbf24; }
    .yp-empty { padding: 32px 16px; text-align: center; color: #888; }
    .yp-spinner { display: inline-block; width: 11px; height: 11px; border: 1.5px solid currentColor;
                  border-right-color: transparent; border-radius: 50%; animation: yp-spin 600ms linear infinite;
                  vertical-align: -2px; }
    @keyframes yp-spin { to { transform: rotate(360deg); } }
  \`;

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  let panelEl = null;
  let listEl = null;
  let allMessages = [];
  let currentDetails = new Map();
  let expandedHash = null;
  let searchValue = '';
  let scope = 'page';

  async function api(method, path, body) {
    const init = { method, headers: { 'content-type': 'application/json' } };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await fetch(API + path, init);
    if (res.status === 204) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(\`\${method} \${path} → \${res.status}: \${text}\`);
    }
    return res.json();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fab() {
    const el = document.createElement('button');
    el.className = 'yp-fab yp-root';
    el.title = 'Yapyak translations';
    el.innerHTML = '🐂';
    el.onclick = openPanel;
    return el;
  }

  async function openPanel() {
    if (panelEl) return;
    panelEl = document.createElement('div');
    panelEl.className = 'yp-panel yp-root';
    panelEl.innerHTML = \`
      <div class="yp-panel-header">
        <div class="yp-panel-title">🐂 Yapyak translations</div>
        <button class="yp-panel-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="yp-panel-search-row">
        <input class="yp-search" placeholder="Search by text or file…" />
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="yp-toggle active" data-scope="page" type="button">On this page</button>
          <button class="yp-toggle" data-scope="all" type="button">All</button>
        </div>
      </div>
      <div class="yp-list"></div>
    \`;
    document.body.appendChild(panelEl);
    panelEl.querySelector('.yp-panel-close').onclick = closePanel;
    const search = panelEl.querySelector('.yp-search');
    search.addEventListener('input', (e) => {
      searchValue = e.target.value.toLowerCase();
      renderList();
    });
    panelEl.querySelectorAll('[data-scope]').forEach((btn) => {
      btn.addEventListener('click', () => {
        scope = btn.dataset.scope;
        panelEl.querySelectorAll('[data-scope]').forEach((b) =>
          b.classList.toggle('active', b.dataset.scope === scope),
        );
        renderList();
      });
    });
    listEl = panelEl.querySelector('.yp-list');
    listEl.innerHTML = '<div class="yp-empty">Loading…</div>';
    try {
      allMessages = await api('GET', '/messages');
      renderList();
    } catch (err) {
      listEl.innerHTML = \`<div class="yp-empty">Failed to load: \${escapeHtml(err.message)}</div>\`;
    }

    if (!window.__yapyakSeenListener) {
      window.__yapyakSeenListener = true;
      let pending = false;
      window.addEventListener('yapyak:seen-changed', () => {
        if (pending || !listEl) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          renderList();
        });
      });
    }
  }

  function closePanel() {
    if (panelEl) {
      panelEl.remove();
      panelEl = null;
      listEl = null;
      expandedHash = null;
      currentDetails.clear();
    }
  }

  function matchesSearch(msg) {
    if (!searchValue) return true;
    return (
      msg.source.toLowerCase().includes(searchValue) ||
      msg.fileId.toLowerCase().includes(searchValue) ||
      (msg.componentName ?? '').toLowerCase().includes(searchValue)
    );
  }

  function renderList() {
    if (!listEl) return;
    const seen = window.__yapyakSeen ?? new Set();
    const onPage = allMessages.filter((m) => seen.has(m.hash) && matchesSearch(m));
    const others = allMessages.filter((m) => !seen.has(m.hash) && matchesSearch(m));

    listEl.innerHTML = '';

    if (scope === 'page') {
      if (onPage.length === 0) {
        listEl.innerHTML =
          '<div class="yp-empty">No translations rendered on this page yet. Switch to "All" to see everything.</div>';
        return;
      }
      renderSection('On this page', onPage);
      return;
    }

    if (onPage.length > 0) {
      renderSection('On this page', onPage);
    }
    if (others.length > 0) {
      renderSection('Elsewhere', others);
    }
    if (onPage.length === 0 && others.length === 0) {
      listEl.innerHTML = '<div class="yp-empty">No messages.</div>';
    }
  }

  function renderSection(label, messages) {
    const header = document.createElement('div');
    header.className = 'yp-section-header';
    header.innerHTML = \`<span>\${escapeHtml(label)}</span><span class="yp-section-count">\${messages.length}</span>\`;
    listEl.appendChild(header);
    for (const msg of messages) {
      const item = document.createElement('div');
      item.className = 'yp-list-item';
      if (msg.hash === expandedHash) item.classList.add('expanded');
      const incomplete = isIncomplete(msg.hash);
      item.innerHTML = \`
        <div class="yp-list-source">
          \${escapeHtml(msg.source)}
          \${incomplete ? '<span class="yp-list-incomplete">missing</span>' : ''}
        </div>
        <div class="yp-list-meta">\${msg.componentName ? escapeHtml(msg.componentName) + ' · ' : ''}\${escapeHtml(msg.fileId)}</div>
      \`;
      item.addEventListener('click', () => toggle(msg.hash, item));
      listEl.appendChild(item);
      if (msg.hash === expandedHash) {
        const detail = currentDetails.get(msg.hash);
        if (detail) {
          item.appendChild(renderDetail(detail));
        }
      }
    }
  }

  function isIncomplete(hash) {
    const detail = currentDetails.get(hash);
    if (!detail) return false;
    return Object.values(detail.translations).some((v) => v === null);
  }

  async function toggle(hash, itemEl) {
    if (expandedHash === hash) {
      expandedHash = null;
      const old = itemEl.querySelector('.yp-detail');
      if (old) old.remove();
      itemEl.classList.remove('expanded');
      return;
    }
    if (expandedHash) {
      const oldItem = listEl.querySelector('.yp-list-item.expanded');
      if (oldItem) {
        oldItem.classList.remove('expanded');
        const old = oldItem.querySelector('.yp-detail');
        if (old) old.remove();
      }
    }
    expandedHash = hash;
    itemEl.classList.add('expanded');
    let detail = currentDetails.get(hash);
    if (!detail) {
      const placeholder = document.createElement('div');
      placeholder.className = 'yp-detail';
      placeholder.addEventListener('click', (e) => e.stopPropagation());
      placeholder.innerHTML = '<div class="yp-empty">Loading…</div>';
      itemEl.appendChild(placeholder);
      try {
        detail = await api('GET', \`/messages/\${hash}\`);
        currentDetails.set(hash, detail);
        placeholder.replaceWith(renderDetail(detail));
      } catch (err) {
        placeholder.innerHTML = \`<div class="yp-empty">\${escapeHtml(err.message)}</div>\`;
      }
    } else {
      itemEl.appendChild(renderDetail(detail));
    }
  }

  function renderDetail(detail) {
    const wrap = document.createElement('div');
    wrap.className = 'yp-detail';
    wrap.addEventListener('click', (e) => e.stopPropagation());
    const locales = Object.keys(detail.translations);
    for (const locale of locales) {
      const value = detail.translations[locale];
      const row = document.createElement('div');
      row.className = 'yp-locale-row';
      row.innerHTML = \`
        <div class="yp-locale-label">
          <span class="yp-locale-tag">\${escapeHtml(locale)}</span>
          <div class="yp-locale-actions">
            <button class="yp-btn yp-btn-secondary" data-action="regenerate" type="button">🤖 AI</button>
            <button class="yp-btn yp-btn-primary" data-action="save" type="button">Save</button>
          </div>
        </div>
        <textarea class="yp-textarea\${value === null ? ' missing' : ''}">\${escapeHtml(value ?? '')}</textarea>
      \`;
      const textarea = row.querySelector('textarea');
      const saveBtn = row.querySelector('[data-action=save]');
      const regenBtn = row.querySelector('[data-action=regenerate]');
      saveBtn.onclick = async () => {
        await action(saveBtn, async () => {
          const updated = await api('PATCH', \`/messages/\${detail.hash}/translations/\${locale}\`, {
            value: textarea.value,
          });
          currentDetails.set(detail.hash, updated);
          textarea.value = updated.translations[locale] ?? '';
          textarea.classList.toggle('missing', updated.translations[locale] === null);
        });
      };
      regenBtn.onclick = async () => {
        await action(regenBtn, async () => {
          const updated = await api(
            'POST',
            \`/messages/\${detail.hash}/translations/\${locale}/regenerate\`,
          );
          currentDetails.set(detail.hash, updated);
          textarea.value = updated.translations[locale] ?? '';
          textarea.classList.toggle('missing', updated.translations[locale] === null);
        });
      };
      wrap.appendChild(row);
    }
    return wrap;
  }

  async function action(button, fn) {
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="yp-spinner"></span>';
    try {
      await fn();
    } catch (err) {
      alert('yapyak: ' + err.message);
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  }

  document.body.appendChild(fab());
})();
`;
