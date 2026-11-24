/* Animated four-color ASCII waveform.
 * Streams from the supplied original MP3 host are expected to allow CORS,
 * as the reference app plays them through an AudioContext AnalyserNode.
 * Visual motion remains available when analyzable samples are absent.
 */
export function createVisualizer(audio, element) {
  const rows = [...element.querySelectorAll('[data-wave]')];
  const WIDTH = 35;
  const CHARS = ['_', '.', '·', '-', '~', '^', '*', '°', '¨', "'", '`'];
  const NBSP = '\u00a0';
  const smoothed = new Float32Array(WIDTH);
  let episode = 70;
  let raf = 0;
  let lastDraw = 0;
  let audioContext = null;
  let analyser = null;
  let frequency = null;
  let sourceMade = false;

  // Required to analyze the external MP3s. The remote host must grant CORS.
  audio.crossOrigin = 'anonymous';
  async function activate() {
    if (audioContext) {
      try { await audioContext.resume(); } catch {}
      return Boolean(analyser);
    }
    if (!audio.currentSrc) return false;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    try {
      audioContext = new Context();
      if (!sourceMade) {
        const source = audioContext.createMediaElementSource(audio);
        sourceMade = true;
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = .72;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        frequency = new Uint8Array(analyser.frequencyBinCount);
      }
      await audioContext.resume();
      return true;
    } catch { return false; }
  }

  function draw(now) {
    const playing = !audio.paused && !audio.ended;
    const phase = playing ? now * .001 : episode * .17;
    let hasSignal = false;
    if (playing && analyser && frequency) {
      analyser.getByteFrequencyData(frequency);
      hasSignal = frequency.some(value => value > 3);
    }
    element.dataset.signal = !playing ? 'idle' : hasSignal ? 'frequency' : 'visual';
    element.classList.toggle('is-playing', playing);
    const lines = Array.from({ length: 4 }, () => Array(WIDTH).fill(NBSP));

    for (let x = 0; x < WIDTH; x++) {
      const u = x / (WIDTH - 1);
      const center = Math.sin(2.5 * Math.PI * u - phase * 1.65 + episode * .38);
      const slow = Math.sin(6.4 * Math.PI * u + phase * 1.12 + episode * .2);
      const ripples = Math.cos(11 * Math.PI * u - phase * 2.1);
      let amplitude;
      if (hasSignal) {
        // Logarithmic sample positions preserve bass activity while retaining
        // the middle/high frequency texture visible in the ASCII display.
        const bin = Math.min(frequency.length - 1, Math.round(2 * Math.pow(1 + u * 17, 1.45)));
        const volume = Math.max(0, (frequency[bin] - 34) / 186);
        smoothed[x] += (volume - smoothed[x]) * .26;
        amplitude = smoothed[x];
      } else {
        // This is a visualization, not a fake frequency measurement.
        // It remains visible when idle and flows when audio plays.
        amplitude = .5 + .31 * center + .13 * slow + .06 * ripples;
      }
      const height = Math.max(0, Math.min(3, Math.round((1 - amplitude) * 3)));
      const wiggle = Math.abs(Math.sin(x * .8 + phase * 1.2));
      const charIndex = Math.min(CHARS.length - 1, Math.floor(wiggle * CHARS.length));
      lines[height][x] = CHARS[charIndex];
      // Add occasional thin neighbors so the curve reads as continuous text.
      if (x > 0 && lines[height][x - 1] === NBSP) lines[height][x - 1] = '·';
    }
    rows.forEach((row, i) => row.textContent = lines[i].join(''));
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (now - lastDraw < 52) return;
    lastDraw = now;
    draw(now);
  }
  const refresh = () => draw(performance.now());
  function setEpisode(n) { episode = n; smoothed.fill(0); refresh(); }
  ['play', 'playing', 'pause', 'ended', 'waiting', 'seeked'].forEach(event => audio.addEventListener(event, refresh));
  raf = requestAnimationFrame(tick);
  draw(0);
  return { activate, refresh, setEpisode, dispose() { cancelAnimationFrame(raf); if(audioContext) audioContext.close(); } };
}
