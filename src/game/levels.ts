export type Rect = { x: number; y: number; w: number; h: number };

export type Mover = Rect & {
  id: string;
  axis: "x" | "y";
  range: number;
  speed: number;
  phase: number;
};

export type Pickup = {
  id: string;
  x: number;
  y: number;
  kind: "coin" | "food" | "laser";
};

export type Hazard = Rect & {
  id: string;
  kind: "cactus" | "roomba" | "mouse" | "moth" | "spider";
  range?: number;
  speed?: number;
  phase?: number;
};

export type Pillow = Rect & { id: string };

export type Draft = Rect & { id: string; dir: 1 | -1; force: number };

export type BossJar = { id: string; x: number; y: number; side: "left" | "right" };

export type BossDef = {
  kind: "biscuit";
  floor: number;
  left: number;
  right: number;
  jars: BossJar[];
};

export type Curtain = { id: string; x: number; y: number; w: number; h: number };

export type Checkpoint = { id: string; x: number; y: number };

export type Decor =
  | { kind: "window"; x: number; y: number; w: number; h: number }
  | { kind: "books"; x: number; y: number; w: number }
  | { kind: "rug"; x: number; y: number; w: number }
  | { kind: "frame"; x: number; y: number; w: number; h: number }
  | { kind: "plant"; x: number; y: number }
  | { kind: "lamp"; x: number; y: number }
  | { kind: "bowl"; x: number; y: number };

export type LevelDef = {
  id: string;
  name: string;
  subtitle: string;
  hint: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  solids: Rect[];
  oneways: Rect[];
  movers: Mover[];
  pickups: Pickup[];
  hazards: Hazard[];
  checkpoints: Checkpoint[];
  curtains: Curtain[];
  pillows: Pillow[];
  drafts: Draft[];
  boss?: BossDef;
  goal: Rect;
  decor: Decor[];
};

export const LEVELS: LevelDef[] = [
  {
    id: "sunroom",
    name: "Sunroom Sill",
    subtitle: "Tuna on the shelf. A mouse underfoot.",
    hint: "C pounces. Pillows launch you. Hold into a wall, then jump to kick off.",
    width: 2800,
    height: 760,
    spawn: { x: 64, y: 560 },
    solids: [
      { x: 0, y: 560, w: 720, h: 200 },
      { x: 860, y: 560, w: 560, h: 200 },
      { x: 1560, y: 480, w: 200, h: 24 },
      { x: 1560, y: 300, w: 28, h: 180 },
      { x: 1760, y: 560, w: 220, h: 200 },
      { x: 2300, y: 560, w: 500, h: 200 },
    ],
    oneways: [
      { x: 220, y: 430, w: 170, h: 16 },
      { x: 460, y: 310, w: 150, h: 16 },
      { x: 980, y: 400, w: 190, h: 16 },
      { x: 1220, y: 300, w: 130, h: 16 },
      { x: 1604, y: 292, w: 140, h: 16 },
    ],
    movers: [
      { id: "m1", x: 2020, y: 500, w: 160, h: 16, axis: "x", range: 160, speed: 1.15, phase: 0.4 },
    ],
    pickups: [
      { id: "c1", x: 180, y: 520, kind: "coin" },
      { id: "c2", x: 300, y: 500, kind: "coin" },
      { id: "c3", x: 430, y: 520, kind: "coin" },
      { id: "c4", x: 290, y: 400, kind: "coin" },
      { id: "c5", x: 530, y: 278, kind: "coin" },
      { id: "c6", x: 980, y: 520, kind: "coin" },
      { id: "c7", x: 1120, y: 520, kind: "coin" },
      { id: "c8", x: 1070, y: 372, kind: "coin" },
      { id: "food", x: 1280, y: 272, kind: "food" },
      { id: "c9", x: 1660, y: 440, kind: "coin" },
      { id: "c10", x: 1860, y: 520, kind: "coin" },
      { id: "c11", x: 2100, y: 450, kind: "coin" },
      { id: "c12", x: 2480, y: 510, kind: "coin" },
      { id: "c13", x: 980, y: 420, kind: "coin" },
      { id: "c14", x: 1080, y: 300, kind: "coin" },
      { id: "c15", x: 1660, y: 260, kind: "coin" },
      { id: "c16", x: 1720, y: 260, kind: "coin" },
    ],
    hazards: [
      { id: "h1", kind: "cactus", x: 500, y: 518, w: 36, h: 42 },
      { id: "h2", kind: "cactus", x: 1888, y: 518, w: 36, h: 42 },
      { id: "vac-sun", kind: "roomba", x: 1160, y: 528, w: 48, h: 32, range: 90, speed: 1.05, phase: 0.4 },
      { id: "mouse1", kind: "mouse", x: 300, y: 542, w: 30, h: 16, range: 80, speed: 78, phase: 0 },
      { id: "mouse2", kind: "mouse", x: 2360, y: 542, w: 30, h: 16, range: 90, speed: 90, phase: 20 },
      { id: "moth1", kind: "moth", x: 1040, y: 250, w: 28, h: 16, range: 54, speed: 1.7, phase: 0.4 },
      { id: "web1", kind: "spider", x: 2140, y: 300, w: 22, h: 16, range: 110, speed: 0.85, phase: 1 },
    ],
    checkpoints: [{ id: "cp1", x: 1788, y: 560 }],
    curtains: [
      { id: "sun-curtain", x: 248, y: 200, w: 34, h: 360 },
      { id: "sash-curtain", x: 2460, y: 210, w: 34, h: 350 },
    ],
    pillows: [
      { id: "pil1", x: 900, y: 528, w: 58, h: 32 },
      { id: "pil2", x: 1788, y: 528, w: 54, h: 32 },
    ],
    drafts: [{ id: "gust1", x: 1380, y: 300, w: 200, h: 200, dir: 1, force: 1650 }],
    goal: { x: 2620, y: 400, w: 48, h: 160 },
    decor: [
      { kind: "window", x: 70, y: 70, w: 250, h: 190 },
      { kind: "window", x: 940, y: 48, w: 280, h: 200 },
      { kind: "window", x: 2140, y: 64, w: 250, h: 180 },
      { kind: "books", x: 200, y: 430, w: 180 },
      { kind: "books", x: 980, y: 400, w: 180 },
      { kind: "rug", x: 40, y: 548, w: 180 },
      { kind: "frame", x: 390, y: 300, w: 78, h: 92 },
      { kind: "frame", x: 1980, y: 340, w: 88, h: 78 },
      { kind: "plant", x: 120, y: 560 },
      { kind: "lamp", x: 690, y: 560 },
      { kind: "bowl", x: 1820, y: 560 },
    ],
  },
  {
    id: "books",
    name: "Bookshelf Climb",
    subtitle: "Up the stacks. Mind the mice.",
    hint: "Kick off the bookcase. The window draft shoves you. Stomp the vacuum.",
    width: 1040,
    height: 2300,
    spawn: { x: 80, y: 2080 },
    solids: [
      { x: 0, y: 2080, w: 1040, h: 220 },
      { x: 16, y: 1560, w: 26, h: 240 },
      { x: 560, y: 1520, w: 250, h: 26 },
      { x: 380, y: 320, w: 340, h: 28 },
    ],
    oneways: [
      { x: 140, y: 1940, w: 260, h: 16 },
      { x: 620, y: 1800, w: 280, h: 16 },
      { x: 120, y: 1660, w: 300, h: 16 },
      { x: 680, y: 1240, w: 250, h: 16 },
      { x: 170, y: 1100, w: 270, h: 16 },
      { x: 150, y: 800, w: 280, h: 16 },
      { x: 500, y: 660, w: 360, h: 16 },
      { x: 140, y: 500, w: 250, h: 16 },
      { x: 720, y: 300, w: 280, h: 16 },
    ],
    movers: [
      { id: "m2", x: 300, y: 1380, w: 170, h: 16, axis: "x", range: 150, speed: 1.2, phase: 0 },
      { id: "m3", x: 600, y: 960, w: 190, h: 16, axis: "y", range: 70, speed: 1.35, phase: 1 },
    ],
    pickups: [
      { id: "b1", x: 250, y: 1900, kind: "coin" },
      { id: "b2", x: 740, y: 1760, kind: "coin" },
      { id: "b3", x: 220, y: 1620, kind: "coin" },
      { id: "b4", x: 660, y: 1480, kind: "coin" },
      { id: "b5", x: 360, y: 1330, kind: "coin" },
      { id: "b6", x: 780, y: 1200, kind: "coin" },
      { id: "laser", x: 860, y: 1196, kind: "laser" },
      { id: "b7", x: 300, y: 1060, kind: "coin" },
      { id: "b8", x: 680, y: 900, kind: "coin" },
      { id: "b9", x: 250, y: 760, kind: "coin" },
      { id: "b10", x: 220, y: 458, kind: "coin" },
    ],
    hazards: [
      { id: "cactus2", kind: "cactus", x: 190, y: 1058, w: 36, h: 42 },
      { id: "vac", kind: "roomba", x: 620, y: 628, w: 46, h: 32, range: 110, speed: 0.9, phase: 0.2 },
      { id: "mouseb", kind: "mouse", x: 180, y: 1922, w: 30, h: 16, range: 70, speed: 72, phase: 0 },
      { id: "mothb", kind: "moth", x: 760, y: 240, w: 28, h: 16, range: 48, speed: 1.5, phase: 0.8 },
      { id: "webb", kind: "spider", x: 500, y: 1280, w: 22, h: 16, range: 120, speed: 0.7, phase: 0.3 },
    ],
    checkpoints: [{ id: "cp2", x: 180, y: 1660 }],
    curtains: [{ id: "book-curtain", x: 960, y: 220, w: 36, h: 1860 }],
    pillows: [{ id: "pilb", x: 230, y: 1072, w: 56, h: 28 }],
    drafts: [{ id: "gustb", x: 70, y: 820, w: 240, h: 200, dir: 1, force: 1500 }],
    goal: { x: 520, y: 170, w: 48, h: 150 },
    decor: [
      { kind: "window", x: 640, y: 80, w: 280, h: 180 },
      { kind: "window", x: 80, y: 900, w: 220, h: 160 },
      { kind: "window", x: 680, y: 1500, w: 240, h: 170 },
      { kind: "books", x: 140, y: 1940, w: 240 },
      { kind: "books", x: 620, y: 1800, w: 250 },
      { kind: "books", x: 500, y: 660, w: 300 },
      { kind: "rug", x: 60, y: 2068, w: 200 },
      { kind: "frame", x: 720, y: 1860, w: 80, h: 90 },
      { kind: "frame", x: 80, y: 1680, w: 70, h: 84 },
      { kind: "plant", x: 960, y: 2080 },
      { kind: "lamp", x: 360, y: 2080 },
      { kind: "bowl", x: 240, y: 500 },
    ],
  },
  {
    id: "window",
    name: "Open Window",
    subtitle: "Wind, moths, and the long way to the sash.",
    hint: "The sash blows hard — sprint into the wind, or ride it. C pounces.",
    width: 3600,
    height: 920,
    spawn: { x: 70, y: 700 },
    solids: [
      { x: 0, y: 700, w: 780, h: 220 },
      { x: 1040, y: 700, w: 620, h: 220 },
      { x: 1900, y: 700, w: 360, h: 220 },
      { x: 2620, y: 700, w: 980, h: 220 },
      { x: 3288, y: 460, w: 26, h: 240 },
    ],
    oneways: [
      { x: 280, y: 540, w: 170, h: 16 },
      { x: 540, y: 420, w: 150, h: 16 },
      { x: 1160, y: 520, w: 190, h: 16 },
      { x: 1420, y: 400, w: 140, h: 16 },
      { x: 3000, y: 480, w: 170, h: 16 },
      { x: 3160, y: 448, w: 120, h: 16 },
    ],
    movers: [
      { id: "m4", x: 835, y: 640, w: 150, h: 16, axis: "x", range: 165, speed: 1.05, phase: 0 },
      { id: "m5", x: 1665, y: 630, w: 150, h: 16, axis: "x", range: 140, speed: 1.2, phase: 1.2 },
      { id: "m6", x: 2350, y: 610, w: 170, h: 16, axis: "x", range: 220, speed: 1.25, phase: 0.6 },
    ],
    pickups: [
      { id: "w1", x: 200, y: 650, kind: "coin" },
      { id: "w2", x: 350, y: 500, kind: "coin" },
      { id: "w3", x: 610, y: 378, kind: "coin" },
      { id: "w4", x: 900, y: 590, kind: "coin" },
      { id: "w5", x: 1200, y: 650, kind: "coin" },
      { id: "food2", x: 1240, y: 478, kind: "food" },
      { id: "w6", x: 1480, y: 358, kind: "coin" },
      { id: "w7", x: 1500, y: 650, kind: "coin" },
      { id: "w8", x: 1760, y: 560, kind: "coin" },
      { id: "w9", x: 2060, y: 650, kind: "coin" },
      { id: "w10", x: 2420, y: 540, kind: "coin" },
      { id: "w11", x: 2780, y: 650, kind: "coin" },
      { id: "w12", x: 2960, y: 650, kind: "coin" },
      { id: "laser2", x: 3080, y: 438, kind: "laser" },
      { id: "w13", x: 3160, y: 430, kind: "coin" },
      { id: "w14", x: 3320, y: 650, kind: "coin" },
    ],
    hazards: [
      { id: "c3", kind: "cactus", x: 560, y: 658, w: 36, h: 42 },
      { id: "c4", kind: "cactus", x: 2860, y: 658, w: 36, h: 42 },
      { id: "vac2", kind: "roomba", x: 1280, y: 668, w: 48, h: 32, range: 120, speed: 0.85, phase: 0 },
      { id: "mousew", kind: "mouse", x: 360, y: 682, w: 30, h: 16, range: 70, speed: 84, phase: 10 },
      { id: "mousew2", kind: "mouse", x: 2100, y: 682, w: 30, h: 16, range: 80, speed: 76, phase: 40 },
      { id: "mothw", kind: "moth", x: 1500, y: 460, w: 28, h: 16, range: 60, speed: 1.8, phase: 0.2 },
      { id: "webw", kind: "spider", x: 2480, y: 420, w: 22, h: 16, range: 100, speed: 0.9, phase: 1.4 },
    ],
    checkpoints: [
      { id: "cp3", x: 1500, y: 700 },
      { id: "cp4", x: 2700, y: 700 },
    ],
    curtains: [
      { id: "hall-curtain", x: 300, y: 180, w: 32, h: 520 },
      { id: "sash", x: 3040, y: 240, w: 34, h: 460 },
    ],
    pillows: [{ id: "pilw", x: 1960, y: 668, w: 58, h: 32 }],
    drafts: [{ id: "gustw", x: 2480, y: 380, w: 460, h: 320, dir: -1, force: 2000 }],
    goal: { x: 3420, y: 530, w: 48, h: 170 },
    decor: [
      { kind: "window", x: 80, y: 60, w: 260, h: 200 },
      { kind: "window", x: 1180, y: 50, w: 300, h: 210 },
      { kind: "window", x: 2680, y: 40, w: 320, h: 220 },
      { kind: "books", x: 1160, y: 520, w: 180 },
      { kind: "rug", x: 40, y: 688, w: 200 },
      { kind: "rug", x: 3280, y: 688, w: 180 },
      { kind: "frame", x: 460, y: 470, w: 84, h: 100 },
      { kind: "frame", x: 2080, y: 490, w: 78, h: 88 },
      { kind: "plant", x: 140, y: 700 },
      { kind: "lamp", x: 1860, y: 700 },
      { kind: "bowl", x: 2720, y: 700 },
    ],
  },
  {
    id: "biscuit",
    name: "Dog in the Hall",
    subtitle: "Biscuit got in. You do not fight a dog.",
    hint: "He barks, then charges. When he hits a wall and sees stars, pounce the treat jar on that side. After two, he fakes.",
    width: 1120,
    height: 760,
    spawn: { x: 180, y: 560 },
    solids: [
      { x: 0, y: 560, w: 1120, h: 200 },
      { x: 0, y: 0, w: 36, h: 560 },
      { x: 1084, y: 0, w: 36, h: 560 },
    ],
    oneways: [
      { x: 70, y: 330, w: 250, h: 16 },
      { x: 800, y: 330, w: 250, h: 16 },
    ],
    movers: [],
    pickups: [
      { id: "d1", x: 140, y: 292, kind: "coin" },
      { id: "d2", x: 960, y: 292, kind: "coin" },
      { id: "d3", x: 540, y: 480, kind: "coin" },
    ],
    hazards: [],
    checkpoints: [],
    curtains: [
      { id: "left-drape", x: 64, y: 140, w: 32, h: 420 },
      { id: "right-drape", x: 1024, y: 140, w: 32, h: 420 },
    ],
    pillows: [{ id: "hall-pillow", x: 530, y: 528, w: 60, h: 32 }],
    drafts: [],
    boss: {
      kind: "biscuit",
      floor: 560,
      left: 48,
      right: 1072,
      jars: [
        { id: "jar-l", x: 170, y: 292, side: "left" },
        { id: "jar-r", x: 900, y: 292, side: "right" },
      ],
    },
    goal: { x: 1008, y: 400, w: 40, h: 160 },
    decor: [
      { kind: "window", x: 430, y: 48, w: 260, h: 170 },
      { kind: "rug", x: 360, y: 548, w: 400 },
      { kind: "frame", x: 300, y: 250, w: 78, h: 70 },
      { kind: "frame", x: 720, y: 250, w: 78, h: 70 },
      { kind: "plant", x: 80, y: 560 },
      { kind: "lamp", x: 1040, y: 560 },
    ],
  },
];
