(() => {
  'use strict';
  const button = document.getElementById('studyMusic');
  const label = document.getElementById('studyMusicLabel');
  const dock = document.createElement('div');
  dock.className = 'music-edge';
  dock.dataset.expanded = 'false';
  dock.innerHTML = '<button type="button" class="music-edge__peek" aria-label="展开音乐控制" aria-expanded="false"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5"/><circle cx="16" cy="16" r="1"/></svg></button><button type="button" class="music-edge__toggle" aria-label="播放背景音乐" aria-pressed="false" tabindex="-1"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11"/><path class="music-edge__play" d="M14 11l8 5-8 5z"/><path class="music-edge__pause" d="M13 11v10m6-10v10"/></svg></button>';
  document.body.append(dock);
  const peek = dock.querySelector('.music-edge__peek');
  const toggle = dock.querySelector('.music-edge__toggle');
  let collapseTimer;
  function expand(on) {
    dock.dataset.expanded = String(on);
    peek.setAttribute('aria-expanded',String(on));
    peek.tabIndex = on ? -1 : 0;
    toggle.tabIndex = on ? 0 : -1;
    clearTimeout(collapseTimer);
    if (on) collapseTimer = setTimeout(() => expand(false), 4500);
  }
  peek.addEventListener('click', () => { expand(true); toggle.focus({preventScroll:true}); });
  document.addEventListener('pointerdown', event => { if (!dock.contains(event.target)) expand(false); });
  dock.addEventListener('keydown', event => { if (event.key === 'Escape') { expand(false); peek.focus({preventScroll:true}); } });
  const audio = new Audio('assets/audio/satie-gymnopedie-1.ogg');
  audio.id = 'gramophoneAudio';
  audio.preload = 'none';
  audio.loop = true;
  audio.volume = .8;
  audio.hidden = true;
  document.body.append(audio);
  let pending = false, generation = 0;
  let wasIntro = document.body.classList.contains('is-intro');
  function sync() {
    const on = !audio.paused;
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? '暂停书房音乐' : '播放书房音乐');
    button.title = '萨蒂 · 第一号吉姆诺佩蒂 / 钢琴：Robin Alciatore / Musopen';
    label.textContent = on ? '暂停音乐' : '播放音乐';
    toggle.setAttribute('aria-pressed',String(on));
    toggle.setAttribute('aria-label',on ? '暂停背景音乐' : '播放背景音乐');
    dock.dataset.playing = String(on);
  }
  function stop() { generation++; pending = false; audio.pause(); sync(); }
  async function toggleMusic() {
    if (!audio.paused || pending) return stop();
    const token = ++generation;
    pending = true;
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
    } finally { if (token === generation) pending = false; }
  }
  button.addEventListener('click',toggleMusic);
  toggle.addEventListener('click',() => { toggleMusic(); expand(true); });
  audio.addEventListener('pause',sync);
  audio.addEventListener('play',sync);
  new MutationObserver(() => {
    const intro = document.body.classList.contains('is-intro');
    if (document.body.classList.contains('is-watching')) stop();
    wasIntro = intro;
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',() => { if (document.hidden) stop(); });
  window.addEventListener('pagehide',stop);
  sync();
})();