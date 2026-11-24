/**
 * One horizontal path of animated ASCII glyphs.
 * Uses actual FFT energy when the stream can be analysed, and an animated
 * mathematical contour otherwise. Never draws bar graphs or extra rows.
 */
export function createVisualizer(audio, element) {
  const WIDTH = 36;
  const CHARS = ['_', '.', '\'', '\"', '^', '*', '~', '.', '-', '°'];
  const shades = ['fuschia', 'orange', 'yellow', 'green'];
  const smooth = new Float32Array(WIDTH);
  const letters = [];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < WIDTH; i++) {
    const span = document.createElement('span');
    span.className = `wave-glyph ${shades[Math.min(3, Math.floor(i / (WIDTH / 4)))]}`;
    span.textContent = CHARS[i % CHARS.length];
    span.style.left = `${(i / WIDTH) * 98}%`;
    fragment.append(span);
    letters.push(span);
  }
  element.replaceChildren(fragment);
  let episode = 70;
  let animationId = 0;
  let lastPaint = 0;
  let ctx = null, analyser = null, bins = null;

  // Do not force crossOrigin on the <audio> element: some external MP3 hosts
  // don't send Access-Control-Allow-Origin and would then refuse playback.
  // In that case the contour still animates, but isn't labelled as FFT data.
  async function activate() {
    if (ctx) { try { await ctx.resume(); } catch {} return Boolean(analyser); }
    if (!audio.src && !audio.currentSrc) return false;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    // Cross-origin streaming without CORS cannot be analysed safely. Avoid
    // routing such audio through WebAudio, which would mute a tainted source.
    const url = new URL(audio.currentSrc || audio.src, location.href);
    if (url.origin !== location.origin && audio.crossOrigin !== 'anonymous') return false;
    try {
      ctx = new Ctor();
      const input = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = .75;
      input.connect(analyser);
      analyser.connect(ctx.destination);
      bins = new Uint8Array(analyser.frequencyBinCount);
      await ctx.resume();
      return true;
    } catch { return false; }
  }

  function draw(now) {
    const playing = !audio.paused && !audio.ended;
    const t = playing ? now / 1000 : episode * .073;
    let measured = false;
    if (playing && analyser && bins) {
      try {
        analyser.getByteFrequencyData(bins);
        measured = bins.some(v => v > 3);
      } catch {}
    }
    element.dataset.signal = !playing ? 'idle' : (measured ? 'frequency' : 'motion');
    element.classList.toggle('is-playing', playing);
    for (let i = 0; i < WIDTH; i++) {
      const x = i / (WIDTH - 1);
      let energy = .5 + .31 * Math.sin(x * 9.4 - t * 2.35 + episode * .2)
                     + .17 * Math.sin(x * 27.5 + t * 1.6);
      if (measured) {
        const bin = Math.min(bins.length - 1, Math.floor(2 + (x * x) * 175));
        const value = bins[bin] / 255;
        smooth[i] += (value - smooth[i]) * .2;
        energy = .52 * energy + .48 * smooth[i];
      }
      energy = Math.max(.06, Math.min(.95, energy));
      const y = 4 + (1 - energy) * 32; // a single curved trail, no extra rows
      const charIndex = Math.abs(Math.round(i * .7 + t * 4 + episode * .31 + energy * 8));
      const span = letters[i];
      span.textContent = CHARS[charIndex % CHARS.length];
      span.style.transform = `translateY(${y.toFixed(1)}px)`;
      span.style.opacity = String(.50 + energy * .5);
    }
  }
  function frame(now) {
    animationId = requestAnimationFrame(frame);
    if (now - lastPaint < 45) return;
    lastPaint = now;
    draw(now);
  }
  function refresh() {draw(performance.now());}
  function setEpisode(num) {episode = num; smooth.fill(0); refresh();}
  for (const event of ['play', 'playing', 'pause', 'ended', 'seeked', 'waiting'])
    audio.addEventListener(event, refresh);
  animationId = requestAnimationFrame(frame);
  draw(0);
  return {activate, refresh, setEpisode, dispose(){cancelAnimationFrame(animationId);if(ctx)ctx.close();}};
}
