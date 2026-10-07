(() => {
  'use strict';
  const intro = document.getElementById('intro');
  const lamp = document.getElementById('deskLampSwitch');
  const mobileLamp = document.getElementById('mobileLampSwitch');
  let lightOn = false;
  function setLampState(on) {
    lightOn = on;
    intro.classList.toggle('is-daytime', !lightOn);
    [lamp, mobileLamp].forEach(el => {
      el.setAttribute('aria-pressed', String(lightOn));
      el.setAttribute('aria-label', lightOn ? '开灯，切换白天' : '关灯，切换日落');
    });
    lamp.querySelector('span').textContent = lightOn ? '开灯' : '关灯';
    mobileLamp.textContent = lightOn ? '开灯' : '关灯';
  }
  let switchingLamp = false;
  const lampImages = new Map();
  async function toggleLamp() {
    if (switchingLamp) return;
    const nextState = !lightOn;
    if (matchMedia('(max-width:900px)').matches) {
      switchingLamp = true;
      const url = nextState ? 'assets/intro/study-sunset-mobile.webp' : 'assets/intro/study-daylight-mobile.webp';
      if (!lampImages.has(url)) {
        const image = new Image();
        image.src = url;
        lampImages.set(url, image.decode().then(() => true, () => false));
      }
      const ready = await lampImages.get(url);
      switchingLamp = false;
      if (!ready) { lampImages.delete(url); return; }
    }
    setLampState(nextState);
  }
  intro.addEventListener('study-lamp-reset', () => setLampState(false));
  setLampState(false);
  lamp.addEventListener('click',toggleLamp);
  mobileLamp.addEventListener('click',toggleLamp);
  const music = document.getElementById('studyMusic');
  const dialog = document.getElementById('studyNoteDialog');
  document.getElementById('deskNote').addEventListener('click', () => dialog.showModal());
  document.getElementById('studyNoteClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  // In the close-up, leave room for the file and remove the off-camera props from keyboard navigation.
  const props = document.querySelector('.study-props');
  new MutationObserver(() => { props.inert = intro.classList.contains('is-overhead') || intro.classList.contains('is-leaving'); }).observe(intro,{attributes:true,attributeFilter:['class']});
})();
