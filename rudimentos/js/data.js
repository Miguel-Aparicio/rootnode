// ──────────────────────────────────────
//  Pure data — no DOM, no side-effects
// ──────────────────────────────────────

export const LEVELS = [
  { key: 'bronze',   name: 'Bronce',  bpm: 60,  cls: 'bronze'   },
  { key: 'silver',   name: 'Plata',   bpm: 80,  cls: 'silver'   },
  { key: 'gold',     name: 'Oro',     bpm: 100, cls: 'gold'     },
  { key: 'platinum', name: 'Platino', bpm: 130, cls: 'platinum' },
  { key: 'diamond',  name: 'Diamante',bpm: 160, cls: 'diamond'  },
];

// ── Pattern note helpers ──
// Each note: { h:'R'|'L', a?:true (accent), g?:'r'|'l' (grace), d?:'r'|'l' (drag), b?:true (buzz) }
export const RR = (o = {}) => ({ h: 'R', ...o });
export const LL = (o = {}) => ({ h: 'L', ...o });
export const RA = (o = {}) => ({ h: 'R', a: true, ...o });
export const LA = (o = {}) => ({ h: 'L', a: true, ...o });

export const RUDIMENTS = [
  { id: 1,  tier: 1, cat: 'Rolls de un golpe',    name: 'Single Stroke Roll',        desc: 'La base de toda la percusión. Alterna R e I de forma continua y uniforme.',                                          pattern: [[RA(), LL(), RR(), LL()], [RR(), LL(), RR(), LL()]] },
  { id: 4,  tier: 1, cat: 'Rolls de dos golpes',  name: 'Double Stroke Open Roll',   desc: 'Dos rebotes iguales por mano. Controla el rebote y mantén la dinámica uniforme.',                                   pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()]] },
  { id: 15, tier: 1, cat: 'Rolls de buzz',        name: 'Multiple Bounce Roll',      desc: 'Roll de buzz (z). Deja que el palo rebote libremente con presión controlada.',                                       pattern: [[{ h: 'R', b: true }], [{ h: 'L', b: true }], [{ h: 'R', b: true }], [{ h: 'L', b: true }]] },
  { id: 16, tier: 1, cat: 'Diddles',              name: 'Single Paradiddle',         desc: 'El rudimento más importante: RLRR / LRLL. Base de todos los paradiddles.',                                           pattern: [[RA(), LL(), RR(), RR()], [LA(), RR(), LL(), LL()]] },
  { id: 20, tier: 1, cat: 'Flams',               name: 'Flam',                      desc: 'Grace note justo antes del golpe principal. La grace va en la mano contraria.',                                        pattern: [[{ h: 'R', a: true, g: 'l' }], [{ h: 'L', a: true, g: 'r' }]] },
  { id: 31, tier: 1, cat: 'Drags',               name: 'Drag (Ruff)',                desc: 'Dos grace notes antes del golpe principal: llR / rrL.',                                                               pattern: [[{ h: 'R', d: 'l' }], [{ h: 'L', d: 'r' }]] },
  { id: 2,  tier: 2, cat: 'Rolls de un golpe',    name: 'Single Stroke Four',        desc: 'Cuatro golpes alternados con acento en el primero.',                                                                  pattern: [[RA(), LL(), RR(), LL()]] },
  { id: 3,  tier: 2, cat: 'Rolls de un golpe',    name: 'Single Stroke Seven',       desc: 'Siete golpes alternados.',                                                                                            pattern: [[RA(), LL(), RR(), LL()], [RR(), LL(), RA()], [LA(), RR(), LL(), RR()], [LL(), RR(), LA()]] },
  { id: 17, tier: 2, cat: 'Diddles',              name: 'Double Paradiddle',         desc: 'RLRLRR / LRLRLL.',                                                                                                    pattern: [[RA(), LL(), RR(), LL(), RR(), RR()], [LA(), RR(), LL(), RR(), LL(), LL()]] },
  { id: 18, tier: 2, cat: 'Diddles',              name: 'Triple Paradiddle',         desc: 'RLRLRLRR / LRLRLRLL.',                                                                                                pattern: [[RA(), LL(), RR(), LL(), RR(), LL(), RR(), RR()], [LA(), RR(), LL(), RR(), LL(), RR(), LL(), LL()]] },
  { id: 19, tier: 2, cat: 'Diddles',              name: 'Single Paradiddle-Diddle',  desc: 'RLRRLL / LRLLRR.',                                                                                                   pattern: [[RA(), LL(), RR(), RR(), LL(), LL()], [LA(), RR(), LL(), LL(), RR(), RR()]] },
  { id: 5,  tier: 2, cat: 'Rolls de dos golpes',  name: 'Five Stroke Roll',          desc: 'RRLLR / LLRRL.',                                                                                                      pattern: [[RR(), RR(), LL(), LL()], [RA()], [LL(), LL(), RR(), RR()], [LA()]] },
  { id: 7,  tier: 2, cat: 'Rolls de dos golpes',  name: 'Seven Stroke Roll',         desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LA()], [LL(), LL(), RR(), RR()], [LL(), LL(), RA()]] },
  { id: 9,  tier: 2, cat: 'Rolls de dos golpes',  name: 'Nine Stroke Roll',          desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RA()]] },
  { id: 21, tier: 2, cat: 'Flams',               name: 'Flam Accent',               desc: 'Tresillo de corcheas con grace note en el golpe acentuado.',                                                           pattern: [[{ h: 'R', a: true, g: 'l' }, LL(), LL()], [{ h: 'L', a: true, g: 'r' }, RR(), RR()]] },
  { id: 22, tier: 2, cat: 'Flams',               name: 'Flam Tap',                  desc: 'lR rR / rL lL.',                                                                                                      pattern: [[{ h: 'R', a: true, g: 'l' }, RR()], [{ h: 'L', a: true, g: 'r' }, LL()]] },
  { id: 34, tier: 2, cat: 'Drags',               name: 'Lesson 25',                 desc: 'llR llR >R R / rrL rrL >L L.',                                                                                        pattern: [[{ h: 'R', d: 'l' }, { h: 'R', d: 'l' }, RA(), RR()], [{ h: 'L', d: 'r' }, { h: 'L', d: 'r' }, LA(), LL()]] },
  { id: 32, tier: 2, cat: 'Drags',               name: 'Single Drag Tap',           desc: 'Drag acentuado + tap sencillo.',                                                                                       pattern: [[{ h: 'R', a: true, d: 'l' }, LL()], [{ h: 'L', a: true, d: 'r' }, RR()]] },
  { id: 11, tier: 3, cat: 'Rolls de dos golpes',  name: 'Thirteen Stroke Roll',      desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RA()]] },
  { id: 12, tier: 3, cat: 'Rolls de dos golpes',  name: 'Fifteen Stroke Roll',       desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), RR(), LA()]] },
  { id: 13, tier: 3, cat: 'Rolls de dos golpes',  name: 'Seventeen Stroke Roll',     desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RA()]] },
  { id: 6,  tier: 3, cat: 'Rolls de dos golpes',  name: 'Six Stroke Roll',           desc: '',                                                                                                                    pattern: [[RA(), LL(), LL()], [RR(), RR(), LA()]] },
  { id: 10, tier: 3, cat: 'Rolls de dos golpes',  name: 'Ten Stroke Roll',           desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), LA()]] },
  { id: 8,  tier: 3, cat: 'Rolls de dos golpes',  name: 'Eleven Stroke Roll',        desc: '',                                                                                                                    pattern: [[RR(), RR(), LL(), LL()], [RR(), RR(), LL(), LL()], [RR(), RR(), LA()]] },
  { id: 35, tier: 3, cat: 'Drags',               name: 'Single Dragadiddle',        desc: 'Paradiddle con drag en el segundo golpe.',                                                                             pattern: [[RA(), RR(), { h: 'R', d: 'l' }, RR()], [LA(), LL(), { h: 'L', d: 'r' }, LL()]] },
  { id: 36, tier: 3, cat: 'Drags',               name: 'Drag Paradiddle #1',        desc: '',                                                                                                                    pattern: [[RA(), { h: 'L', d: 'l' }, RR(), LL(), RR(), RR()], [LA(), { h: 'R', d: 'r' }, LL(), RR(), LL(), LL()]] },
  { id: 37, tier: 3, cat: 'Drags',               name: 'Drag Paradiddle #2',        desc: '',                                                                                                                    pattern: [[RA(), { h: 'L', d: 'l' }, { h: 'R', d: 'l' }, LL(), RR(), LL(), RR(), RR()], [LA(), { h: 'R', d: 'r' }, { h: 'L', d: 'r' }, RR(), LL(), RR(), LL(), LL()]] },
  { id: 25, tier: 3, cat: 'Flams',               name: 'Single Flammed Mill',       desc: 'lR rL L R / rL lR R L.',                                                                                              pattern: [[{ h: 'R', g: 'l' }, { h: 'L', g: 'r' }, LL(), RR()], [{ h: 'L', g: 'r' }, { h: 'R', g: 'l' }, RR(), LL()]] },
  { id: 28, tier: 3, cat: 'Flams',               name: 'Swiss Army Triplet',        desc: 'Tresillo con flam: lRR / rLL.',                                                                                       pattern: [[{ h: 'R', a: true, g: 'l' }, RR(), LL()], [{ h: 'L', a: true, g: 'r' }, LL(), RR()]] },
  { id: 23, tier: 3, cat: 'Flams',               name: 'Flamacue',                  desc: 'lR L R >L / rL R L >R.',                                                                                              pattern: [[{ h: 'R', g: 'l' }, LL(), RR(), LA()], [{ h: 'L', g: 'r' }, RR(), LL(), RA()]] },
  { id: 14, tier: 4, cat: 'Rolls de tres golpes', name: 'Triple Stroke Roll',        desc: 'Tres golpes por mano con rebote controlado: RRR LLL.',                                                                pattern: [[RR(), RR(), RR()], [LL(), LL(), LL()], [RR(), RR(), RR()], [LL(), LL(), LL()]] },
  { id: 24, tier: 4, cat: 'Flams',               name: 'Flam Paradiddle',           desc: 'Single paradiddle con grace note en el primer golpe.',                                                                 pattern: [[{ h: 'R', a: true, g: 'l' }, LL(), RR(), RR()], [{ h: 'L', a: true, g: 'r' }, RR(), LL(), LL()]] },
  { id: 27, tier: 4, cat: 'Flams',               name: 'Pataflafla',                desc: 'Cuatro flams alternando la mano de la grace note.',                                                                    pattern: [[{ h: 'R', g: 'l' }, { h: 'L', g: 'r' }, { h: 'R', g: 'l' }, { h: 'L', g: 'r' }], [{ h: 'L', g: 'r' }, { h: 'R', g: 'l' }, { h: 'L', g: 'r' }, { h: 'R', g: 'l' }]] },
  { id: 33, tier: 4, cat: 'Drags',               name: 'Double Drag Tap',           desc: 'Dos drags + tap sencillo.',                                                                                            pattern: [[{ h: 'R', d: 'l' }, { h: 'R', d: 'l' }, RR()], [{ h: 'L', d: 'r' }, { h: 'L', d: 'r' }, LL()]] },
  { id: 26, tier: 4, cat: 'Flams',               name: 'Flam Paradiddle-Diddle',    desc: 'Paradiddle-diddle con flam en el primer golpe.',                                                                       pattern: [[{ h: 'R', a: true, g: 'l' }, LL(), RR(), RR(), LL(), LL()], [{ h: 'L', a: true, g: 'r' }, RR(), LL(), LL(), RR(), RR()]] },
  { id: 38, tier: 4, cat: 'Drags',               name: 'Single Ratamacue',          desc: 'Drag + RL acentuado al final.',                                                                                        pattern: [[{ h: 'R', d: 'l' }, LL(), RR(), LA()], [{ h: 'L', d: 'r' }, RR(), LL(), RA()]] },
  { id: 39, tier: 4, cat: 'Drags',               name: 'Double Ratamacue',          desc: 'Dos drags + RL acentuado.',                                                                                            pattern: [[{ h: 'R', d: 'l' }, { h: 'R', d: 'l' }, RR(), LL(), RA()], [{ h: 'L', d: 'r' }, { h: 'L', d: 'r' }, LL(), RR(), LA()]] },
  { id: 40, tier: 4, cat: 'Drags',               name: 'Triple Ratamacue',          desc: 'Tres drags + RL acentuado.',                                                                                           pattern: [[{ h: 'R', d: 'l' }, { h: 'R', d: 'l' }, { h: 'R', d: 'l' }, RR(), LL(), RA()], [{ h: 'L', d: 'r' }, { h: 'L', d: 'r' }, { h: 'L', d: 'r' }, LL(), RR(), LA()]] },
  { id: 29, tier: 4, cat: 'Flams',               name: 'Inverted Flam Tap',         desc: 'La grace note está en la misma mano que el golpe principal.',                                                          pattern: [[{ h: 'L', g: 'r' }, { h: 'R', g: 'l' }], [{ h: 'R', g: 'l' }, { h: 'L', g: 'r' }]] },
  { id: 30, tier: 4, cat: 'Flams',               name: 'Flam Drag',                 desc: 'Flam seguido de drag.',                                                                                               pattern: [[{ h: 'R', a: true, g: 'l' }, { h: 'L', d: 'l' }, RR()], [{ h: 'L', a: true, g: 'r' }, { h: 'R', d: 'r' }, LL()]] },
];

export const VF_IMG_BASE = 'img/';
export const VF_IMG = {
  1:'01_single-stroke-roll', 2:'02_single-stroke-4', 3:'03_single-stroke-7',
  4:'04_double-stroke-roll', 5:'05_five-stroke-roll', 6:'06_six-stroke-roll',
  7:'07_seven-stroke-roll', 8:'08_eleven-stroke-roll', 9:'09_nine-stroke-roll',
  10:'10_ten-stroke-roll', 11:'11_thirteen-stroke-roll', 12:'12_fifteen-stroke-roll',
  13:'13_seventeen-stroke-roll', 14:'14_triple-stroke-roll', 15:'15_multiple-bounce-roll',
  16:'16_single-paradiddle', 17:'17_double-paradiddle', 18:'18_triple-paradiddle',
  19:'19_paradiddle-diddle', 20:'20_flam', 21:'21_flam-accent', 22:'22_flam-tap',
  23:'23_flamacue', 24:'24_flam-paradiddle', 25:'25_flammed-mill',
  26:'26_flam-paradiddle-diddle', 27:'27_pataflafla', 28:'28_swiss-army-triplet',
  29:'29_inverted-flam-tap', 30:'30_flam-drag', 31:'31_drag', 32:'32_single-drag-tap',
  33:'33_double-drag-tap', 34:'34_lesson-25', 35:'35_single-dragadiddle',
  36:'36_drag-paradiddle1', 37:'37_drag-paradiddle2', 38:'38_single-ratamacue',
  39:'39_double-ratamacue', 40:'40_triple-ratamacue',
};

export const VF_BASE = 'https://ae.vicfirth.com/wp-content/uploads/';
export const VF_STEMS = {
  1:'01_Single-Stroke-Roll-', 2:'02_Single-Stroke-4_', 3:'03_Single-Stroke-7_',
  14:'05_Triple-Stroke-Roll_', 4:'06_Double-Stroke-Roll_', 5:'07_Five-Stroke-Roll_',
  6:'08_Six-Stroke-Roll_', 7:'09_Seven-Stroke-Roll-', 9:'10_Nine-Stroke-Roll_',
  10:'11_Ten-Stroke-Roll_', 8:'12_Eleven-Stroke-Roll_', 11:'13_Thirteen-Stroke-Roll_',
  12:'14_Fifteen-Stroke-Roll_', 13:'15_Seventeen-Stroke-Roll_', 16:'16_Single-Paradiddle_',
  17:'17_Double-Paradiddle_', 18:'18_Triple-Paradiddle_', 19:'19_Paradiddle-diddle_',
  20:'20_Flam_', 21:'21_Flam-Accent_', 22:'22_Flam-Tap_', 23:'23_Flamacue_',
  24:'24_Flam-Paradiddle_', 25:'25_Flammed-Mill_', 26:'26_Flam-Paradiddle-diddle_',
  27:'27_Patafla-fla_', 28:'28_Swiss-Army-Triplet_', 29:'29_Inverted-Flam-Tap_',
  30:'30_Flam-Drag_', 32:'32_Single-Drag-Tap_', 33:'33_Double-Drag-Tap_',
  34:'34_Lesson-25_', 35:'35_Single-Dragadiddle_', 36:'36_Drag-Paradiddle-1_',
  37:'37_Drag-Paradiddle-2_', 38:'38_Single-Ratamacue_', 39:'39_Double-Ratamacue_',
  40:'40_Triple-Ratamacue_',
};

export const AP_TRACKS = [
  { key: 'open-close-open', label: 'O-C-O'   },
  { key: 'bronze',          label: 'Bronce'   },
  { key: 'silver',          label: 'Plata'    },
  { key: 'gold',            label: 'Oro'      },
  { key: 'platinum',        label: 'Platino'  },
  { key: 'diamond',         label: 'Diamante' },
];

export const tierNames = { 1: 'Fundamentos', 2: 'Construcción', 3: 'Desarrollo', 4: 'Maestría' };
export const tierSub   = { 1: 'Los 6 básicos esenciales', 2: 'Combinaciones y rolls', 3: 'Variaciones avanzadas', 4: 'Técnica de maestro' };
export const tierIcons = { 1: '🥁', 2: '⚙️', 3: '🔥', 4: '💎' };
export const catIcons  = {
  'Rolls de un golpe':    '☝️',
  'Rolls de dos golpes':  '✌️',
  'Rolls de tres golpes': '🔄',
  'Rolls de buzz':        '🌀',
  'Diddles':              '⚡',
  'Flams':                '🎯',
  'Drags':                '🌊',
};

export const categories = [...new Set(RUDIMENTS.map(r => r.cat))];
