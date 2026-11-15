import { LEVELS, type BossDef, type Hazard, type LevelDef, type Mover, type Rect } from "@/game/levels";

export const VIEW_W = 960;
export const VIEW_H = 540;

const BASE_W = 34;
const BASE_H = 26;
const BIG = 1.2;
const GRAV_RISE = 2300;
const GRAV_FALL = 4600;
const GRAV_APEX = 1300;
const JUMP = -980;
const JUMP_BIG = -1180;
const DOUBLE = -820;
const DOUBLE_BIG = -990;
const RUN = 248;
const RUN_BIG = 328;
const SPRINT = 390;
const SPRINT_BIG = 500;
const ACCEL_G = 2400;
const ACCEL_A = 1500;
const FRICTION = 2600;
const COYOTE = 0.11;
const BUFFER = 0.13;
const TERM = 980;

export type Phase = "attract" | "play" | "dead" | "cleared";

export type BossRuntime = {
  x: number;
  y: number;
  w: number;
  h: number;
  facing: 1 | -1;
  mode: "pace" | "windup" | "charge" | "dizzy" | "snack" | "gone";
  timer: number;
  hits: number;
  feint: boolean;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  groundKind: "solid" | "oneway" | null;
  riding: string | null;
  jumpsLeft: number;
  coyote: number;
  big: boolean;
  poof: number;
  iframe: number;
  bounceLock: number;
  dropLock: number;
  anim: number;
  jumpAge: number;
  climbing: string | null;
  cling: -1 | 0 | 1;
  fidget: "none" | "stretch" | "roll" | "tail";
  fidgetT: number;
  idleT: number;
  squashX: number;
  squashY: number;
};

export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  up: boolean;
  run: boolean;
  leap: boolean;
  pounce: boolean;
};

export const EMPTY_INPUT: InputState = {
  left: false,
  right: false,
  jump: false,
  down: false,
  up: false,
  run: false,
  leap: false,
  pounce: false,
};

export type Snapshot = {
  levelIndex: number;
  levelName: string;
  subtitle: string;
  hint: string;
  coins: number;
  total: number;
  phase: Phase;
  big: boolean;
  poof: number;
  banner: string;
  bannerT: number;
  sprinting: boolean;
  climbing: boolean;
  clinging: boolean;
  pounceReady: boolean;
  bossHits: number;
  bossMax: number;
};

const emptySnap = (): Snapshot => ({
  levelIndex: 0,
  levelName: "",
  subtitle: "",
  hint: "",
  coins: 0,
  total: 0,
  phase: "attract",
  big: false,
  poof: 0,
  banner: "",
  bannerT: 0,
  sprinting: false,
  climbing: false,
  clinging: false,
  pounceReady: true,
  bossHits: 0,
  bossMax: 0,
});

function overlaps(a: Rect, b: Rect, insetX = 0, insetY = 0) {
  return (
    a.x + insetX < b.x + b.w &&
    a.x + a.w - insetX > b.x &&
    a.y + insetY < b.y + b.h &&
    a.y + a.h - insetY > b.y
  );
}

export function moverAt(m: Mover, time: number): Rect {
  const o = Math.sin(time * m.speed + m.phase) * m.range;
  if (m.axis === "x") return { x: m.x + o, y: m.y, w: m.w, h: m.h };
  return { x: m.x, y: m.y + o, w: m.w, h: m.h };
}

export type HazardPose = { rect: Rect; flip: boolean; anchorY: number };

export function hazardPose(h: Hazard, time: number, stunned = false): HazardPose {
  if (stunned || h.kind === "cactus") return { rect: h, flip: false, anchorY: h.y };
  if (h.kind === "roomba") {
    const x = h.x + Math.sin(time * (h.speed ?? 1) + (h.phase ?? 0)) * (h.range ?? 0);
    const flip = Math.cos(time * (h.speed ?? 1) + (h.phase ?? 0)) < 0;
    return { rect: { x, y: h.y, w: h.w, h: h.h }, flip, anchorY: h.y };
  }
  if (h.kind === "mouse") {
    const speed = h.speed ?? 76;
    const range = Math.max(8, h.range ?? 80);
    const span = range * 2;
    const dist = ((time * speed + (h.phase ?? 0)) % span + span) % span;
    const goingRight = dist < range;
    const x = h.x + (goingRight ? dist : span - dist);
    return { rect: { x, y: h.y, w: h.w, h: h.h }, flip: !goingRight, anchorY: h.y };
  }
  if (h.kind === "moth") {
    const wobble = time * (h.speed ?? 1.6) + (h.phase ?? 0);
    const x = h.x + Math.sin(wobble) * (h.range ?? 48);
    const y = h.y + Math.sin(wobble * 2.1) * 16;
    return { rect: { x, y, w: h.w, h: h.h }, flip: Math.cos(wobble) < 0, anchorY: h.y };
  }
  const drop = (Math.sin(time * (h.speed ?? 0.8) + (h.phase ?? 0)) * 0.5 + 0.5) * (h.range ?? 90);
  return { rect: { x: h.x, y: h.y + drop, w: h.w, h: h.h }, flip: false, anchorY: h.y };
}

export function hazardAt(h: Hazard, time: number, stunned = false): Rect {
  return hazardPose(h, time, stunned).rect;
}

export class Game {
  level: LevelDef = LEVELS[0]!;
  index = 0;
  player: Player = this.makePlayer();
  phase: Phase = "attract";
  time = 0;
  camX = 0;
  camY = 0;
  shake = 0;
  shakeX = 0;
  shakeY = 0;
  particles: Particle[] = [];
  got = new Set<string>();
  spawn = { x: 64, y: 560 };
  checkpointId: string | null = null;
  banner = "";
  bannerT = 0;
  events: string[] = [];
  deadT = 0;
  sprinting = false;
  private acc = 0;
  private buffer = 0;
  private jumpHeld = false;
  private cutDone = false;
  private prevMovers = new Map<string, Rect>();
  private reduce: boolean;
  private stepDist = 0;
  private clawDist = 0;
  private fidgetN = 0;
  private clingLock = 0;
  private pounceT = 0;
  private pounceCd = 0;
  private pounceHeld = false;
  private pounceStrike = 0;
  boss: BossRuntime | null = null;
  private jarLock = false;
  private stun = new Map<string, number>();
  private dead = new Set<string>();
  pounceTrail: { x: number; y: number; facing: 1 | -1; big: boolean; poof: number; life: number }[] = [];

  get isPouncing() {
    return this.pounceT > 0;
  }

  constructor() {
    this.reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.load(0, "attract");
  }

  load(index: number, phase: Phase) {
    this.index = index;
    this.level = LEVELS[index] ?? LEVELS[0]!;
    this.phase = phase;
    this.got = new Set();
    this.particles = [];
    this.events = [];
    this.banner = "";
    this.bannerT = 0;
    this.deadT = 0;
    this.buffer = 0;
    this.jumpHeld = false;
    this.cutDone = false;
    this.checkpointId = null;
    this.spawn = { ...this.level.spawn };
    this.stun.clear();
    this.dead.clear();
    this.pounceT = 0;
    this.pounceCd = 0;
    this.pounceHeld = false;
    this.pounceStrike = 0;
    this.clingLock = 0;
    this.pounceTrail = [];
    this.player = this.makePlayer();
    this.place();
    this.initBoss();
    this.prevMovers = new Map();
    this.snapCamera(true);
    this.time = 0;
    this.acc = 0;
  }

  respawn() {
    this.phase = "play";
    this.deadT = 0;
    this.pounceTrail = [];
    this.place();
    this.player.iframe = 1.2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.snapCamera(false);
  }

  snapshot(): Snapshot {
    let coins = 0;
    let total = 0;
    for (const p of this.level.pickups) {
      if (p.kind !== "coin") continue;
      total += 1;
      if (this.got.has(p.id)) coins += 1;
    }
    return {
      levelIndex: this.index,
      levelName: this.level.name,
      subtitle: this.level.subtitle,
      hint: this.level.hint,
      coins,
      total,
      phase: this.phase,
      big: this.player.big,
      poof: this.player.poof,
      banner: this.banner,
      bannerT: this.bannerT,
      sprinting: this.sprinting,
      climbing: !!this.player.climbing,
      clinging: this.player.cling !== 0,
      pounceReady: this.pounceCd <= 0,
      bossHits: this.boss?.hits ?? 0,
      bossMax: this.level.boss ? 3 : 0,
    };
  }

  frame(dt: number, input: InputState, active: boolean): Snapshot {
    dt = Math.min(0.05, Math.max(0, dt));
    if (!active) {
      this.relaxShake(dt);
      return this.snapshot();
    }
    if (this.phase === "attract") {
      this.time += dt;
      this.player.anim += dt;
      this.updateFidget(dt, EMPTY_INPUT);
      this.updateParticles(dt);
      this.decayBanner(dt);
      this.relaxShake(dt);
      this.followCamera(dt);
      return this.snapshot();
    }
    const curtain = this.curtainHere();
    const grab = !!curtain && input.up && !this.player.climbing;
    const jumpEdge = input.jump && !this.jumpHeld;
    if (jumpEdge && !grab && !(this.player.climbing && input.up && !input.leap)) this.buffer = BUFFER;
    this.jumpHeld = input.jump;
    this.acc += dt;
    const step = 1 / 60;
    let n = 0;
    while (this.acc >= step && n < 5) {
      this.step(step, input);
      this.acc -= step;
      n += 1;
    }
    if (n === 5) this.acc = 0;
    this.sprinting =
      input.run && (input.left || input.right) && !this.player.climbing && this.phase === "play";
    this.relaxShake(dt);
    this.followCamera(dt);
    return this.snapshot();
  }

  private makePlayer(): Player {
    return {
      x: 0,
      y: 0,
      w: BASE_W,
      h: BASE_H,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      groundKind: "solid",
      riding: null,
      jumpsLeft: 1,
      coyote: COYOTE,
      big: false,
      poof: 0,
      iframe: 0,
      bounceLock: 0,
      dropLock: 0,
      anim: 0,
      jumpAge: 0,
      climbing: null,
      cling: 0,
      fidget: "none",
      fidgetT: 0,
      idleT: 0,
      squashX: 1,
      squashY: 1,
    };
  }

  private applySize() {
    const p = this.player;
    const s = p.big ? BIG : 1;
    const feet = p.y + p.h;
    p.w = BASE_W * s;
    p.h = BASE_H * s;
    p.y = feet - p.h;
  }

  private place() {
    this.applySize();
    const p = this.player;
    p.x = this.spawn.x;
    p.y = this.spawn.y - p.h;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.groundKind = "solid";
    p.riding = null;
    p.jumpsLeft = 1;
    p.coyote = COYOTE;
    p.jumpAge = 0;
    p.climbing = null;
    p.cling = 0;
    p.fidget = "none";
    p.fidgetT = 0;
    p.idleT = 0;
    p.squashX = 1;
    p.squashY = 1;
  }

  private step(dt: number, input: InputState) {
    const p = this.player;
    this.time += dt;
    this.updateParticles(dt);
    this.decayBanner(dt);

    if (this.phase === "dead" || this.phase === "cleared") return;

    if (p.poof > 0) p.poof = Math.max(0, p.poof - dt);
    if (p.iframe > 0) p.iframe = Math.max(0, p.iframe - dt);
    if (p.bounceLock > 0) p.bounceLock = Math.max(0, p.bounceLock - dt);
    if (p.dropLock > 0) p.dropLock = Math.max(0, p.dropLock - dt);
    if (this.clingLock > 0) this.clingLock = Math.max(0, this.clingLock - dt);
    if (this.pounceT > 0) {
      this.pounceT = Math.max(0, this.pounceT - dt);
      if (!this.reduce) {
        this.pounceTrail.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          big: p.big,
          poof: p.poof,
          life: 0.16,
        });
      }
    }
    for (const t of this.pounceTrail) t.life -= dt;
    this.pounceTrail = this.pounceTrail.filter((t) => t.life > 0);
    if (this.pounceCd > 0) this.pounceCd = Math.max(0, this.pounceCd - dt);
    if (this.pounceStrike > 0) this.pounceStrike = Math.max(0, this.pounceStrike - dt);
    if (this.reduce) {
      p.squashX = 1;
      p.squashY = 1;
    } else {
      const sk = 1 - Math.exp(-16 * dt);
      p.squashX += (1 - p.squashX) * sk;
      p.squashY += (1 - p.squashY) * sk;
    }
    for (const [id, left] of this.stun) {
      if (left <= dt) this.stun.delete(id);
      else this.stun.set(id, left - dt);
    }
    if (!p.grounded) p.coyote = Math.max(0, p.coyote - dt);
    this.buffer = Math.max(0, this.buffer - dt);
    if (!p.grounded) p.jumpAge += dt;
    else p.jumpAge = 0;

    const movers = this.level.movers.map((m) => ({ id: m.id, rect: moverAt(m, this.time) }));
    this.updateFidget(dt, input);

    if (!p.climbing && input.up) {
      const c = this.curtainHere();
      if (c) {
        p.climbing = c.id;
        p.cling = 0;
        p.vx = 0;
        p.vy = 0;
        p.grounded = false;
        p.groundKind = null;
        p.riding = null;
        p.fidget = "none";
        this.buffer = 0;
        this.events.push("grab");
        this.banner = "Claws in the curtain.";
        this.bannerT = 1.2;
      }
    }

    if (p.climbing) {
      const still = this.climbMove(dt, input);
      this.prevMovers = new Map(movers.map((m) => [m.id, m.rect]));
      if (still) {
        if (p.y > this.level.height) this.die("You slipped.");
        else {
          this.updateBoss(dt);
          this.touchHazards();
          this.touchPickups();
          this.touchCheckpoints();
          this.touchGoal();
        }
        return;
      }
    }

    if (p.riding && !p.climbing) {
      const prev = this.prevMovers.get(p.riding);
      const now = movers.find((m) => m.id === p.riding)?.rect;
      if (prev && now) {
        p.x += now.x - prev.x;
        p.y += now.y - prev.y;
      }
    }

    let dir = 0;
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
    if (dir < 0) p.facing = -1;
    else if (dir > 0) p.facing = 1;

    const pounceEdge = input.pounce && !this.pounceHeld;
    this.pounceHeld = input.pounce;
    if (pounceEdge && this.pounceCd <= 0 && !p.climbing) {
      const face: 1 | -1 = dir < 0 ? -1 : dir > 0 ? 1 : p.facing;
      p.facing = face;
      p.vx = face * (p.big ? 620 : 520);
      p.vy = p.grounded ? -240 : Math.min(p.vy, -30);
      p.grounded = false;
      p.groundKind = null;
      p.riding = null;
      p.cling = 0;
      p.fidget = "none";
      p.squashX = 1.24;
      p.squashY = 0.82;
      this.pounceT = 0.16;
      this.pounceStrike = 0.28;
      this.pounceCd = 0.82;
      this.clingLock = 0.12;
      this.buffer = 0;
      this.events.push("pounce");
      this.puff(p.x + p.w / 2, p.y + p.h * 0.4, "#d7c4a8", 6);
    }

    const sprint = input.run;
    const max = sprint ? (p.big ? SPRINT_BIG : SPRINT) : p.big ? RUN_BIG : RUN;
    const lunging = this.pounceT > 0;
    if (!lunging) {
      const accel = (p.grounded ? ACCEL_G : ACCEL_A) * (sprint ? 1.35 : 1);
      if (dir !== 0) p.vx += dir * accel * dt;
      else {
        const f = FRICTION * dt;
        if (Math.abs(p.vx) <= f) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * f;
      }
      p.vx = Math.max(-max, Math.min(max, p.vx));
    }
    for (const gust of this.level.drafts) {
      if (!overlaps(p, gust, 0, 4)) continue;
      p.vx += gust.dir * gust.force * dt;
    }
    const windCap = max + 180;
    p.vx = Math.max(-windCap, Math.min(windCap, p.vx));

    if (Math.abs(p.vx) > 28 && p.grounded && !lunging) {
      this.stepDist += Math.abs(p.vx) * dt;
      const stride = sprint ? 18 : 26;
      while (this.stepDist >= stride) {
        this.stepDist -= stride;
        p.anim += 1;
        this.events.push(sprint ? "scuttle-fast" : "scuttle");
        if (!this.reduce) this.puff(p.x + p.w / 2, p.y + p.h, "#c8b59a", sprint ? 2 : 1);
      }
    }

    const side = !lunging && this.clingLock <= 0 && !p.grounded ? this.wallSide(input) : 0;
    p.cling = side;
    if (side !== 0) {
      p.vx = 0;
      const slide = p.poof > 0 ? 48 : 96;
      if (p.vy > slide) p.vy = slide;
      p.x += side * 0.6;
      this.resolveX();
      if (this.buffer > 0) {
        p.vx = -side * (p.big ? 360 : 300);
        p.vy = (p.big ? JUMP_BIG : JUMP) * 0.92;
        p.grounded = false;
        p.groundKind = null;
        p.riding = null;
        p.jumpsLeft = 1;
        p.coyote = 0;
        p.cling = 0;
        p.squashX = 0.84;
        p.squashY = 1.18;
        this.buffer = 0;
        this.cutDone = false;
        this.clingLock = 0.14;
        p.jumpAge = 0;
        this.events.push("wall");
        this.puff(p.x + p.w / 2, p.y + p.h * 0.5, "#efe6d6", 6);
      }
    } else if (!p.grounded) {
      const apex = Math.abs(p.vy) < 110;
      let g = p.vy < 0 ? GRAV_RISE : GRAV_FALL;
      if (apex) g = GRAV_APEX;
      if (lunging) g = 900;
      if (p.poof > 0 && input.jump && p.vy > 0) g = 320;
      p.vy = Math.min(TERM, p.vy + g * dt);
      if (p.poof > 0 && input.jump && p.vy > 78) p.vy = 78;
    } else {
      p.vy = 0;
    }

    if (side === 0 && this.buffer > 0 && (p.grounded || p.coyote > 0)) {
      const hop = p.big ? JUMP_BIG : JUMP;
      p.vy = sprint && Math.abs(p.vx) > RUN * 0.9 ? hop * 1.06 : hop;
      p.grounded = false;
      p.groundKind = null;
      p.riding = null;
      p.coyote = 0;
      p.jumpsLeft = 1;
      p.squashX = 0.84;
      p.squashY = 1.18;
      this.buffer = 0;
      this.cutDone = false;
      p.jumpAge = 0;
      this.events.push("jump");
      this.puff(p.x + p.w / 2, p.y + p.h, "#d7dbe2", 5);
    } else if (side === 0 && this.buffer > 0 && p.jumpsLeft > 0 && !p.grounded) {
      p.vy = p.big ? DOUBLE_BIG : DOUBLE;
      p.jumpsLeft = 0;
      p.squashX = 0.84;
      p.squashY = 1.18;
      this.buffer = 0;
      this.cutDone = false;
      this.events.push("double");
      this.puff(p.x + p.w / 2, p.y + p.h, "#e7eaf0", 7);
    }

    if (!input.jump && p.vy < 0 && !this.cutDone) {
      p.vy *= 0.52;
      this.cutDone = true;
    }
    if (input.jump || p.grounded) this.cutDone = false;

    if (input.down && p.grounded && p.groundKind === "oneway") {
      p.dropLock = 0.2;
      p.grounded = false;
      p.groundKind = null;
      p.riding = null;
      p.vy = 90;
    }

    this.moveX(dt);
    const landed = this.moveY(dt);
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
    if (p.x + p.w > this.level.width) {
      p.x = this.level.width - p.w;
      p.vx = 0;
    }

    if (landed.kind) {
      const wasHigh = landed.impact > 520;
      const wasAirborne = !p.grounded && landed.impact > 120;
      p.grounded = true;
      p.groundKind = landed.kind;
      p.riding = landed.ride;
      p.coyote = COYOTE;
      p.jumpsLeft = 1;
      if (wasAirborne) {
        const s = Math.min(0.24, landed.impact / 3200);
        p.squashX = 1 + s;
        p.squashY = 1 - s * 0.75;
      }
      if (wasHigh) this.puff(p.x + p.w / 2, p.y + p.h, "#c8b59a", 4);
    } else {
      p.grounded = false;
      p.groundKind = null;
      p.riding = null;
    }

    this.prevMovers = new Map(movers.map((m) => [m.id, m.rect]));

    if (p.y > this.level.height) {
      this.die("You slipped.");
      return;
    }
    this.updateBoss(dt);
    this.touchHazards();
    this.touchPickups();
    this.touchCheckpoints();
    this.touchGoal();
  }

  private initBoss() {
    const def = this.level.boss;
    this.jarLock = false;
    if (!def) {
      this.boss = null;
      return;
    }
    this.boss = {
      x: 280,
      y: def.floor - 74,
      w: 96,
      h: 74,
      facing: 1,
      mode: "pace",
      timer: 2.2,
      hits: 0,
      feint: false,
    };
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    const def = this.level.boss;
    if (!b || !def || this.phase !== "play") return;
    b.y = def.floor - b.h;
    if (b.mode === "gone") {
      b.facing = 1;
      b.x += 120 * dt;
      return;
    }
    b.timer -= dt;

    if (b.mode === "pace") {
      b.x += b.facing * (56 + b.hits * 18) * dt;
      if (b.x < def.left + 180) b.facing = 1;
      if (b.x + b.w > def.right - 180) b.facing = -1;
      if (b.timer <= 0) this.windup(b, b.hits >= 2);
    } else if (b.mode === "windup") {
      if (b.timer <= 0) {
        if (b.feint) b.facing = b.facing === 1 ? -1 : 1;
        b.mode = "charge";
        b.timer = 2.4;
        this.events.push("bark");
      }
    } else if (b.mode === "charge") {
      const speed = 440 + b.hits * 80;
      b.x += b.facing * speed * dt;
      const hitLeft = b.x <= def.left;
      const hitRight = b.x + b.w >= def.right;
      if (hitLeft || hitRight) {
        b.x = hitLeft ? def.left : def.right - b.w;
        b.facing = hitLeft ? 1 : -1;
        b.mode = "dizzy";
        b.timer = Math.max(1.25, 2.1 - b.hits * 0.22);
        this.jarLock = false;
        this.events.push("thud");
        this.shake = this.reduce ? 0 : 5;
        this.banner = hitLeft ? "Stars. Pounce the left jar." : "Stars. Pounce the right jar.";
        this.bannerT = 1.3;
      }
    } else if (b.mode === "dizzy") {
      const side = b.x < this.level.width / 2 ? "left" : "right";
      if (this.tryJar(def, side)) {
        b.hits += 1;
        this.events.push("clink");
        this.shake = this.reduce ? 0 : 3;
        if (b.hits >= 3) {
          b.mode = "gone";
          this.banner = "He had enough. The dog door's open.";
          this.bannerT = 1.8;
        } else {
          b.mode = "snack";
          b.timer = 0.75;
          this.banner = b.hits === 1 ? "One treat down." : "Two. Next charge, he fakes.";
          this.bannerT = 1.4;
        }
      } else if (b.timer <= 0) {
        this.banner = "Too slow. He's up.";
        this.bannerT = 0.9;
        this.windup(b, false);
      }
    } else if (b.mode === "snack" && b.timer <= 0) {
      b.mode = "pace";
      b.timer = 1.5;
      b.facing = b.facing === 1 ? -1 : 1;
    }

    if (b.mode === "dizzy" || b.mode === "snack" || b.mode === "gone") return;
    const body = { x: b.x + 10, y: b.y + 16, w: b.w - 18, h: b.h - 16 };
    if (overlaps(this.player, body, 2, 2)) this.smack(b.x + b.w / 2);
  }

  private windup(b: BossRuntime, feint: boolean) {
    b.mode = "windup";
    b.timer = feint ? 0.85 : 0.7;
    b.feint = feint;
    this.events.push("bark");
    this.banner = feint ? "He fakes — watch which way." : "Bark. He's going to run.";
    this.bannerT = 0.8;
  }

  private tryJar(def: BossDef, side: "left" | "right") {
    if (this.jarLock) return false;
    const jar = def.jars.find((item) => item.side === side);
    if (!jar) return false;
    const box = { x: jar.x - 28, y: jar.y - 30, w: 76, h: 64 };
    const p = this.player;
    if (!overlaps(p, box)) return false;
    const dropping = p.vy > 80 && p.y + p.h < jar.y + 24;
    if (this.pounceT <= 0 && !dropping) return false;
    this.jarLock = true;
    this.puff(jar.x, jar.y, "#e2a322", 10);
    return true;
  }

  private smack(fromX: number) {
    const p = this.player;
    if (this.phase !== "play" || p.iframe > 0) return;
    const sign = p.x + p.w / 2 < fromX ? -1 : 1;
    if (p.poof > 0 && p.bounceLock <= 0) {
      p.climbing = null;
      p.vy = -640;
      p.vx = sign * 140;
      p.grounded = false;
      p.bounceLock = 0.32;
      this.events.push("bounce");
      this.shake = this.reduce ? 0 : 3;
      return;
    }
    if (p.big) {
      p.big = false;
      p.climbing = null;
      this.applySize();
      p.iframe = 1.15;
      p.vy = -420;
      p.vx = sign * 180;
      p.grounded = false;
      this.events.push("hurt");
      this.banner = "Back to snack size.";
      this.bannerT = 1.4;
      this.shake = this.reduce ? 0 : 6;
      return;
    }
    this.die("Too much dog.");
  }

  private curtainHere() {
    const p = this.player;
    for (const c of this.level.curtains) {
      const zone = { x: c.x - 10, y: c.y, w: c.w + 20, h: c.h };
      if (overlaps(p, zone, 0, 2)) return c;
    }
    return null;
  }

  private climbMove(dt: number, input: InputState) {
    const p = this.player;
    const c = this.level.curtains.find((item) => item.id === p.climbing);
    if (!c || !this.curtainHere()) {
      p.climbing = null;
      p.grounded = false;
      return false;
    }
    let dir = 0;
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
    if (dir < 0) p.facing = -1;
    else if (dir > 0) p.facing = 1;

    if (this.buffer > 0 && (!input.up || input.leap)) {
      p.climbing = null;
      const leap = (p.big ? JUMP_BIG : JUMP) * (input.run ? 0.96 : 0.88);
      p.vy = leap;
      p.vx = (dir !== 0 ? dir : p.facing) * (input.run ? 230 : 150);
      p.grounded = false;
      p.groundKind = null;
      p.riding = null;
      p.jumpsLeft = 1;
      p.coyote = 0;
      this.buffer = 0;
      this.cutDone = false;
      p.jumpAge = 0;
      this.events.push("jump");
      return false;
    }

    const speed = (p.big ? 186 : 164) * (input.run ? 1.28 : 1);
    if (input.up && !input.down) p.vy = -speed;
    else if (input.down && !input.up) p.vy = speed;
    else p.vy = 0;
    p.vx = 0;
    p.y += p.vy * dt;
    const mid = c.x + (c.w - p.w) / 2;
    const target = mid + dir * 8;
    p.x += (target - p.x) * Math.min(1, dt * 12);
    p.anim += dt * (Math.abs(p.vy) > 20 ? 9 : 2);

    if (Math.abs(p.vy) > 20) {
      this.clawDist += Math.abs(p.vy) * dt;
      if (this.clawDist > 30) {
        this.clawDist = 0;
        this.events.push("scratch");
      }
    }

    if (p.y < c.y - 4) {
      p.y = c.y - p.h - 1;
      p.climbing = null;
      p.vy = -280;
      p.vx = dir * 100;
      p.grounded = false;
      this.events.push("mrrp");
      return false;
    }
    if (p.y > c.y + c.h - p.h) {
      p.y = c.y + c.h - p.h;
      p.climbing = null;
      p.vy = 80;
      p.grounded = false;
      return false;
    }
    p.grounded = false;
    p.groundKind = null;
    p.riding = null;
    p.coyote = 0;
    return true;
  }

  private updateFidget(dt: number, input: InputState) {
    const p = this.player;
    const acted =
      input.left ||
      input.right ||
      input.jump ||
      input.down ||
      input.pounce ||
      !!p.climbing ||
      !p.grounded ||
      (this.phase !== "play" && this.phase !== "attract");
    if (p.fidget !== "none") {
      if (acted) {
        p.fidget = "none";
        p.fidgetT = 0;
        p.idleT = 0;
      } else {
        p.fidgetT += dt;
        const dur = p.fidget === "roll" ? 3.4 : p.fidget === "tail" ? 2.8 : 3.2;
        if (p.fidgetT >= dur) {
          p.fidget = "none";
          p.fidgetT = 0;
          p.idleT = 0.4;
        }
      }
      return;
    }
    if (acted || Math.abs(p.vx) > 16) {
      p.idleT = 0;
      return;
    }
    p.idleT += dt;
    if (p.idleT < 3.2) return;
    const kinds = ["stretch", "tail", "roll"] as const;
    let kind = kinds[this.fidgetN % 3] ?? "stretch";
    this.fidgetN = (this.fidgetN + 1) % 3;
    if (this.reduce && kind === "roll") kind = "stretch";
    p.fidget = kind;
    p.fidgetT = 0;
    p.idleT = 0;
    if (this.phase === "play") {
      this.events.push(kind === "stretch" ? "purr" : kind === "roll" ? "meow" : "mrrp");
    }
  }

  private moveX(dt: number) {
    const p = this.player;
    let dist = p.vx * dt;
    while (Math.abs(dist) > 0.01) {
      const d = Math.max(-8, Math.min(8, dist));
      p.x += d;
      dist -= d;
      if (this.resolveX()) break;
    }
  }

  private resolveX() {
    const p = this.player;
    let hit = false;
    for (const s of this.level.solids) {
      if (!overlaps(p, s, 0, 5)) continue;
      if (p.vx > 0) p.x = s.x - p.w;
      else if (p.vx < 0) p.x = s.x + s.w;
      else {
        const penL = p.x + p.w - s.x;
        const penR = s.x + s.w - p.x;
        p.x = penL < penR ? s.x - p.w : s.x + s.w;
      }
      p.vx = 0;
      hit = true;
    }
    return hit;
  }

  private moveY(dt: number): { kind: "solid" | "oneway" | null; ride: string | null; impact: number } {
    const p = this.player;
    const impact = p.vy;
    if (Math.abs(p.vy) < 1 && p.grounded) {
      const prevBottom = p.y + p.h;
      p.y += 1;
      const solid = this.resolveSolidY(prevBottom);
      if (solid === "land") return { kind: "solid", ride: null, impact: 0 };
      const one = this.resolveOneWay(prevBottom);
      if (one) return { kind: "oneway", ride: one.id, impact: 0 };
      p.y -= 1;
    }
    let dist = p.vy * dt;
    let kind: "solid" | "oneway" | null = null;
    let ride: string | null = null;
    while (Math.abs(dist) > 0.01) {
      const d = Math.max(-6, Math.min(6, dist));
      const prevBottom = p.y + p.h;
      p.y += d;
      dist -= d;
      if (this.tryPillow(prevBottom)) break;
      const solid = this.resolveSolidY(prevBottom);
      if (solid === "land") {
        kind = "solid";
        ride = null;
        break;
      }
      if (solid === "ceil") break;
      const one = this.resolveOneWay(prevBottom);
      if (one) {
        kind = "oneway";
        ride = one.id;
        break;
      }
    }
    return { kind, ride, impact };
  }

  private resolveSolidY(prevBottom: number): "land" | "ceil" | null {
    const p = this.player;
    for (const s of this.level.solids) {
      if (!overlaps(p, s, 2, 0)) continue;
      if (p.vy >= 0) {
        if (prevBottom > s.y + 12) {
          const penL = p.x + p.w - s.x;
          const penR = s.x + s.w - p.x;
          p.x = penL < penR ? s.x - p.w : s.x + s.w;
          p.vx = 0;
          continue;
        }
        p.y = s.y - p.h;
        p.vy = 0;
        return "land";
      }
      p.y = s.y + s.h;
      p.vy = 0;
      return "ceil";
    }
    return null;
  }

  private resolveOneWay(prevBottom: number): { id: string | null } | null {
    const p = this.player;
    if (p.dropLock > 0 || p.vy < 0) return null;
    const plats: { id: string | null; rect: Rect }[] = [
      ...this.level.oneways.map((r) => ({ id: null as string | null, rect: r })),
      ...this.level.movers.map((m) => ({ id: m.id as string | null, rect: moverAt(m, this.time) })),
    ];
    for (const plat of plats) {
      const r = plat.rect;
      if (prevBottom > r.y + 8) continue;
      if (p.y + p.h < r.y) continue;
      if (!overlaps(p, { x: r.x, y: r.y, w: r.w, h: Math.max(r.h, 8) }, 2, 0)) continue;
      p.y = r.y - p.h;
      p.vy = 0;
      return { id: plat.id };
    }
    return null;
  }

  private wallSide(input: InputState): -1 | 0 | 1 {
    const p = this.player;
    const hit = (box: Rect) => {
      for (const s of this.level.solids) {
        if (s.h < 48) continue;
        if (s.y > p.y + p.h * 0.55) continue;
        if (overlaps(box, s, 0, 4)) return true;
      }
      return false;
    };
    if (input.left && hit({ x: p.x - 3, y: p.y, w: p.w, h: p.h })) return -1;
    if (input.right && hit({ x: p.x + 3, y: p.y, w: p.w, h: p.h })) return 1;
    return 0;
  }

  private tryPillow(prevBottom: number) {
    const p = this.player;
    if (p.vy < 50) return false;
    for (const pil of this.level.pillows) {
      if (prevBottom > pil.y + 8) continue;
      if (p.y + p.h < pil.y) continue;
      if (p.x + p.w < pil.x + 6 || p.x > pil.x + pil.w - 6) continue;
      p.y = pil.y - p.h;
      p.vy = p.big ? -1420 : -1240;
      p.grounded = false;
      p.groundKind = null;
      p.riding = null;
      p.jumpsLeft = 1;
      p.coyote = 0;
      this.events.push("bounce");
      this.puff(p.x + p.w / 2, pil.y, "#eadcc8", 8);
      this.shake = this.reduce ? 0 : 2;
      return true;
    }
    return false;
  }

  isStunned(id: string) {
    return (this.stun.get(id) ?? 0) > 0;
  }

  isDead(id: string) {
    return this.dead.has(id);
  }

  private touchHazards() {
    const p = this.player;
    if (this.phase !== "play") return;
    for (const h of this.level.hazards) {
      if (this.dead.has(h.id)) continue;
      const stunned = this.isStunned(h.id);
      const r = hazardAt(h, this.time, stunned);
      if (!overlaps(p, r, 4, 2)) continue;
      const prey = h.kind === "mouse" || h.kind === "moth" || h.kind === "spider";
      const fromAbove = p.vy > 70 && p.y + p.h * 0.4 < r.y + r.h * 0.55;
      const lunging = this.pounceStrike > 0;
      if (!stunned && (prey || h.kind === "roomba") && (fromAbove || lunging)) {
        if (prey) this.dead.add(h.id);
        else this.stun.set(h.id, 2.4);
        p.vy = fromAbove ? -720 : -280;
        p.grounded = false;
        p.groundKind = null;
        p.riding = null;
        p.jumpsLeft = 1;
        p.bounceLock = 0.28;
        p.climbing = null;
        this.events.push(h.kind === "mouse" ? "mrrp" : "bounce");
        this.banner =
          h.kind === "roomba"
            ? "Pounced the vacuum."
            : h.kind === "mouse"
              ? "Got the mouse."
              : h.kind === "moth"
                ? "Caught the moth."
                : "Spider down.";
        this.bannerT = 1.1;
        this.puff(r.x + r.w / 2, r.y, "#c5d0d4", 8);
        continue;
      }
      if (stunned) continue;
      if (p.poof > 0) {
        if (p.bounceLock <= 0) {
          p.climbing = null;
          p.vy = -640;
          p.vx += (p.x + p.w / 2 < r.x + r.w / 2 ? -1 : 1) * 90;
          p.grounded = false;
          p.bounceLock = 0.32;
          this.events.push("bounce");
          this.shake = this.reduce ? 0 : 3;
          this.puff(p.x + p.w / 2, p.y + 6, "#e8eaee", 8);
        }
        continue;
      }
      if (p.iframe > 0) continue;
      if (p.big) {
        p.big = false;
        p.climbing = null;
        this.applySize();
        p.iframe = 1.15;
        p.vy = -380;
        p.vx = (p.x + p.w / 2 < r.x + r.w / 2 ? -1 : 1) * 140;
        p.grounded = false;
        this.events.push("hurt");
        this.banner = "Back to snack size.";
        this.bannerT = 1.5;
        this.shake = this.reduce ? 0 : 6;
        return;
      }
      this.die("Oof.");
      return;
    }
  }

  private touchPickups() {
    const p = this.player;
    for (const item of this.level.pickups) {
      if (this.got.has(item.id)) continue;
      const box = { x: item.x - 16, y: item.y - 16, w: 32, h: 32 };
      if (!overlaps(p, box)) continue;
      this.got.add(item.id);
      if (item.kind === "coin") {
        this.events.push("coin");
        this.puff(item.x, item.y, "#e2a322", 6);
      } else if (item.kind === "food") {
        const grew = !p.big;
        p.big = true;
        this.applySize();
        p.iframe = Math.max(p.iframe, 0.45);
        if (p.grounded) p.vy = -220;
        this.events.push("food");
        this.banner = grew ? "Tuna. Higher, faster, a little bigger." : "Still full of tuna.";
        this.bannerT = 1.8;
        this.puff(item.x, item.y, "#e7b15a", 10);
      } else {
        p.poof = 10;
        this.events.push("laser");
        this.banner = "Hackles up. Hold jump to float.";
        this.bannerT = 1.8;
        this.puff(p.x + p.w / 2, p.y, "#d83b3b", 10);
      }
    }
  }

  private touchCheckpoints() {
    const p = this.player;
    for (const cp of this.level.checkpoints) {
      const zone = { x: cp.x - 16, y: cp.y - 48, w: 72, h: 52 };
      if (!overlaps(p, zone)) continue;
      if (this.checkpointId === cp.id && this.spawn.x === cp.x) continue;
      this.checkpointId = cp.id;
      this.spawn = { x: cp.x, y: cp.y };
      this.events.push("checkpoint");
      this.banner = "Cat bed saved.";
      this.bannerT = 1.3;
    }
  }

  private touchGoal() {
    if (this.phase !== "play") return;
    if (this.boss && this.boss.mode !== "gone") return;
    if (!overlaps(this.player, this.level.goal, -6, -6)) return;
    this.phase = "cleared";
    this.player.vx = 0;
    this.player.vy = 0;
    this.events.push("win");
    this.banner = "Room clear.";
    this.bannerT = 2;
    this.shake = this.reduce ? 0 : 2;
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: this.level.goal.x + 20,
        y: this.level.goal.y + 30,
        vx: (Math.random() - 0.5) * 180,
        vy: -80 - Math.random() * 160,
        life: 0.8 + Math.random() * 0.4,
        max: 1.1,
        size: 3 + Math.random() * 3,
        color: i % 2 ? "#e2a322" : "#3f6b52",
      });
    }
  }

  private die(msg: string) {
    if (this.phase !== "play") return;
    this.phase = "dead";
    this.deadT = 1.15;
    this.player.climbing = null;
    this.player.cling = 0;
    this.player.fidget = "none";
    this.player.vx = 0;
    this.player.vy = 0;
    this.events.push("die");
    this.banner = msg;
    this.bannerT = 1.4;
    this.shake = this.reduce ? 0 : 7;
  }

  private puff(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 120,
        vy: -20 - Math.random() * 80,
        life: 0.35 + Math.random() * 0.25,
        max: 0.6,
        size: 2 + Math.random() * 2.5,
        color,
      });
    }
  }

  private updateParticles(dt: number) {
    for (const q of this.particles) {
      q.life -= dt;
      q.vy += 500 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    if (this.particles.length > 120) this.particles.splice(0, this.particles.length - 120);
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  private decayBanner(dt: number) {
    if (this.bannerT > 0) this.bannerT = Math.max(0, this.bannerT - dt);
  }

  private relaxShake(dt: number) {
    this.shake = Math.max(0, this.shake - dt * 18);
    if (this.reduce) {
      this.shakeX = 0;
      this.shakeY = 0;
      return;
    }
    this.shakeX = Math.sin(this.time * 54) * this.shake;
    this.shakeY = Math.cos(this.time * 47) * this.shake * 0.65;
  }

  private followCamera(dt: number) {
    const p = this.player;
    const look = p.facing * 70;
    let tx = p.x + p.w / 2 - VIEW_W / 2 + look;
    let ty = p.y + p.h / 2 - VIEW_H / 2 - 20;
    tx = clamp(tx, 0, Math.max(0, this.level.width - VIEW_W));
    ty = clamp(ty, 0, Math.max(0, this.level.height - VIEW_H));
    const k = 1 - Math.exp(-5 * dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
  }

  private snapCamera(instant: boolean) {
    this.followCamera(instant ? 10 : 0.2);
    if (instant) {
      const p = this.player;
      this.camX = clamp(p.x + p.w / 2 - VIEW_W / 2, 0, Math.max(0, this.level.width - VIEW_W));
      this.camY = clamp(p.y + p.h / 2 - VIEW_H / 2 - 20, 0, Math.max(0, this.level.height - VIEW_H));
    }
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export const initialSnapshot = emptySnap;
