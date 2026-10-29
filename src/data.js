// Mission facts are public record; news and events are demo content.
export const MISSIONS = [
  {
    name: 'MarCO',
    sub: 'Mars Cube One',
    tag: 'Deep space',
    text: 'Two CubeSats that followed InSight to Mars and relayed its landing in near real time, the first CubeSats beyond Earth orbit.',
    size: '2 × 6U', year: '2018', dest: 'Mars flyby', mass: '13.5 kg',
    art: 'mars',
  },
  {
    name: 'CAPSTONE',
    sub: 'Cislunar pathfinder',
    tag: 'Lunar',
    text: 'Flew the near-rectilinear halo orbit planned for Gateway around the Moon, proving the path before larger craft use it.',
    size: '12U', year: '2022', dest: 'Lunar NRHO', mass: '25 kg',
    art: 'moon',
  },
  {
    name: 'BioSentinel',
    sub: 'Deep-space biology',
    tag: 'Science',
    text: 'Carried live yeast past the Moon on Artemis I to measure how deep-space radiation damages DNA over months.',
    size: '6U', year: '2022', dest: 'Orbit of the Sun', mass: '14 kg',
    art: 'sun',
  },
  {
    name: 'TROPICS',
    sub: 'Storm watchers',
    tag: 'Earth',
    text: 'A small constellation of microwave sounders that revisits tropical cyclones far more often than a single large satellite can.',
    size: '4 × 3U', year: '2023', dest: 'Low Earth orbit', mass: '5.3 kg',
    art: 'earth',
  },
];

export const FACTORS = [
  { id: '1U', u: [1, 1, 1], dims: '10 × 10 × 11.35 cm', mass: '2 kg', use: 'Student builds, tech demos' },
  { id: '3U', u: [1, 3, 1], dims: '10 × 10 × 34 cm', mass: '6 kg', use: 'Earth imaging, weather' },
  { id: '6U', u: [2, 3, 1], dims: '22.6 × 10 × 36.6 cm', mass: '12 kg', use: 'Deep space, biology' },
  { id: '12U', u: [2, 3, 2], dims: '22.6 × 22.6 × 36.6 cm', mass: '24 kg', use: 'Lunar, propulsion' },
];

export const NEWS = [
  { kind: 'Feature', mins: 8, date: 'Oct 22, 2026', title: 'Inside MarCO: how two briefcase-sized satellites relayed a Mars landing', art: 'mars' },
  { kind: 'Engineering', mins: 4, date: 'Oct 9, 2026', title: 'Why the antennas wait until orbit to unfold', art: 'antenna' },
  { kind: 'Guide', mins: 6, date: 'Sep 30, 2026', title: 'A 1U parts list, from the rails to the radio', art: 'parts' },
];

export const EVENTS = [
  { d: '14', m: 'Nov', title: 'Open build day: assemble a 1U frame', where: 'Build lab · 10:00 – 14:00', kind: 'Workshop' },
  { d: '03', m: 'Dec', title: 'Ground station night: catch a pass on UHF', where: 'Rooftop dish · 19:30', kind: 'Meetup' },
  { d: '18', m: 'Jan', title: 'Deployables 101: antennas, panels and burn wires', where: 'Online · 17:00', kind: 'Webinar' },
];
