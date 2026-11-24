/**
 * Demo catalog. All entries are fictional and original, and all audio is
 * generated locally in the browser. Add a rights-cleared MP3 under public/audio
 * and set audioSrc: './audio/your-file.mp3' on an episode to stream that file.
 */
const titles = [
  ['The Quiet Protocol', 'Focus / Minimal', 'A soft opening. Slow pulses, distant warmth, and room for a fresh idea.', 'WARM / METHODICAL'],
  ['Memory Palace', 'Ambient / Drift', 'A field of gradually changing notes where each thought has somewhere to land.', 'AIRY / NOSTALGIC'],
  ['Low Orbit', 'Electronic / Space', 'Faraway signals and small repeating patterns for the hours after sundown.', 'WEIGHTLESS / WIDE'],
  ['Monochrome Skies', 'Ambient / Texture', 'Faint harmonic movements like clouds over an empty city.', 'SOFT / REFLECTIVE'],
  ['Blank Cursor', 'Minimal / Focus', 'Spare tones and patient silence for the first line of code.', 'MINIMAL / OPEN'],
  ['Afterimage', 'Electronic / Drift', 'An illuminated trail of gently folding melodies.', 'HAZY / MELODIC'],
  ['Ghost in the Cache', 'Ambient / Digital', 'Tiny digital ghosts drift through a slow-moving harmonic landscape.', 'GLASSY / STILL'],
  ['Nightfall Sequence', 'Deep Focus / Ambient', 'Slowly shifting harmonics and soft-edged textures for getting lost in a good problem.', 'LOW LIGHT / CLEAR MIND'],
  ['A Small Infinity', 'Ambient / Slow', 'Nearly motionless atmospheres with a quiet current underneath.', 'TIMELESS / WARM'],
  ['Soft Reset', 'Minimal / Electronic', 'A reset for the senses, built from restrained tones and distant echoes.', 'CLEAN / GENTLE'],
  ['Parallel Dreams', 'Dream / Electronic', 'Lightly interwoven signals, finding and losing each other.', 'DREAMY / CURIOUS'],
  ['Subtle Machines', 'Focus / Analog', 'Analog-inspired hums and reassuringly human imperfections.', 'TAPE / WARM'],
  ['Warm Data', 'Ambient / Texture', 'Slow, luminous chords in a room full of quiet equipment.', 'LUMINOUS / CALM'],
  ['Moonlit Terminal', 'Night / Focus', 'A companion for the one last thing you promised yourself you would finish.', 'NIGHT / PATIENT'],
  ['Still Processing', 'Slow / Drone', 'A gentle hum for hard problems and the wait between breakthroughs.', 'LOW / IMMERSIVE'],
  ['Blue Hour', 'Ambient / Melodic', 'Melodies fade into the moment before everything becomes night.', 'DUSK / FLOATING'],
  ['Gentle Syntax', 'Focus / Minimal', 'Small repeating phrases and spacious harmonics that never get in the way.', 'STRUCTURED / QUIET'],
  ['The Long Compile', 'Drone / Generative', 'Extended tones for keeping good company with unfinished work.', 'DEEP / STEADY']
];

const movementNames = [
  ['Initial Conditions','Distant Lights','A Gentle Pattern','Ambient Memory','Low Frequency','Between the Lines','Slow Return','Open Circuit'],
  ['Morning Residue','Soft Geometry','Thin Air','Bloom State','Quiet Motor','Drifting North','Warm Interference','Final Light'],
  ['Subliminal Signal','Paper Satellites','Night Windows','Past the Edge','Small Oscillations','Absent Coordinates','Ground Control','Home Again'],
  ['Cloud Cover','Silent Avenue','Moon Dust','A Familiar Place','Static and Light','Unfolding','Still Here','Falling Slowly']
];

export const episodes = titles.map(([title, category, description, mood], i) => {
  const number = i + 1;
  const durations = [53, 67, 59, 61, 46, 68, 62, 65, 72, 51, 63, 57, 70, 64, 60, 54, 66, 74];
  const duration = durations[i] * 60 + (i * 13 % 53);
  const movements = movementNames[i % movementNames.length].map((name, j) => ({
    title: name,
    artist: ['a room in motion', 'soft signals', 'the other side', 'sleep cycles'][i % 4],
    at: Math.round((j / 8) * duration)
  }));
  return {
    id: number,
    title,
    category,
    description,
    mood,
    duration,
    movements,
    root: [38, 42, 40, 45, 36, 43, 39, 41, 35, 40, 44, 37, 42, 38, 34, 43, 41, 36][i],
    seed: 11 + 37 * number,
    audioSrc: null // Set this to './audio/your-licensed-mix.mp3' for real MP3 playback.
  };
});

export const padNumber = n => String(n).padStart(2, '0');
export function formatTime(seconds) {
  const t = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(t / 3600);
  const minutes = Math.floor((t % 3600) / 60);
  const secs = t % 60;
  return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
}
