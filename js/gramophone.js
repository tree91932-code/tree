(() => {
  'use strict';
  const button = document.getElementById('studyMusic');
  const label = document.getElementById('studyMusicLabel');
  const dock = document.createElement('div');
  dock.className = 'music-edge';
  dock.dataset.expanded = 'false';
  dock.innerHTML = '<button type="button" class="music-edge__peek" aria-label="展开音乐控制" aria-expanded="false"><svg class="music-edge__notes" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 18V5l12-3v13M8 9l12-3"/><ellipse cx="5.5" cy="18" rx="2.5" ry="1.8"/><ellipse cx="17.5" cy="15" rx="2.5" ry="1.8"/></svg></button><button type="button" class="music-edge__toggle" aria-label="播放背景音乐" aria-pressed="false" tabindex="-1"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11"/><path class="music-edge__play" d="M14 11l8 5-8 5z"/><path class="music-edge__pause" d="M13 11v10m6-10v10"/></svg></button>';
  document.body.append(dock);
  const peek = dock.querySelector('.music-edge__peek');
  const toggle = dock.querySelector('.music-edge__toggle');
  let collapseTimer;
  // Distinguish a drag from a normal play/pause click.
  let musicDrag = null, suppressMusicClickUntil = 0;
  function placeMusicDock(x, y) {
    const width = dock.offsetWidth, height = dock.offsetHeight;
    dock.dataset.positioned = 'true';
    dock.style.left = Math.max(0, Math.min(innerWidth - width, x)) + 'px';
    dock.style.top = Math.max(0, Math.min(innerHeight - height, y)) + 'px';
    dock.style.right = 'auto';
  }
  dock.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const rect = dock.getBoundingClientRect();
    musicDrag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:rect.left, top:rect.top, moved:false};
  });
  window.addEventListener('pointermove', event => {
    if (!musicDrag || event.pointerId !== musicDrag.id) return;
    const dx = event.clientX - musicDrag.x, dy = event.clientY - musicDrag.y;
    if (!musicDrag.moved && Math.hypot(dx, dy) < 6) return;
    if (!musicDrag.moved) {
      musicDrag.moved = true;
      clearTimeout(collapseTimer);
      dock.dataset.dragging = 'true';
      try { dock.setPointerCapture(event.pointerId); } catch {}
    }
    event.preventDefault();
    placeMusicDock(musicDrag.left + dx, musicDrag.top + dy);
  }, {passive:false});
  const finishMusicDrag = event => {
    if (!musicDrag || event.pointerId !== musicDrag.id) return;
    const moved = musicDrag.moved;
    musicDrag = null;
    delete dock.dataset.dragging;
    if (moved) {
      suppressMusicClickUntil = Date.now() + 500;
      try { dock.releasePointerCapture(event.pointerId); } catch {}
      if (dock.dataset.expanded === 'true') expand(true);
    }
  };
  window.addEventListener('pointerup', finishMusicDrag);
  window.addEventListener('pointercancel', finishMusicDrag);
  dock.addEventListener('click', event => {
    if (event.detail !== 0 && Date.now() < suppressMusicClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('resize', () => {
    if (dock.dataset.positioned !== 'true') return;
    placeMusicDock(parseFloat(dock.style.left), parseFloat(dock.style.top));
  });
  function expand(on) {
    dock.dataset.expanded = String(on);
    peek.setAttribute('aria-expanded',String(on));
    peek.tabIndex = on || !matchMedia('(max-width:900px)').matches ? -1 : 0;
    toggle.tabIndex = on || !matchMedia('(max-width:900px)').matches ? 0 : -1;
    clearTimeout(collapseTimer);
    if (on) collapseTimer = setTimeout(() => expand(false), 4500);
  }
  expand(false);
  peek.addEventListener('click', () => { expand(true); toggle.focus({preventScroll:true}); });
  document.addEventListener('pointerdown', event => { if (!dock.contains(event.target)) expand(false); });
  dock.addEventListener('keydown', event => { if (event.key === 'Escape') { expand(false); peek.focus({preventScroll:true}); } });
  const audio = document.getElementById('gramophoneAudio') || new Audio('assets/audio/satie-gymnopedie-1-ready.m4a');
  audio.id = 'gramophoneAudio';
  audio.preload = 'none';
  audio.loop = true;
  audio.volume = .9;
  audio.hidden = true;
  if (!audio.isConnected) document.body.append(audio);
  let pending = false, buffering = false, generation = 0;
  let wasIntro = document.body.classList.contains('is-intro');
  function sync() {
    const on = !audio.paused;
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? '暂停书房音乐' : '播放书房音乐');
    button.title = '萨蒂 · 第一号吉姆诺佩蒂 / 钢琴：Robin Alciatore / Musopen';
    label.textContent = pending || buffering ? '音乐加载中…' : (on ? '暂停音乐' : '播放音乐');
    toggle.setAttribute('aria-pressed',String(on));
    toggle.setAttribute('aria-label',on ? '暂停背景音乐' : '播放背景音乐');
    dock.dataset.playing = String(on);
  }
  function stop() { generation++; pending = false; buffering = false; audio.pause(); sync(); }
  async function toggleMusic() {
    if (!audio.paused || pending) return stop();
    const token = ++generation;
    pending = true;
    sync();
    try {
      await audio.play();
      if (token !== generation || document.hidden) {
        if (token === generation) stop();
        return;
      }
      sync();
    } catch (error) {
      if (token === generation && error.name !== 'AbortError') {
        label.textContent = '点击重试';
        toggle.setAttribute('aria-label','音乐加载失败，点击重试');
      }
    } finally { if (token === generation) { pending = false; if (label.textContent !== '点击重试') sync(); } }
  }
  button.addEventListener('click',toggleMusic);
  toggle.addEventListener('click',() => { toggleMusic(); expand(true); });
  audio.addEventListener('pause',sync);
  audio.addEventListener('play',sync);
  audio.addEventListener('waiting', () => { buffering = true; sync(); });
  audio.addEventListener('playing', () => { buffering = false; sync(); });
  new MutationObserver(() => {
    const intro = document.body.classList.contains('is-intro');
    if (document.body.classList.contains('is-watching')) stop();
    wasIntro = intro;
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',() => { if (document.hidden) stop(); });
  window.addEventListener('pagehide',stop);
  sync();
})();
