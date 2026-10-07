(() => {
  'use strict';
  // Personal editing tools are available only in the local preview.
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) return;
  const key = 'portfolio-text-edits-v1';
  const toggle = document.getElementById('editTextToggle');
  let edits = {};
  try { edits = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  let editing = false;
  let active = null;
  const toolbar = document.createElement('div');
  toolbar.className = 'text-editor-bar';
  toolbar.hidden = true;
  toolbar.innerHTML = '<span>点击文字即可修改或清空</span><span class="text-editor-status" role="status">自动保存到当前浏览器</span><button data-editor="export">导出备份</button><button data-editor="import">导入备份</button><button data-editor="done">完成编辑</button><input type="file" accept="application/json,.json" hidden>';
  document.body.append(toolbar);
  if (toggle) toggle.hidden = false;

  function selectorFor(el) {
    const parts = [];
    while (el && el !== document.body) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); break; }
      const tag = el.tagName.toLowerCase();
      const peers = [...el.parentElement.children].filter(n => n.tagName === el.tagName);
      parts.unshift(tag + ':nth-of-type(' + (peers.indexOf(el) + 1) + ')');
      el = el.parentElement;
    }
    return parts.join(' > ');
  }
  function writeText(el, text) {
    el.replaceChildren();
    text.split('\n').forEach((line, i) => {
      if (i) el.append(document.createElement('br'));
      el.append(document.createTextNode(line));
    });
  }
  function storedText(el) {
    let text = '';
    const walk = node => {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
      else if (node.nodeName === 'BR') text += '\n';
      else node.childNodes.forEach(walk);
    };
    el.childNodes.forEach(walk);
    return text;
  }
  function applyEdits() {
    let migrated = false;
    Object.entries(edits).forEach(([selector, text]) => {
      let el;
      try { el = document.querySelector(selector); } catch { return; }
      if (!el || el === active || el.closest('#ticket') || !el.closest('.layout, #intro')) return;
      // Keep each award's text attached to its identity when cards are reordered.
      if (selector.startsWith('#honors-wall >') && el.closest('.award[id], .honors__col[id]')) {
        const stableSelector = selectorFor(el);
        if (!Object.hasOwn(edits, stableSelector)) edits[stableSelector] = text;
        else text = edits[stableSelector];
        delete edits[selector];
        migrated = true;
      }
      if (el.closest('[data-text-edit-locked]')) {
        delete edits[selector];
        try { localStorage.setItem(key, JSON.stringify(edits)); } catch {}
        return;
      }
      if (storedText(el) !== text) writeText(el, text);
      if (el.hasAttribute('data-count')) el.removeAttribute('data-count');
    });
    if (migrated) try { localStorage.setItem(key, JSON.stringify(edits)); } catch {}
  }
  const status = toolbar.querySelector('[role="status"]');
  function saveActive() {
    if (!active) return;
    edits[selectorFor(active)] = active.innerText.replace(/\r/g, '');
    try {
      localStorage.setItem(key, JSON.stringify(edits));
      status.textContent = '已保存到当前浏览器';
    } catch { status.textContent = '浏览器保存失败，请导出备份'; }
  }
  function finishActive() {
    if (!active) return;
    saveActive();
    active.removeAttribute('contenteditable');
    active.classList.remove('text-editor-active');
    active = null;
  }
  function setEditing(on) {
    finishActive();
    editing = on;
    toolbar.hidden = !on;
    if (toggle) toggle.textContent = on ? '完成编辑' : '编辑文字';
    document.body.classList.toggle('is-editing-text', on);
  }
  toggle?.addEventListener('click', () => setEditing(!editing));
  document.addEventListener('click', e => {
    if (!editing || toolbar.contains(e.target) || toggle?.contains(e.target)) return;
    // Watching a work should still open the player while the editing tools are on.
    if (e.target.closest('[data-vid]')) { setEditing(false); return; }
    if (active?.contains(e.target)) { e.stopImmediatePropagation(); return; }
    const el = e.target.closest('h1,h2,h3,h4,p,li,td,th,figcaption,span,mark,strong,b,i,em,small,a,button');
    if (!el || !el.closest('.layout, #intro') || el.closest('#ticket, [data-text-edit-locked], [aria-hidden="true"], .text-editor-bar') || el.querySelector('img,video,button,input') || (!el.textContent.trim() && !Object.hasOwn(edits,selectorFor(el)))) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    finishActive();
    active = el;
    if (active.hasAttribute('data-count')) active.removeAttribute('data-count');
    active.setAttribute('contenteditable', 'plaintext-only');
    active.classList.add('text-editor-active');
    active.focus({ preventScroll:true });
  }, true);
  document.addEventListener('input', e => { if (active?.contains(e.target)) saveActive(); });
  document.addEventListener('keydown', e => {
    if (!editing) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setEditing(false); }
    else if (active?.contains(e.target)) e.stopImmediatePropagation();
  }, true);
  toolbar.querySelector('[data-editor="done"]').addEventListener('click', () => setEditing(false));
  toolbar.querySelector('[data-editor="export"]').addEventListener('click', () => {
    saveActive();
    const url = URL.createObjectURL(new Blob([JSON.stringify({version:1,edits,honorsOrder:window.HonorsOrder?.get()},null,2)],{type:'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = '个人档案室-文字备份.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const input = toolbar.querySelector('input');
  toolbar.querySelector('[data-editor="import"]').addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (backup.version !== 1 || !backup.edits || typeof backup.edits !== 'object' || Array.isArray(backup.edits) || !Object.values(backup.edits).every(v => typeof v === 'string')) throw Error();
      finishActive();
      edits = {...edits,...backup.edits};
      localStorage.setItem(key, JSON.stringify(edits));
      applyEdits(); status.textContent = '备份已导入';
      if (backup.honorsOrder) window.HonorsOrder?.import(backup.honorsOrder);
    } catch { status.textContent = '无法导入，请选择导出的文字备份'; }
    input.value = '';
  });
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; applyEdits(); });
  }).observe(document.querySelector('.layout'), {childList:true,subtree:true,characterData:true});
  applyEdits();
})();
