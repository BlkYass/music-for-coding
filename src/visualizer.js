/* Four-row ASCII spectrum, implemented independently using the frequency-band
   mapping described by the user-supplied reference code. The output is derived
   from an actual Web Audio AnalyserNode whenever the MP3 host permits CORS.
   If no real audio can be analyzed, the fallback is clearly a display pattern,
   not a claimed sound measurement. */
export function createVisualizer(audio, element) {
  const rows = Array.from(element.querySelectorAll('[data-wave]'));
  const CHARS = "_,.-•*^°'¨`";
  const WIDTH = 32;
  const MAX_STEP = 4 * (CHARS.length - 1);
  const BLANK = '\u00a0';
  // Each of the four colored rows reveals one segment of the same glyph ramp.
  const tables = [3, 2, 1, 0].map(pad =>
    BLANK.repeat(pad * (CHARS.length - 1)) + CHARS + BLANK.repeat((3 - pad) * (CHARS.length - 1))
  );
  let frequency = null;
  let audioContext = null;
  let analyser = null;
  let activating = null;
  let number = 70;
  let raf = 0;
  let lastDraw = 0;
  let lastTime = 0;
  let activeSignal = false;
  let hasReadings = false;
  let wasAudible = false;

  // This matches the original player's CORS mode; setting it before any src
  // assignment is essential for Web Audio analysis of externally hosted MP3s.
  // Browsers still require the media host to return a permissive CORS header.
  audio.crossOrigin = 'anonymous';

  async function activate() {
    if (!audioContext) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return false;
      try {
        const ctx = new Context();
        const source = ctx.createMediaElementSource(audio);
        const bands = ctx.createAnalyser();
        bands.minDecibels = -114;
        bands.maxDecibels = -30;
        bands.fftSize = 2048;
        bands.smoothingTimeConstant = .666;
        source.connect(bands);
        bands.connect(ctx.destination);
        audioContext = ctx;
        analyser = bands;
        frequency = new Uint8Array(bands.frequencyBinCount);
      } catch (error) {
        // This can be unsupported in restricted browser environments.
        return false;
      }
    }
    try {if (audioContext.state !== 'running') await audioContext.resume();} catch {}
    return Boolean(analyser);
  }

  function draw(at) {
    const playing = !audio.paused && !audio.ended;
    element.classList.toggle('is-playing', playing);
    const result = ['', '', '', ''];
    let scan = 1, drift = -40, factor = 1.08;
    let peak = 0;
    let summed = 0;
    if (playing && analyser && frequency) {
      analyser.getByteFrequencyData(frequency);
      for (let i = 0; i < frequency.length; i++) {
        summed += frequency[i];
        peak = Math.max(peak, frequency[i]);
      }
      // Avoid displaying fake data if a remote host has blocked audio capture.
      hasReadings = peak > 0;
    } else {
      hasReadings = false;
    }
    activeSignal = playing && hasReadings;
    element.dataset.signal = activeSignal ? 'frequency' : (playing ? 'motion' : 'idle');
    const mean = frequency?.length ? summed / frequency.length : 0;

    for (let column = 0; column < WIDTH; column++) {
      let index = Math.floor(scan) + column;
      let raw = activeSignal ? frequency[Math.min(index, frequency.length - 1)] || 0 : 0;
      if (playing && !activeSignal) {
        // Animated visual-only fallback: useful for cross-origin media sources,
        // but deliberately separate from the real-time frequency view.
        const seconds = at / 1000;
        raw = 93 + 80 * Math.abs(Math.sin(column * .38 + seconds * 2.1 + number * .12)) *
          (.4 + .6 * Math.abs(Math.cos(column * .15 - seconds * 1.4)));
      }
      const mapped = raw ? Math.max(0, Math.min(MAX_STEP, Math.trunc((raw + drift) * (MAX_STEP + 1) / 256))) : 0;
      for (let row = 0; row < 4; row++) result[row] += tables[row][mapped] || BLANK;
      scan *= factor;
      drift += 1.5;
      factor += .01;
    }
    rows.forEach((row, index) => {row.textContent = result[index];});
    wasAudible = mean > 0;
    lastTime = at;
  }

  function tick(at) {
    raf = requestAnimationFrame(tick);
    if (at - lastDraw < 45) return;
    lastDraw = at;
    if (!audio.paused && !audio.ended || at - lastTime > 600) draw(at);
  }
  function refresh() {draw(performance.now());}
  function setEpisode(n) {number = n; hasReadings = false; refresh();}
  for (const event of ['play', 'playing', 'pause', 'ended', 'emptied', 'error', 'seeked']) audio.addEventListener(event, refresh);
  raf = requestAnimationFrame(tick);
  draw(0);
  return {
    activate,
    refresh,
    setEpisode,
    dispose: () => {cancelAnimationFrame(raf);if (audioContext) audioContext.close();}
  };
}
