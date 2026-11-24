import { episodes, formatTime, padNumber } from './data.js';
import { AudioEngine } from './audio.js';

const byId = id => document.getElementById(id);
const getStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };

const params = new URLSearchParams(location.search);
const requested = Number(params.get('episode'));
const initialIndex = params.has('episode') ? episodes.findIndex(ep => ep.id === requested) : 7;
const state = {
  index: initialIndex < 0 ? 7 : initialIndex,
  theme: getStored('mfc-theme', 'night'),
  favorites: new Set(getStored('mfc-favorites', []).filter(Number.isInteger)),
  filter: 'all',
  search: ''
};
const player = new AudioEngine({
  onEnded: () => chooseEpisode((state.index + 1) % episodes.length, true),
  onError: message => toast(message)
});
let toastTimer;
let activeMovement = -1;

function toast(message) {
  const el = byId('toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3400);
}
function selectedEpisode() { return episodes[state.index]; }
function updateTheme(theme) {
  if (!['night', 'terminal', 'paper'].includes(theme)) theme = 'night';
  state.theme = theme;
  document.body.dataset.theme = theme;
  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    const selected = btn.dataset.themeChoice === theme;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-pressed', String(selected));
  });
  byId('cycle-theme').textContent = `[theme: ${theme}]`;
  store('mfc-theme', theme);
}
function renderArchive() {
  const list = byId('episode-list');
  list.replaceChildren();
  const filtered = [...episodes].reverse().filter(ep => {
    if (state.filter === 'favorites' && !state.favorites.has(ep.id)) return false;
    return `${ep.id} ${ep.title} ${ep.category}`.toLowerCase().includes(state.search);
  });
  byId('empty-archive').hidden = filtered.length > 0;
  byId('archive-total').textContent = String(episodes.length);
  for (const ep of filtered) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `archive-item${ep.id === selectedEpisode().id ? ' active' : ''}`;
    button.setAttribute('aria-label', `Play episode ${padNumber(ep.id)}: ${ep.title}`);
    if (ep.id === selectedEpisode().id) button.setAttribute('aria-current', 'true');
    const number = document.createElement('span');
    number.className = 'item-number';
    number.textContent = padNumber(ep.id);
    const title = document.createElement('span');
    title.className = 'item-title';
    title.textContent = `${ep.title}${state.favorites.has(ep.id) ? '  *' : ''}`;
    const time = document.createElement('span');
    time.className = 'item-length';
    time.textContent = `${Math.floor(ep.duration / 60)}m`;
    button.append(number, title, time);
    button.addEventListener('click', () => chooseEpisode(ep.id - 1, true));
    li.append(button);
    list.append(li);
  }
}
function renderMovements() {
  const ep = selectedEpisode();
  const list = byId('movements-list');
  list.replaceChildren();
  activeMovement = -1;
  byId('movement-count').textContent = `${padNumber(ep.movements.length)} parts`;
  ep.movements.forEach((movement, i) => {
    const li = document.createElement('li');
    li.dataset.movementIndex = String(i);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Go to movement ${i + 1}: ${movement.title}, at ${formatTime(movement.at)}`);
    const number = document.createElement('span');
    number.className = 'movement-index';
    number.textContent = padNumber(i + 1);
    const title = document.createElement('span');
    title.className = 'movement-title';
    title.textContent = `${movement.artist} — ${movement.title}`;
    const at = document.createElement('span');
    at.className = 'movement-duration';
    at.textContent = formatTime(movement.at);
    button.append(number, title, at);
    button.addEventListener('click', () => {
      player.seek(movement.at);
      updatePlayback();
      toast(`Jumped to ${movement.title}`);
    });
    li.append(button);
    list.append(li);
  });
}
function renderEpisode() {
  const ep = selectedEpisode();
  const number = padNumber(ep.id);
  byId('episode-category').textContent = ep.category.toUpperCase();
  byId('session-number').textContent = number;
  byId('episode-number').textContent = number;
  byId('episode-name').textContent = ep.title;
  byId('episode-description').textContent = ep.description;
  byId('mood-label').textContent = ep.mood;
  byId('format-label').textContent = ep.audioSrc ? 'AUDIO FILE / STREAM' : 'LIVE GENERATIVE AUDIO';
  byId('listening-note-text').textContent = ep.audioSrc
    ? 'Listening can be an act of focus. Support the artists whose music you love.'
    : 'Every play creates a subtly different session. All sounds are generated on your device.';
  byId('time-total').textContent = formatTime(ep.duration);
  byId('seek-bar').max = String(ep.duration);
  document.title = `${number}: ${ep.title} — musicForCoding();`;
  const favorite = state.favorites.has(ep.id);
  byId('favorite-button').textContent = favorite ? '[- favourited]' : '[+ favourite]';
  byId('favorite-button').setAttribute('aria-pressed', String(favorite));
  renderMovements();
  renderArchive();
  updatePlayback();
}
async function chooseEpisode(index, autoPlay = false) {
  if (index < 0) index = episodes.length - 1;
  if (index >= episodes.length) index = 0;
  state.index = index;
  player.load(selectedEpisode());
  const updated = new URL(location.href);
  updated.searchParams.set('episode', padNumber(selectedEpisode().id));
  history.replaceState(null, '', updated.pathname + updated.search + updated.hash);
  renderEpisode();
  if (autoPlay) {
    await player.play();
    updatePlayback();
  }
}
async function togglePlayback() {
  if (player.isPlaying) player.pause();
  else await player.play();
  updatePlayback();
}
function updatePlayback() {
  const ep = selectedEpisode();
  const elapsed = player.currentTime;
  const duration = player.duration || ep.duration;
  byId('time-elapsed').textContent = formatTime(elapsed);
  byId('time-total').textContent = formatTime(duration);
  const bar = byId('seek-bar');
  if (document.activeElement !== bar) {
    bar.max = String(Math.floor(duration));
    bar.value = String(Math.floor(elapsed));
  }
  bar.style.setProperty('--seek-percent', `${Math.max(0, Math.min(100, elapsed / Math.max(1, duration) * 100))}%`);
  byId('play-label').textContent = player.isPlaying ? 'pause' : 'play';
  byId('play-icon').textContent = player.isPlaying ? 'Ⅱ' : '▶';
  byId('play-button').setAttribute('aria-label', player.isPlaying ? 'Pause session' : 'Play session');
  byId('playback-status').textContent = player.isPlaying ? 'signal active' : elapsed > 0 ? 'paused' : 'waiting for input';
  byId('signal-state').textContent = player.isPlaying ? 'LIVE / ACTIVE' : 'STANDBY';
  const movementIndex = ep.movements.reduce((index, move, i) => elapsed >= move.at ? i : index, 0);
  if (activeMovement !== movementIndex) {
    activeMovement = movementIndex;
    byId('movements-list').querySelectorAll('li').forEach((li, i) => li.classList.toggle('current', i === movementIndex));
  }
  if (player.isPlaying && elapsed >= duration - 0.05 && !ep.audioSrc) chooseEpisode(state.index + 1, true);
}
function toggleFavorite() {
  const id = selectedEpisode().id;
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  store('mfc-favorites', [...state.favorites]);
  renderEpisode();
  toast(state.favorites.has(id) ? 'Added to favourites' : 'Removed from favourites');
}
function setFilter(next) {
  state.filter = next;
  document.querySelectorAll('[data-filter]').forEach(btn => {
    const active = btn.dataset.filter === next;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  renderArchive();
}
function updateClock() {
  byId('clock').textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
}

// Canvas visualization stays fully functional without network access.
const canvas = byId('frequency-canvas');
const ctx = canvas.getContext('2d');
let lastFrame = 0;
function drawFrequency(time) {
  requestAnimationFrame(drawFrequency);
  if (!ctx || time - lastFrame < 45) return;
  lastFrame = time;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  ctx.clearRect(0, 0, width, height);
  const vars = getComputedStyle(document.body);
  const line = vars.getPropertyValue('--line').trim();
  const plot = vars.getPropertyValue('--plot').trim();
  const n = Math.max(20, Math.floor(width / (ratio * 9)));
  const gap = 3.5 * ratio;
  const barWidth = Math.max(2, width / n - gap);
  const playing = player.isPlaying;
  const bins = player.getFrequencyData();
  const t = time / 1000;
  ctx.fillStyle = line;
  ctx.fillRect(0, height - ratio, width, ratio);
  for (let i = 0; i < n; i++) {
    const peak = Math.exp(-Math.pow((i - n * 0.24) / (n * 0.29), 2));
    const texture = Math.abs(Math.sin(i * 1.73 + t * .27) + 0.35 * Math.sin(i * 3.8 - t * .17)) / 1.35;
    const data = bins ? bins[Math.min(bins.length - 1, Math.floor(i / n * bins.length))] / 255 : 0;
    const amplitude = playing ? Math.max(data * .89, (0.11 + peak * .48) * (0.56 + texture * .44)) : .035 + peak * .055;
    const barHeight = Math.max(2 * ratio, height * amplitude * (playing ? 0.88 : 0.65));
    ctx.globalAlpha = playing ? 0.55 + peak * 0.35 : 0.24;
    ctx.fillStyle = plot;
    ctx.fillRect(i * width / n, height - barHeight, barWidth, barHeight);
  }
  ctx.globalAlpha = 1;
}

byId('cycle-theme').addEventListener('click', () => {
  const themes = ['night', 'terminal', 'paper'];
  updateTheme(themes[(themes.indexOf(state.theme) + 1) % themes.length]);
});
byId('play-button').addEventListener('click', togglePlayback);
byId('previous-button').addEventListener('click', () => chooseEpisode(state.index - 1, true));
byId('next-button').addEventListener('click', () => chooseEpisode(state.index + 1, true));
byId('shuffle-button').addEventListener('click', () => {
  const options = episodes.map((_, i) => i).filter(i => i !== state.index);
  chooseEpisode(options[Math.floor(Math.random() * options.length)], true);
});
byId('favorite-button').addEventListener('click', toggleFavorite);
byId('seek-bar').addEventListener('input', event => {
  const value = Number(event.target.value);
  player.seek(value);
  event.target.style.setProperty('--seek-percent', `${value / Math.max(1,player.duration) * 100}%`);
  updatePlayback();
});
byId('volume-bar').addEventListener('input', event => player.setVolume(Number(event.target.value) / 100));
byId('session-search').addEventListener('input', event => { state.search = event.target.value.trim().toLowerCase(); renderArchive(); });
document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));
document.querySelectorAll('[data-theme-choice]').forEach(btn => btn.addEventListener('click', () => updateTheme(btn.dataset.themeChoice)));
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return;
  const key = event.key.toLowerCase();
  if (key === ' ') { event.preventDefault(); togglePlayback(); }
  else if (key === 'arrowright') { event.preventDefault(); player.seek(player.currentTime + 10); updatePlayback(); }
  else if (key === 'arrowleft') { event.preventDefault(); player.seek(player.currentTime - 10); updatePlayback(); }
  else if (key === 'n') chooseEpisode(state.index + 1, true);
  else if (key === 'p') chooseEpisode(state.index - 1, true);
  else if (key === 'f') toggleFavorite();
});

updateTheme(state.theme);
setFilter('all');
player.load(selectedEpisode());
renderEpisode();
updateClock();
setInterval(updateClock, 1000);
setInterval(updatePlayback, 250);
requestAnimationFrame(drawFrequency);
