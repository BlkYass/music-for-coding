/**
 * Episode names/slugs match the publicly visible archive supplied as a reference.
 * Only Episode 70's detailed metadata was supplied for this replica.
 * We do NOT bundle copyrighted audio recordings.
 */
const archiveText = `
80|eighty|Nicolas Tilly
79|seventynine|Corticyte
78|seventyeight|Datassette
77|seventyseven|Phonaut
76|seventysix|Material Object
75|seventyfive|Datassette
74|seventyfour|NCW
73|seventythree|[in]anace
72|seventytwo|Freddy Cyclone
71|seventyone|Neon Genesis
70|seventy|THINGS DISAPPEAR
69|sixtynine|Pearl River Sound
68|sixtyeight|no data available
67|sixtyseven|Datassette
66|sixtysix|Conrad Clipper
65|sixtyfive|Matt Whitehead
64|sixtyfour|Strepsil
63|sixtythree|T-FLX
62|sixtytwo|Our Grey Lives
61|sixtyone|Linnley
60|sixty|TUNDRA
59|fiftynine|Miunau
58|fiftyeight|OliSUn
57|fiftyseven|Hainbach
56|fiftysix|Forest Drive West
55|fiftyfive|20 Jazz Funk Greats
54|fiftyfour|HLER
53|fiftythree|Beb Welten
52|fiftytwo|Inchindown
51|fiftyone|Mücha
50|fifty|Misc.
49|fortynine|Julien Mier
48|fortyeight|Michael Hicks
47|fortyseven|Abe Mangger
46|fortysix|Jo Johnson
45|fortyfive|Ehohroma
44|fortyfour|hukka
43|fortythree|Hey Exit
42|fortytwo|Datassette
41|fortyone|Sunjammer
40|forty|Mark Schneider
39|thirtynine|Kidding Kurrys
38|thirtyeight|J.S. Aurelius
37|thirtyseven|Lackluster
36|thirtysix|Ea7_dmZ
35|thirtyfive|Nadim Kobeissi
34|thirtyfour|Chukus
33|thirtythree|uuav
32|thirtytwo|Chris Seddon
31|thirtyone|Datassette
30|thirty|Matt Kruse
29|twentynine|Luke Handsfree
28|twentyeight|Big War
27|twentyseven|Michael Hicks
26|twentysix|Abstraction
25|twentyfive|_nono_
24|twentyfour|RITES
23|twentythree|Panda Magic
22|twentytwo|Mindaugaszq
21|twentyone|Idol Eyes
20|twenty|Uberdog
19|nineteen|Hivemind
18|eighteen|Konx Om Pax
17|seventeen|Graphplan
16|sixteen|Silent Stelios
15|fifteen|Dan Adeyemi
14|fourteen|Tahlhoff Garten + Untitled
13|thirteen|Matt Whitehead
12|twelve|Forgotten Light
11|eleven|Miles Tilmann
10|ten|Unity Gain Temple
9|nine|Datassette
8|eight|Connectedness Locus
7|seven|Tahlhoff Garten + Untitled
6|six|Gods Of The New Age
5|five|Abe Mangger
4|four|Com Truise
3|three|Datassette
2|two|Sunjammer
1|one|Datassette
`;

const episode70Tracks = [
  'Phoenix G - Soundbath@TheLoft',
  'Bedouin Ascent - Joyriding III',
  'Global Communication - Enlightenment From The Augur',
  'The Grid - Without Your Clarity I Would Still Be Bound By Gravity (Boundless Mix)',
  'Laraaji - Moon Shadows',
  'Interior - Ascending',
  'Aphex Twin - bank lullaby',
  'AshTreJinkins - no team effort',
  'Sam Gendel - ZeroZero',
  'Panoram - Ray Rain',
  'Harold Budd and Cocteau Twins - Memory Gongs',
  'John Livengood - Véhicule',
  'KMRU - strain',
  'Sébastien Robert - Imaginary Geography',
  'Gigi Masin & Allesandro Monti - O.A.L.',
  'Terre Thaemlitz - Aging Core, Aging Periphery',
  'AFX - s8v1 [brooklyn]',
  'Oneohtrix Point Never - Behind The Bank',
  'Fred Wackenhut - Orianna Twilight'
];

export const episodes = archiveText.trim().split('\n').map(line => {
  const [number, slug, title] = line.split('|');
  const id = Number(number);
  return {
    id, slug, title,
    duration: id === 70 ? 3810 : 3600,
    size: id === 70 ? '107 MB' : null,
    tracks: id === 70 ? episode70Tracks : [],
    // The original website hosts this URL; we only link to it, never bundle it.
    // Confirm you have permission for third-party streaming before public use.
    audioSrc: id === 70 ? 'https://datashat.net/music_for_programming_70-things_disappear.mp3' : null,
    root: [36, 38, 40, 41, 43, 45][id % 6],
    seed: id * 181 + 17
  };
});

export const episodeBySlug = slug => episodes.find(ep => ep.slug === slug);
export const episodeById = id => episodes.find(ep => ep.id === id);
export const two = n => String(n).padStart(2,'0');
export const clockTime = value => {
  const sec = Math.max(0,Math.floor(Number(value) || 0));
  return [Math.floor(sec / 3600),Math.floor((sec % 3600) / 60),sec % 60]
    .map(n=>String(n).padStart(2,'0')).join(':');
};
