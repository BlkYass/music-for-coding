/**
 * Four-row ASCII signal. Uses actual frequency bins when the current MP3
 * allows cross-origin analysis; otherwise uses a continuous mathematical
 * motion pattern while audio is playing. Decorative glyphs never claim to
 * be measured sound when the input isn't available.
 */
export function createVisualizer(audio, element) {
  const rows = [...element.querySelectorAll('[data-wave]')];
  const WIDTH = 34;
  const HEIGHT = rows.length;
  const SYMBOLS = ['_', '.', '·', '-', '~', '^', '*', '°', '\'', '"', '`'];
  const EMPTY = '\u00a0';
  const smooth = new Float32Array(WIDTH);
  let episode = 70;
  let animationId = 0;
  let lastPaint = 0;
  let ctx = null;
  let analyser = null;
  let bins = null;
  let origin = null;

  // Analyser requires CORS permission from remote audio hosts.
  audio.crossOrigin = 'anonymous';

  async function activate() {
    if (ctx) {
      try { await ctx.resume(); } catch {}
      return Boolean(analyser);
    }
    if (!audio.currentSrc && !audio.src) return false;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return false;
    try {
      ctx = new AudioContextCtor();
      origin = ctx.createMediaElementSource(audio);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.73;
      origin.connect(analyser);
      analyser.connect(ctx.destination);
      bins = new Uint8Array(analyser.frequencyBinCount);
      await ctx.resume();
      return true;
    } catch {
      return false;
    }
  }

  function draw(now) {
    const playing = !audio.paused && !audio.ended;
    const time = playing ? now / 1000 : episode * 0.053;
    let measured = false;
    if (playing && analyser && bins) {
      analyser.getByteFrequencyData(bins);
      measured = bins.some(v => v > 3);
    }
    element.dataset.signal = playing ? (measured ? 'frequency' : 'motion') : 'idle';
    element.classList.toggle('is-playing', playing);
    const field = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(EMPTY));
    const pulse = 0.25 * Math.sin(time * 2.1 + episode * 0.7);

    for (let x = 0; x < WIDTH; x++) {
      const t = x / (WIDTH - 1);
      const drift = Math.sin((t * 2.85 - time * 0.62) * Math.PI + episode * .44);
      const fine = .38 * Math.sin(t * 19.5 + time * 1.4);
      const waveShape = .51 + .38 * drift + .24 * fine + pulse * .28;
      let strength;
      if (measured) {
        const bin = Math.min(bins.length - 1, Math.round(Math.pow(1 + t * 22, 1.40) * 2));
        const value = Math.min(1, Math.max(0, (bins[bin] - 24) / 200));
        smooth[x] += (value - smooth[x]) * 0.24;
        strength = .72 * waveShape + .38 * smooth[x];
      } else {
        strength = waveShape;
      }
      // Curved / stepped trail, never a horizontal progress line.
      const height = Math.max(0, Math.min(HEIGHT - 1, Math.round((1 - Math.max(0, Math.min(1, strength))) * (HEIGHT - 1))));
      const index = Math.abs(Math.round((Math.sin(x * .71 - time * 3.1) * 6 + x * .31 + episode) * 5));
      field[height][x] = SYMBOLS[index % SYMBOLS.length];

      // Multiple rows of sparse glyphs make this look like ASCII particles,
      // not a flat equalizer trace or a conventional bar chart.
      const shimmer = (Math.sin(x * 1.57 + time * 2.8 + episode) + 1) / 2;
      if (playing && shimmer > .68) {
        const neighbor = Math.max(0, Math.min(HEIGHT - 1, height + (x % 2 ? -1 : 1)));
        if (neighbor !== height) field[neighbor][x] = SYMBOLS[(index + 4) % SYMBOLS.length];
      }
      if (playing && measured && smooth[x] > .7 && height + 1 < HEIGHT) {
        field[height + 1][x] = '.';
      }
    }

    rows.forEach((row, idx) => { row.textContent = field[idx].join(''); });
  }

  function frame(now) {
    animationId = requestAnimationFrame(frame);
    if (now - lastPaint < 42) return;
    lastPaint = now;
    draw(now);
  }
  function refresh() { draw(performance.now()); }
  function setEpisode(number) { episode = number; smooth.fill(0); refresh(); }
  for (const event of ['play', 'playing', 'pause', 'ended', 'seeked', 'waiting']) {
    audio.addEventListener(event, refresh);
  }
  animationId = requestAnimationFrame(frame);
  draw(0);
  return {
    activate, refresh, setEpisode,
    dispose() { cancelAnimationFrame(animationId); if (ctx) ctx.close(); }
  };
}
