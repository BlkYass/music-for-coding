/**
 * Lightweight Web Audio ambient engine, written specifically for this demo.
 * Creates original generative sound in the visitor's browser and needs no
 * network requests or audio licensing. If an episode has audioSrc, HTMLAudio
 * is used instead so you can swap in your own rights-cleared recordings.
 */
export class AudioEngine {
  constructor({ onEnded = () => {}, onError = () => {} } = {}) {
    this.onEnded = onEnded;
    this.onError = onError;
    this.episode = null;
    this.isPlaying = false;
    this.position = 0;
    this.startedAt = 0;
    this.volume = 0.6;
    this.context = null;
    this.analyser = null;
    this.master = null;
    this.nodes = [];
    this.pulseTimer = null;
    this.media = new Audio();
    this.media.preload = 'metadata';
    this.media.volume = this.volume;
    this.media.addEventListener('ended', () => {
      this.isPlaying = false;
      this.onEnded();
    });
    this.media.addEventListener('error', () => {
      if (this.episode?.audioSrc) this.onError('Audio file unavailable. Check the filename and server path.');
    });
  }

  load(episode) {
    this.stop();
    this.episode = episode;
    this.position = 0;
    if (episode.audioSrc) {
      this.media.src = episode.audioSrc;
      this.media.load();
    }
  }

  get duration() {
    const fileDuration = this.episode?.audioSrc ? this.media.duration : null;
    return Number.isFinite(fileDuration) && fileDuration > 0 ? fileDuration : (this.episode?.duration || 0);
  }

  get currentTime() {
    if (this.episode?.audioSrc) return this.media.currentTime || 0;
    if (!this.isPlaying) return this.position;
    return Math.min(this.duration, this.position + (performance.now() - this.startedAt) / 1000);
  }

  async play() {
    if (!this.episode || this.isPlaying) return;
    if (this.episode.audioSrc) {
      try {
        await this.media.play();
        this.isPlaying = true;
      } catch (_) {
        this.onError('Playback was blocked. Click play again to start the audio.');
      }
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      this.onError('Web Audio is unavailable in this browser.');
      return;
    }
    try {
      this.context = new AudioContextClass();
      this.makeGenerativePatch(this.episode);
      await this.context.resume();
      this.startedAt = performance.now();
      this.isPlaying = true;
    } catch (error) {
      this.teardownSynth();
      this.onError('Could not start the sound engine. Try a different browser.');
    }
  }

  pause() {
    if (!this.isPlaying) return;
    if (this.episode?.audioSrc) this.media.pause();
    else {
      this.position = this.currentTime;
      this.teardownSynth();
    }
    this.isPlaying = false;
  }

  stop() {
    this.media.pause();
    this.media.removeAttribute('src');
    this.media.load();
    this.teardownSynth();
    this.position = 0;
    this.isPlaying = false;
  }

  seek(seconds) {
    const next = Math.min(Math.max(seconds, 0), Math.max(0, this.duration - 0.1));
    if (this.episode?.audioSrc) {
      // Some browsers cannot seek until MP3 metadata is ready.
      const apply = () => { try { this.media.currentTime = next; } catch (_) {} };
      if (this.media.readyState >= 1) apply();
      else this.media.addEventListener('loadedmetadata', apply, { once: true });
    } else {
      this.position = next;
      this.startedAt = performance.now();
    }
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, value));
    this.media.volume = this.volume;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume * 0.42, this.context.currentTime, 0.07);
    }
  }

  getFrequencyData() {
    if (!this.isPlaying || !this.analyser) return null;
    const bytes = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(bytes);
    return bytes;
  }

  teardownSynth() {
    if (this.pulseTimer != null) clearInterval(this.pulseTimer);
    this.pulseTimer = null;
    this.nodes.forEach(node => { try { node.stop?.(); } catch (_) {} });
    this.nodes.length = 0;
    if (this.context) this.context.close().catch(() => {});
    this.context = null;
    this.analyser = null;
    this.master = null;
  }

  makeGenerativePatch(episode) {
    const ctx = this.context;
    let seed = (episode.seed + Math.floor(this.position / 16)) | 0;
    const random = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };
    const midiHz = midi => 440 * Math.pow(2, (midi - 69) / 12);
    const master = ctx.createGain();
    master.gain.value = this.volume * 0.42;
    this.master = master;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.92;
    master.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    const dry = ctx.createGain();
    dry.gain.value = 0.76;
    dry.connect(master);
    const wet = ctx.createGain();
    wet.gain.value = 0.24;
    wet.connect(master);
    const convolution = ctx.createConvolver();
    const seconds = 2.6;
    const length = Math.round(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let j = 0; j < length; j++) {
        const decay = Math.pow(1 - j / length, 2.4);
        channel[j] = (random() * 2 - 1) * decay * 0.55;
      }
    }
    convolution.buffer = impulse;
    convolution.connect(wet);
    const bus = ctx.createGain();
    bus.connect(dry);
    bus.connect(convolution);

    const chord = [0, 7, 10, 12, 19, 24];
    const voices = [];
    for (let i = 0; i < 6; i++) {
      const oscillator = ctx.createOscillator();
      oscillator.type = i % 3 === 0 ? 'triangle' : 'sine';
      oscillator.detune.value = (random() - 0.5) * 12;
      oscillator.frequency.value = midiHz(episode.root + chord[i]);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      const level = i < 2 ? 0.095 : 0.05;
      gain.gain.linearRampToValueAtTime(level, ctx.currentTime + 4 + i * 0.6);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 430 + i * 190;
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      oscillator.start();
      this.nodes.push(oscillator);
      voices.push({ oscillator, gain, level, index: i });
    }

    // An almost inaudible band of shaped noise adds a gentle air texture.
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < noise.length; i++) {
      brown = (brown + (random() * 2 - 1) * 0.04) / 1.018;
      noise[i] = brown * 0.22;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 520;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.34;
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(bus);
    noiseSource.start();
    this.nodes.push(noiseSource);

    let pulseIndex = 0;
    this.pulseTimer = setInterval(() => {
      if (!this.context || this.context.state === 'closed') return;
      pulseIndex++;
      const now = ctx.currentTime;
      voices.forEach(({ oscillator, gain, level, index }) => {
        const variations = [0, 0, 2, 5, -2, 0];
        const degree = chord[index] + (random() > 0.74 ? variations[(pulseIndex + index) % variations.length] : 0);
        oscillator.frequency.setTargetAtTime(midiHz(episode.root + degree), now, 3.8);
        gain.gain.setTargetAtTime(level * (0.73 + random() * 0.35), now, 2.7);
      });
      noiseFilter.frequency.setTargetAtTime(260 + random() * 550, now, 4);
      // Quiet occasional bell with a soft release.
      if (pulseIndex % 2 === 0) {
        const bell = ctx.createOscillator();
        bell.type = 'sine';
        bell.frequency.value = midiHz(episode.root + 24 + [0, 3, 7, 10][Math.floor(random() * 4)]);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(0.028, now + 0.05);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
        bell.connect(env);
        env.connect(bus);
        bell.start(now);
        bell.stop(now + 5);
        bell.onended = () => { bell.disconnect(); env.disconnect(); };
      }
    }, 8200);
  }
}
