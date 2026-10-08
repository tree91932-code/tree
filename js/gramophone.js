(() => {
  'use strict';
  const introButton = document.getElementById('studyMusic');
  if (!introButton) return;
  const siteButton = introButton.cloneNode(true);
  siteButton.id = 'siteMusic';
  siteButton.querySelector('#studyMusicLabel').id = 'siteMusicLabel';
  document.body.append(siteButton);
  const buttons = [introButton, siteButton];
  const labels = buttons.map(button => button.querySelector('[id$="MusicLabel"]'));
  const audio = new Audio('assets/audio/a-kind-of-hope.m4a');
  audio.id = 'gramophoneAudio';
  audio.preload = 'none';
  audio.loop = true;
  audio.volume = .8;
  audio.hidden = true;
  document.body.append(audio);
  let wanted = false, pending = false, generation = 0;
  const cinema = document.getElementById('cinema');
  const blocked = () => document.hidden || (cinema && !cinema.hidden) || [...document.querySelectorAll('video')].some(video => !video.paused && !video.muted && !video.ended);
  function sync() {
    const text = wanted ? (blocked() ? '音乐已开启' : '暂停音乐') : '播放音乐';
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(wanted));
      button.setAttribute('aria-label', wanted ? '暂停背景音乐' : '播放背景音乐');
      button.title = 'A Kind Of Hope — Scott Buckley · CC BY 4.0';
      labels[index].textContent = text;
    });
  }
  function reconcile() {
    if (!wanted || blocked()) {
      generation++;
      pending = false;
      audio.pause();
      sync();
      return;
    }
    if (!audio.paused || pending) { sync(); return; }
    const token = ++generation;
    pending = true;
    audio.play().then(() => {
      if (token !== generation) { if (!wanted || blocked()) audio.pause(); return; }
      if (!wanted || blocked()) { audio.pause(); return; }
      sync();
    }).catch(error => {
      if (token === generation && error.name !== 'AbortError') {
        wanted = false;
        sync();
        labels.forEach(label => { label.textContent = '点击继续音乐'; });
      }
    }).finally(() => { if (token === generation) pending = false; });
  }
  buttons.forEach(button => button.addEventListener('click', () => { wanted = !wanted; reconcile(); }));
  audio.addEventListener('pause', sync);
  audio.addEventListener('play', sync);
  // Changing sections or opening the archive never stops the music.
  if (cinema) new MutationObserver(reconcile).observe(cinema, {attributes:true,attributeFilter:['hidden']});
  ['play','pause','ended','volumechange'].forEach(type => document.addEventListener(type, event => {
    if (event.target.tagName === 'VIDEO') reconcile();
  }, true));
  document.addEventListener('visibilitychange', reconcile);
  window.addEventListener('pagehide', () => { generation++; pending = false; audio.pause(); });
  window.addEventListener('pageshow', reconcile);
  sync();
})();