(() => {
  'use strict';
  const button = document.getElementById('studyMusic');
  const label = document.getElementById('studyMusicLabel');
  const audio = new Audio('assets/audio/debussy-reverie.ogg');
  audio.id = 'gramophoneAudio';
  audio.preload = 'metadata';
  audio.loop = true;
  audio.volume = .45;
  audio.hidden = true;
  document.body.append(audio);
  let pending = false, generation = 0;
  function sync() {
    const on = !audio.paused;
    button.setAttribute('aria-pressed',String(on));
    button.setAttribute('aria-label',on ? '暂停书房音乐' : '播放书房音乐');
    button.title = '德彪西 · 梦幻曲（Rêverie） / 钢琴独奏';
    label.textContent = on ? '暂停音乐' : '播放音乐';
  }
  function stop() { generation++; pending = false; audio.pause(); sync(); }
  button.addEventListener('click', async () => {
    if (!audio.paused || pending) return stop();
    const token = ++generation;
    pending = true;
    try {
      await audio.play();
      if (token !== generation || !document.body.classList.contains('is-intro') || document.hidden) {
        if (token === generation) stop();
        return;
      }
      sync();
    } catch (error) {
      if (token === generation && error.name !== 'AbortError') label.textContent = '点击重试';
    } finally { if (token === generation) pending = false; }
  });
  audio.addEventListener('pause',sync);
  audio.addEventListener('play',sync);
  new MutationObserver(() => { if (!document.body.classList.contains('is-intro')) stop(); }).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide',stop);
  sync();
})();
