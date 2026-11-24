import { episodes } from './episodes.js';
import { createVisualizer } from './visualizer.js';

const $ = id => document.getElementById(id);
const audio = $('audio');
const bySlug = slug => episodes.find(e => e.slug === slug);
const byNumber = num => episodes.find(e => e.order === num);
const favKey='coding-mixes-favourites-v3';
const getSaved=(key,defaultValue)=>{try { return JSON.parse(localStorage.getItem(key)) ?? defaultValue; } catch { return defaultValue; }};
const favorites = new Set(getSaved(favKey,[]));
const seconds = duration => duration.split(':').reduce((s,n) => s * 60 + Number(n), 0);
const fmtTime = sec => { sec=Math.max(0,Math.floor(sec||0)); return [Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(n=>String(n).padStart(2,'0')).join(':'); };
const fmtSize = bytes => `${Math.round(Number(bytes) / 1048576)} MB`;
const slug=location.pathname.split('/').filter(Boolean).at(-1);
const fromAddress=bySlug(slug)||byNumber(Number(new URLSearchParams(location.search).get('episode')));
const lastEpisode=Number(getSaved('coding-mixes-last-episode-v4',70));
let episode=fromAddress||byNumber(lastEpisode)||byNumber(70);
// Keep one public-facing URL. Legacy /seventy/ etc. are resolved then canonicalized.
history.replaceState({episode:episode.order},'', '/');
const wave=createVisualizer(audio,$('terminal-wave'));
let volume=1, eternal=false, toastTimer, transitionTimer=0, scrambleFrame=0, hoverEpisode=null;
const archiveItems = new Map();
let archiveCursor=null;

function notify(message){ const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3500); }
function makeLink(label,href,className=''){
  const a=document.createElement('a'); a.textContent=label;a.href=href;a.className=className;
  if(/^https?:\/\//.test(href)){a.target='_blank';a.rel='noopener noreferrer';}return a;
}
function positionArchiveCursor(target, immediate=false){
  if(!archiveCursor) return;
  const anchor = archiveItems.get(target) || archiveItems.get(episode.order);
  if(!anchor) return;
  const box=$('episode-archive');
  archiveCursor.style.transitionDuration=immediate?'0ms':'';
  archiveCursor.style.left=`${Math.max(0,anchor.offsetLeft-2)}px`;
  archiveCursor.style.transform=`translateY(${anchor.offsetTop}px)`;
  archiveCursor.style.width=`${anchor.offsetWidth + 5}px`;
  for(const [number,node] of archiveItems) node.classList.toggle('is-highlighted',number===target);
  if(immediate) requestAnimationFrame(()=>{archiveCursor.style.transitionDuration='';});
}
function renderArchive(){
  const fragment=document.createDocumentFragment();
  const box=$('episode-archive');
  archiveItems.clear();
  archiveCursor=document.createElement('div');
  archiveCursor.className='archive-cursor';
  archiveCursor.setAttribute('aria-hidden','true');
  fragment.append(archiveCursor);
  for(const e of episodes){
    const a=makeLink(`${String(e.order).padStart(2,'0')}: ${e.title.replace(/^\d{1,2}:\s*/,'')}`,'/');
    a.className=(e.order===62?'special ':'')+(episode.order===e.order?'is-loaded ':'');
    if(e.order===episode.order)a.setAttribute('aria-current','true');
    const em=document.createElement('em');em.textContent=a.textContent;a.replaceChildren(em);
    archiveItems.set(e.order,a);
    a.addEventListener('pointerenter',()=>{hoverEpisode=e.order;positionArchiveCursor(e.order);});
    a.addEventListener('focus',()=>{hoverEpisode=e.order;positionArchiveCursor(e.order);});
    a.addEventListener('click',evt=>{
      if(evt.button||evt.metaKey||evt.ctrlKey||evt.shiftKey||evt.altKey)return;
      evt.preventDefault();hoverEpisode=e.order;selectEpisode(e,true,true);
    });
    fragment.append(a);
  }
  box.replaceChildren(fragment);
  box.onpointerleave=()=>{hoverEpisode=null;positionArchiveCursor(episode.order);};
  box.onfocusout=evt=>{if(!box.contains(evt.relatedTarget)){hoverEpisode=null;positionArchiveCursor(episode.order);}};
  requestAnimationFrame(()=>positionArchiveCursor(hoverEpisode??episode.order,true));
}
function updatePlayback(){
  const playing=!audio.paused&&!audio.ended;
  $('sidebar-play').textContent=playing?'[stop]':'[play]';$('main-play').textContent=playing?'[stop]':'[play]';
  $('elapsed').textContent=fmtTime(audio.currentTime);$('volume-status').textContent=Math.round(audio.volume*100)+'%';
  const progress=Math.min(1,(audio.currentTime||0)/(audio.duration||seconds(episode.duration)));
  const marks=Math.min(34,Math.max(0,Math.round(progress*34)));
  $('ascii-progress').textContent='─'.repeat(marks)+'·'+'─'.repeat(34-marks);
}
function renderEpisode(){
  $('episode-number').textContent=episode.order;
  $('episode-name').textContent=episode.title.replace(/^\d{1,2}:\s*/,'');
  $('duration').textContent=episode.duration;$('filesize').textContent=fmtSize(episode.filesize);
  $('source').href=episode.file;
  $('now-playing').textContent=`• Episode ${episode.order}: ${episode.title.replace(/^\d{1,2}:\s*/,'')}`;
  $('favourite').textContent=favorites.has(episode.order)?'[forget]':'[favourite]';
  $('favourite').setAttribute('aria-pressed',String(favorites.has(episode.order)));
  document.title=`Episode ${episode.order}: ${episode.title.replace(/^\d{1,2}:\s*/,'')} · musicForProgramming();`;
  const tracks=document.createDocumentFragment();
  for(const name of episode.tracklist){
    tracks.append(makeLink(name,`https://www.google.com/search?q=${encodeURIComponent('site:discogs.com '+name)}`,'subtle-hover'),document.createElement('br'));
  }
  $('tracklist').replaceChildren(tracks);
  const links=document.createDocumentFragment();
  for(const link of episode.links){if(/^https?:\/\//.test(link.href))links.append(makeLink(link.label||link.href,link.href,'blue'),document.createElement('br'));}
  $('episode-links').replaceChildren(links);
  renderArchive();updatePlayback();
}
function animateEpisodeChange(){
  // The original visual effect is a text scramble, not a giant oval.
  // Reveal each track's real characters in a different rhythmic wave.
  const region=$('content');
  const trackNodes=[...$('tracklist').querySelectorAll('a')];
  if(!trackNodes.length || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  cancelAnimationFrame(scrambleFrame);
  region.classList.remove('episode-switching');
  void region.offsetWidth;
  region.classList.add('episode-switching');
  const baseline=trackNodes.map(node=>node.textContent);
  const symbols='~°^*+_./-|\\';
  const start=performance.now();
  const duration=960;
  function scramble(now){
    const progress=Math.min(1,(now-start)/duration);
    const beat=Math.floor(now/55);
    trackNodes.forEach((node,row)=>{
      const line=baseline[row];
      const delay=Math.min(.55,row*.028);
      const reveal=Math.max(0,Math.min(1,(progress-delay)/(1-delay)));
      const revealed=Math.floor(reveal*line.length);
      if(progress>=1){node.textContent=line;return;}
      let text='';
      for(let col=0;col<line.length;col++){
        const ch=line[col];
        if(ch===' ' || col<revealed) {text+=ch;continue;}
        // Leave a few letter fragments in motion, creating the bouncing ASCII
        // snapshots seen between episodes, without permanently hiding tracks.
        const selector=(col*13+row*37+beat*7+episode.order)%15;
        text+=selector<5?ch:symbols[(col*17+row*3+beat)%symbols.length];
      }
      node.textContent=text;
    });
    if(progress<1) scrambleFrame=requestAnimationFrame(scramble);
    else region.classList.remove('episode-switching');
  }
  scrambleFrame=requestAnimationFrame(scramble);
}
function selectEpisode(next,navigate=false,autoplay=false){
  if(!next)return;
  const hasChanged=episode.order!==next.order;
  cancelAnimationFrame(scrambleFrame);
  audio.pause();audio.src=next.file;audio.load();episode=next;
  if(navigate)history.pushState({episode:next.order},'','/');
  try{localStorage.setItem('coding-mixes-last-episode-v4',JSON.stringify(episode.order));}catch{}
  renderEpisode();wave.setEpisode(episode.order);$('content').scrollTop=0;
  if(hasChanged)animateEpisodeChange();
  if(autoplay)start();
}
function start(){
  // Start both audio operations within the click gesture; awaiting AudioContext
  // before calling play() can lose transient user activation in some browsers.
  wave.activate().catch(()=>{});
  const attempt=audio.play();
  if(attempt && typeof attempt.catch==='function') attempt.catch(()=>notify('External MP3 could not play. Try [source] or check stream availability.'));
  updatePlayback();
}
function stop(){audio.pause();audio.currentTime=0;updatePlayback();wave.refresh();}
function toggle(){if(audio.paused)start();else stop();}
function seek(diff){try{audio.currentTime=Math.max(0,Math.min(audio.duration||seconds(episode.duration),audio.currentTime+diff));}catch{}updatePlayback();}
function step(n){selectEpisode(byNumber(((episode.order-1+n+80)%80)+1),true,true);}
function shuffle(){const options=episodes.filter(e=>e.order!==episode.order);selectEpisode(options[Math.floor(Math.random()*options.length)],true,true);}
function setVolume(diff){volume=Math.max(0,Math.min(1,Math.round((volume+diff)*10)/10));audio.volume=volume;updatePlayback();}
function toggleFavorite(){if(favorites.has(episode.order))favorites.delete(episode.order);else favorites.add(episode.order);try{localStorage.setItem(favKey,JSON.stringify([...favorites]));}catch{}renderEpisode();}
$('sidebar-play').addEventListener('click',toggle);$('main-play').addEventListener('click',toggle);
$('previous').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));
$('rewind').addEventListener('click',()=>seek(-30));$('forward').addEventListener('click',()=>seek(30));
$('random').addEventListener('click',shuffle);
$('volume-down').addEventListener('click',()=>setVolume(-.1));$('volume-up').addEventListener('click',()=>setVolume(.1));
$('favourite').addEventListener('click',toggleFavorite);
$('invert').addEventListener('click',()=>document.body.classList.toggle('invert'));
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable.');}});
$('enterprise').addEventListener('click',()=>{document.body.classList.toggle('bloom');notify(document.body.classList.contains('bloom')?'Enterprise display on':'Enterprise display off');});
$('eternal').addEventListener('click',()=>{eternal=!eternal;$('eternal').textContent=eternal?'[eternal: on]':'[mfp.eternal]';notify(eternal?'Continuous random playback enabled':'Continuous random playback disabled');});
$('pip').addEventListener('click',async()=>{
  if(!('documentPictureInPicture' in window)){notify('Picture-in-picture is not available in this browser.');return;}
  try{const pip=await window.documentPictureInPicture.requestWindow({width:380,height:185});
    pip.document.body.style.cssText='background:#1a1a1a;color:#1beb9e;font:16px monospace;padding:16px';
    const title=pip.document.createElement('p');title.textContent=episode.title;
    const button=pip.document.createElement('button');button.textContent='[play / stop]';button.style.cssText='background:none;border:0;color:inherit;font:inherit;cursor:pointer';button.addEventListener('click',toggle);
    pip.document.body.append(title,button);
  }catch{notify('Picture-in-picture could not start.');}
});
const modal=$('info-modal');
const modalData={
  about:['About','A series of mixes intended for listening while programming to focus the brain and inspire the mind. Choose an episode on the right and press [play].'],
  credits:['Credits','Independent interface recreation built from metadata supplied for this project. Music belongs to its respective artists and rightsholders. Recordings are streamed from external sources, not bundled with this website.'],
  folder:['Folder','Add your own licensed artwork to the project to enable a local artwork download.'],
  'own-links':['Your links','Add links for your own Patreon and podcast accounts in index.html. This independent website does not redirect visitors to another project.']
};
document.querySelectorAll('[data-modal]').forEach(b=>b.addEventListener('click',()=>{const [title,copy]=modalData[b.dataset.modal];$('info-title').textContent=title;const p=document.createElement('p');p.textContent=copy;$('info-content').replaceChildren(p);modal.showModal();}));
$('modal-close').addEventListener('click',()=>modal.close());
if(getSaved('coding-mixes-cookies',false))$('cookie-notice').hidden=true;
$('cookie-dismiss').addEventListener('click',()=>{try{localStorage.setItem('coding-mixes-cookies','true');}catch{}$('cookie-notice').hidden=true;});
for(const event of ['play','pause','timeupdate','durationchange'])audio.addEventListener(event,updatePlayback);
audio.addEventListener('ended',()=>{updatePlayback();if(eternal)shuffle();});
audio.addEventListener('error',()=>notify('MP3 unavailable or blocked. Open [source] to test the remote audio URL.'));
window.addEventListener('popstate',event=>{const restored=byNumber(event.state?.episode)||byNumber(70);selectEpisode(restored);});
window.addEventListener('keydown',event=>{if(event.target.closest('input,textarea,button,select,[contenteditable=true]')||modal.open)return;
  if(event.code==='Space'){event.preventDefault();toggle();}else if(event.key==='ArrowLeft'){event.preventDefault();seek(-30);}else if(event.key==='ArrowRight'){event.preventDefault();seek(30);}
});
const total=episodes.reduce((s,e)=>s+seconds(e.duration),0);
$('stat-episodes').textContent=`// ${episodes.length} episodes`;
$('stat-tracks').textContent=`// ${episodes.reduce((s,e)=>s+e.tracklist.length,0)} tracks`;
$('stat-hours').textContent=`// ${Math.floor(total/3600)} hours`;
$('stat-minutes').textContent=`// ${Math.floor(total/60)%60} minutes`;
$('stat-seconds').textContent=`// ${total%60} seconds`;
selectEpisode(episode);
setInterval(updatePlayback,500);
