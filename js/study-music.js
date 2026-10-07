(() => {
  'use strict';
  const button = document.getElementById('studyMusic');
  const label = document.getElementById('studyMusicLabel');
  let context, master, timer, playing = false, nextBeat = 0, beat = 0;
  // Original, quietly synthesized waltz. No external audio or network request.
  const melody = [76,79,83,81,79,76,74,78,81,79,78,74,72,76,79,83,81,79,74,78,81,79,76,74,76,79,84,83,79,76,74,77,81,79,77,74,72,76,79,81,79,76,71,74,79,78,74,71];
  const chords = [[48,55,60,64],[50,57,62,66],[45,52,57,60],[43,50,55,59],[48,55,60,64],[53,60,65,69],[45,52,57,60],[43,50,55,59]];
  function note(midi, time, duration, volume) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    gain.connect(master);
    [1,2,3].forEach((harmonic, i) => {
      const osc = context.createOscillator();
      const level = context.createGain();
      osc.type = 'sine'; osc.frequency.value = 440 * 2 ** ((midi - 69) / 12) * harmonic;
      level.gain.value = [1,.23,.07][i]; osc.connect(level); level.connect(gain);
      osc.start(time); osc.stop(time + duration + .05);
      osc.onended = () => { osc.disconnect(); level.disconnect(); if (i === 2) gain.disconnect(); };
    });
  }
  function schedule() {
    while (nextBeat < context.currentTime + .3) {
      const chord = chords[Math.floor(beat / 6) % chords.length];
      note(melody[beat % melody.length], nextBeat, 1.65, .18);
      if (beat % 3 === 0) note(chord[0], nextBeat, 1.5, .11);
      else chord.slice(1).forEach(n => note(n, nextBeat, 1.2, .035));
      nextBeat += .56; beat++;
    }
  }
  function stop() {
    if (!playing) return;
    playing = false; clearInterval(timer);
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0, context.currentTime, .1);
    button.setAttribute('aria-pressed','false'); button.setAttribute('aria-label','播放书房音乐');
    label.textContent = '播放音乐';
  }
  button.addEventListener('click', async () => {
    if (playing) return stop();
    try {
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
      }
      await context.resume();
      if (!document.body.classList.contains('is-intro') || document.hidden) return;
      playing = true; beat = 0; nextBeat = context.currentTime + .08;
      master.gain.cancelScheduledValues(context.currentTime); master.gain.setTargetAtTime(.23,context.currentTime,.3);
      schedule(); timer = setInterval(schedule,120);
      button.setAttribute('aria-pressed','true'); button.setAttribute('aria-label','暂停书房音乐'); label.textContent = '暂停音乐';
    } catch { label.textContent = '音乐暂不可用'; }
  });
  new MutationObserver(() => { if (!document.body.classList.contains('is-intro')) stop(); }).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide',stop);
})();
