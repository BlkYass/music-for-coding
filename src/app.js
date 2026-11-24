import { episodes, episodeBySlug, episodeById, clockTime } from './data.js';
import { AudioEngine } from './audio.js';

const $ = id => document.getElementById(id);
const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } }
};
const favorites = new Set(storage.read('terminal-favourites', []));

function episodeFromLocation() {
  const path = location.pathname.split('/').filter(Boolean).at(-1);
  const query = Number(new URLSearchParams(location.search).get('episode'));
  return episodeBySlug(path) || (query ? episodeById(query) : null) || episodeById(70);
}

let current = episodeFromLocation();
let volume = 0.7;
let noticeTimer = null;
let isNavigating = false;
const player = new AudioEngine({
  onEnded: () => { renderPlayback(); notify('End of episode. Choose another from the archive.'); },
  onError: message => { renderPlayback(); notify(message); }
});
player.setVolume(volume);
player.load(current);

function notify(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function renderArchive() {
  const nav = $('episode-archive');
  const frag = document.createDocumentFragment();
  for (const ep of episodes) {
    const link = document.createElement('a');
    link.href = `/${ep.slug}/`;
    link.className = 'archive-item' + (current.id === ep.id ? ' active' : '') + (ep.id === 62 ? ' alt' : '');
    link.textContent = `${String(ep.id).padStart(2,'0')}: ${ep.title}`;
    if (current.id === ep.id) link.setAttribute('aria-current','page');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      chooseEpisode(ep);
    });
    frag.append(link);
  }
  nav.replaceChildren(frag);
}

function renderEpisode() {
  $('episode-number').textContent = String(current.id).padStart(2,'0');
  $('episode-name').textContent = current.title;
  $('duration').textContent = current.audioSrc ? '1:03:30' : '1:00:00 demo';
  $('file-size').textContent = current.size || 'ambient demo';
  $('source').textContent = current.audioSrc ? '[source]' : '[original]';
  $('source').href = current.audioSrc || `https://musicforprogramming.net/${current.slug}/`;
  $('source').title = current.audioSrc ? 'Open the original external MP3 URL' : 'Visit the original episode listing';
  const isFavorite = favorites.has(current.id);
  $('favorite').textContent = isFavorite ? '[favourited]' : '[favourite]';
  $('favorite').setAttribute('aria-pressed', String(isFavorite));
  document.title = `Episode ${current.id}: ${current.title} — musicForProgramming();`;

  const tracklist = $('tracklist');
  tracklist.replaceChildren();
  if (current.tracks.length) {
    for (const name of current.tracks) {
      const line = document.createElement('div');
      line.className = 'trackline';
      line.textContent = name;
      tracklist.append(line);
    }
  } else {
    const note = document.createElement('p');
    note.className = 'muted';
    note.textContent = '// Tracklist and original recording are not included in this replica. Play starts an original ambient demo. Open [original] for the actual mix.';
    tracklist.append(note);
  }
  $('episode-links').replaceChildren();
  if (current.id === 70) {
    const a = document.createElement('a');
    a.href = 'https://soundcloud.com/thingsdisappear';
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    a.className = 'green';
    a.textContent = 'https://soundcloud.com/thingsdisappear';
    $('episode-links').append(a);
  }
  renderArchive();
  renderPlayback();
}

function renderPlayback() {
  const playing = player.isPlaying;
  $('sidebar-play').textContent = playing ? '[pause]' : '[play]';
  $('main-play').textContent = playing ? '[pause]' : '[play]';
  $('sidebar-play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  $('main-play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  const elapsed = player.currentTime;
  $('elapsed').textContent = elapsed > 0 || playing ? clockTime(elapsed) : '--:--:--';
}

async function togglePlayback() {
  if (player.isPlaying) player.pause();
  else await player.play();
  renderPlayback();
}

async function chooseEpisode(ep, autoplay = false, historyMode = 'push') {
  if (!ep || isNavigating) return;
  isNavigating = true;
  current = ep;
  player.load(ep);
  if (historyMode === 'push') history.pushState({ episode: ep.id }, '', `/${ep.slug}/`);
  renderEpisode();
  $('main').scrollTop = 0;
  isNavigating = false;
  if (autoplay) await togglePlayback();
}

function seek(seconds) {
  player.seek(player.currentTime + seconds);
  renderPlayback();
}
function changeVolume(steps) {
  volume = Math.max(0, Math.min(1, Math.round((volume + steps) * 10) / 10));
  player.setVolume(volume);
  notify('Volume: ' + Math.round(volume * 100) + '%');
}
function toggleFavorite() {
  if (favorites.has(current.id)) favorites.delete(current.id);
  else favorites.add(current.id);
  storage.write('terminal-favourites', [...favorites]);
  renderEpisode();
}
function randomEpisode() {
  const options = episodes.filter(ep => ep.id !== current.id);
  chooseEpisode(options[Math.floor(Math.random() * options.length)], true);
}

$('sidebar-play').addEventListener('click', togglePlayback);
$('main-play').addEventListener('click', togglePlayback);
$('prev-episode').addEventListener('click', () => chooseEpisode(episodeById(current.id === 1 ? 80 : current.id - 1)));
$('next-episode').addEventListener('click', () => chooseEpisode(episodeById(current.id === 80 ? 1 : current.id + 1)));
$('rewind').addEventListener('click', () => seek(-10));
$('forward').addEventListener('click', () => seek(10));
$('random').addEventListener('click', randomEpisode);
$('volume-down').addEventListener('click', () => changeVolume(-0.1));
$('volume-up').addEventListener('click', () => changeVolume(0.1));
$('favorite').addEventListener('click', toggleFavorite);
$('invert').addEventListener('click', () => {
  document.body.classList.toggle('inverted');
  notify(document.body.classList.contains('inverted') ? 'Light mode' : 'Dark mode');
});
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { notify('Fullscreen unavailable in this browser.'); }
});
$('pip').addEventListener('click', async () => {
  if (!('documentPictureInPicture' in window)) {
    notify('Picture-in-picture requires a supported browser.');
    return;
  }
  try {
    const pip = await window.documentPictureInPicture.requestWindow({ width: 350, height: 220 });
    const body = pip.document.body;
    body.style.cssText = "background:#1a1a1a;color:#05d5a1;font:20px 'Courier New',monospace;padding:15px";
    const label = pip.document.createElement('p'); label.textContent = `Episode ${current.id}: ${current.title}`;
    const btn = pip.document.createElement('button');
    btn.textContent = player.isPlaying ? '[pause]' : '[play]';
    btn.style.cssText = 'color:inherit;background:none;border:0;font:inherit;cursor:pointer';
    btn.addEventListener('click', async () => { await togglePlayback(); btn.textContent = player.isPlaying ? '[pause]' : '[play]'; });
    body.append(label, btn);
  } catch { notify('Picture-in-picture could not be opened.'); }
});

const dialogCopy = {
  about: ['About', 'A series of mixes intended for listening while programming to focus the brain and inspire the mind. This website is an independently made visual recreation of the original musicforprogramming.net design.'],
  credits: ['Credits', 'Original concept and published archive: musicforprogramming.net. The text-only visual recreation and ambient demonstration audio are separately implemented. Episode 70 tracklist and remote MP3 reference were supplied for this project.'],
  enterprise: ['Enterprise mode', 'A minimalist option with no trackers, ads, accounts or paid services. This replica runs as a plain static page.']
};
document.querySelectorAll('[data-dialog]').forEach(button => {
  button.addEventListener('click', () => {
    const [title, copy] = dialogCopy[button.dataset.dialog];
    $('dialog-title').textContent = title;
    $('dialog-content').textContent = copy;
    $('info-dialog').showModal();
  });
});
window.addEventListener('popstate', () => chooseEpisode(episodeFromLocation(), false, 'none'));
window.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,[contenteditable=true]')) return;
  if (document.querySelector('dialog[open]')) return;
  if (event.code === 'Space') { event.preventDefault(); togglePlayback(); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); seek(-10); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); seek(10); }
  else if (event.key.toLowerCase() === 'f') toggleFavorite();
  else if (event.key.toLowerCase() === 'i') $('invert').click();
  else if (event.key.toLowerCase() === 'r') randomEpisode();
});
setInterval(renderPlayback, 300);
renderEpisode();
