import type { ArtSet, Sheet } from "@/game/assets";
import type { Rect } from "@/game/levels";
import { hazardPose, moverAt, VIEW_H, VIEW_W, type Game } from "@/game/sim";

const WOOD = "#a86b42";
const WOOD_DARK = "#6e4128";
const WOOD_LIP = "#e0b07a";
const BRASS = "#e6c98a";
const WALL = "#f4e7d6";

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  game: Game,
  art: ArtSet,
) {
  const canvas = ctx.canvas;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bw = Math.max(1, Math.round(cssW * dpr));
  const bh = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = "#f6efe4";
  ctx.fillRect(0, 0, cssW, cssH);

  const scale = Math.min(cssW / VIEW_W, cssH / VIEW_H);
  const ox = (cssW - VIEW_W * scale) / 2;
  const oy = (cssH - VIEW_H * scale) / 2;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.rect(0, 0, VIEW_W, VIEW_H);
  ctx.clip();

  const camX = Math.round(game.camX + game.shakeX);
  const camY = Math.round(game.camY + game.shakeY);
  ctx.translate(-camX, -camY);
  paint(ctx, game, art, camX, camY);
  ctx.restore();
}

function paint(
  ctx: CanvasRenderingContext2D,
  game: Game,
  art: ArtSet,
  camX: number,
  camY: number,
) {
  const level = game.level;
  drawApartment(ctx, level);

  for (const d of level.decor) {
    if (d.kind === "window") drawWindow(ctx, d, art, camX, camY, game.time);
    if (d.kind === "frame") drawFrame(ctx, d);
  }
  for (const d of level.decor) {
    if (d.kind === "books") drawBooks(ctx, d.x, d.y, d.w);
    if (d.kind === "rug") drawRug(ctx, d.x, d.y, d.w);
  }

  for (const gust of level.drafts) drawDraft(ctx, gust, game.time);

  for (const c of level.curtains) drawCurtain(ctx, c, game.time, game.player.climbing === c.id);

  for (const s of level.solids) drawSolid(ctx, s);
  for (const o of level.oneways) drawShelf(ctx, o, false);
  for (const m of level.movers) drawShelf(ctx, moverAt(m, game.time), true);
  for (const pil of level.pillows) drawPillow(ctx, pil, game.time);

  if (level.boss) {
    drawDogDoor(ctx, level.goal, game.boss?.mode === "gone");
    for (const jar of level.boss.jars) drawJar(ctx, jar, game);
    if (game.boss && game.boss.x < level.width + 40) drawBiscuit(ctx, game.boss, game.time, level.width);
  }

  for (const d of level.decor) {
    if (d.kind === "plant") drawPlant(ctx, d.x, d.y, game.time);
    if (d.kind === "lamp") drawLamp(ctx, d.x, d.y, game.time);
    if (d.kind === "bowl") drawBowl(ctx, d.x, d.y, game.time);
  }

  for (const cp of level.checkpoints) {
    const on = game.checkpointId === cp.id;
    drawBed(ctx, art, cp.x, cp.y, on, game.time);
  }

  drawFlag(ctx, art, level.goal, game.time);

  for (const item of level.pickups) {
    if (game.got.has(item.id)) continue;
    const bob = Math.sin(game.time * 3 + item.x * 0.02) * 4;
    if (item.kind === "coin") drawCoin(ctx, art, item.x, item.y + bob, game.time + item.x);
    else if (item.kind === "food") drawProp(ctx, art.food, item.x, item.y + bob, 40, 36);
    else drawProp(ctx, art.laser, item.x, item.y + bob, 36, 36);
  }

  for (const h of level.hazards) {
    if (game.isDead(h.id)) continue;
    const pose = hazardPose(h, game.time, game.isStunned(h.id));
    const r = pose.rect;
    if (h.kind === "cactus") drawProp(ctx, art.cactus, r.x + r.w / 2, r.y + r.h - 4, 48, 52);
    else if (h.kind === "roomba") drawRoomba(ctx, art, r, game.isStunned(h.id), game.time);
    else if (h.kind === "mouse") drawMouse(ctx, r, pose.flip, game.isStunned(h.id), game.time);
    else if (h.kind === "moth") drawMoth(ctx, r, game.isStunned(h.id), game.time);
    else drawSpider(ctx, r, pose.anchorY, game.isStunned(h.id), game.time);
  }

  for (const q of game.particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawPenny(ctx, game, art);
}

function drawApartment(ctx: CanvasRenderingContext2D, level: Game["level"]) {
  ctx.fillStyle = WALL;
  ctx.fillRect(-20, -20, level.width + 40, level.height + 40);
  ctx.fillStyle = "rgba(226, 206, 180, 0.45)";
  for (let x = 0; x < level.width; x += 58) ctx.fillRect(x, 0, 16, level.height);
  ctx.fillStyle = "rgba(198, 163, 106, 0.16)";
  for (let y = 28; y < level.height; y += 52) {
    for (let x = 22; x < level.width; x += 58) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#c6a36a";
  ctx.fillRect(0, 22, level.width, 7);
  ctx.fillStyle = "#8a6a3b";
  ctx.fillRect(0, 29, level.width, 2);
  for (const s of level.solids) {
    if (s.h < 70) continue;
    ctx.fillStyle = "#5c381f";
    ctx.fillRect(s.x, s.y - 8, s.w, 8);
    ctx.fillStyle = WOOD_LIP;
    ctx.fillRect(s.x, s.y - 8, s.w, 3);
    ctx.strokeStyle = "rgba(110, 65, 40, 0.28)";
    ctx.lineWidth = 2;
    const panels = Math.max(1, Math.floor(s.w / 92));
    for (let i = 0; i < panels; i++) {
      const px = s.x + 8 + i * ((s.w - 16) / panels);
      const pw = (s.w - 16) / panels - 8;
      ctx.strokeRect(px, s.y + 16, pw, Math.min(46, s.h - 28));
    }
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  f: { x: number; y: number; w: number; h: number },
) {
  ctx.fillStyle = "#6e4128";
  round(ctx, f.x, f.y, f.w, f.h, 3);
  ctx.fill();
  ctx.fillStyle = "#f7f1e6";
  ctx.fillRect(f.x + 6, f.y + 6, f.w - 12, f.h - 12);
  ctx.fillStyle = "#9ec0d4";
  ctx.fillRect(f.x + 6, f.y + 6, f.w - 12, (f.h - 12) * 0.58);
  ctx.fillStyle = "#3f6b52";
  ctx.beginPath();
  ctx.moveTo(f.x + 8, f.y + f.h - 10);
  ctx.lineTo(f.x + f.w * 0.42, f.y + f.h * 0.48);
  ctx.lineTo(f.x + f.w * 0.62, f.y + f.h - 10);
  ctx.fill();
  ctx.fillStyle = "#2f5344";
  ctx.beginPath();
  ctx.moveTo(f.x + f.w * 0.4, f.y + f.h - 10);
  ctx.lineTo(f.x + f.w * 0.72, f.y + f.h * 0.4);
  ctx.lineTo(f.x + f.w - 8, f.y + f.h - 10);
  ctx.fill();
  ctx.fillStyle = "#e2a322";
  ctx.beginPath();
  ctx.arc(f.x + f.w * 0.72, f.y + f.h * 0.28, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawJar(
  ctx: CanvasRenderingContext2D,
  jar: { x: number; y: number; side: "left" | "right" },
  game: Game,
) {
  const b = game.boss;
  const side = b && b.x < game.level.width / 2 ? "left" : "right";
  const live = b?.mode === "dizzy" && jar.side === side;
  ctx.save();
  ctx.translate(jar.x, jar.y);
  if (live) {
    ctx.fillStyle = "rgba(226, 163, 34, 0.28)";
    ctx.beginPath();
    ctx.arc(0, -8, 22 + Math.sin(game.time * 8) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#d7c4a8";
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(-8, -26);
  ctx.lineTo(8, -26);
  ctx.lineTo(12, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = live ? "#e2a322" : "#c45c48";
  ctx.fillRect(-10, -30, 20, 6);
  ctx.fillStyle = "#6e4128";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("T", 0, -12);
  ctx.restore();
}

function drawDogDoor(
  ctx: CanvasRenderingContext2D,
  goal: { x: number; y: number },
  open: boolean,
) {
  const x = goal.x - 6;
  const y = goal.y + 70;
  ctx.fillStyle = "#5c381f";
  ctx.fillRect(x, y, 48, 90);
  ctx.fillStyle = open ? "#9ec0d4" : "#2a2622";
  ctx.beginPath();
  ctx.arc(x + 24, y + 26, 18, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + 6, y + 26, 36, 60);
  if (open) {
    ctx.fillStyle = "rgba(255,244,220,0.7)";
    ctx.fillRect(x + 28, y + 40, 8, 28);
  }
}

function drawBiscuit(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number; facing: 1 | -1; mode: string },
  time: number,
  _width: number,
) {
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h);
  if (b.facing < 0) ctx.scale(-1, 1);
  const crouch = b.mode === "windup" ? 0.78 : 1;
  ctx.rotate(b.mode === "charge" ? 0.12 : 0);
  ctx.scale(1, crouch);
  ctx.strokeStyle = "#c4a574";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-34, -36);
  ctx.quadraticCurveTo(-62, -64 + Math.sin(time * (b.mode === "charge" ? 16 : 6)) * 8, -28, -78);
  ctx.stroke();
  ctx.fillStyle = "#ead7b4";
  ctx.beginPath();
  ctx.ellipse(-4, -28, 42, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3e6cf";
  ctx.beginPath();
  ctx.ellipse(34, -42, 22, 18, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4a574";
  ctx.beginPath();
  ctx.ellipse(24, -60, 8, 14, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c3136";
  ctx.beginPath();
  ctx.arc(50, -38, 4.5, 0, Math.PI * 2);
  ctx.fill();
  if (b.mode === "dizzy") {
    ctx.strokeStyle = "#2c3136";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(40, -48, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.strokeStyle = "#e2a322";
    ctx.lineWidth = 2;
    const spin = time * 7;
    ctx.beginPath();
    ctx.arc(18, -84, 8, spin, spin + 1.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(40, -92, 6, spin + 2, spin + 3.4);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#2c3136";
    ctx.beginPath();
    ctx.arc(40, -48, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#3f6b52";
  ctx.fillRect(16, -34, 18, 7);
  ctx.fillStyle = "#e6c98a";
  ctx.beginPath();
  ctx.arc(25, -30, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d7b48a";
  ctx.beginPath();
  ctx.ellipse(-16, -8, 8, 5, 0.4, 0, Math.PI * 2);
  ctx.ellipse(8, -8, 8, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.fillStyle = "rgba(80,40,20,0.15)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b5523a";
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 18);
  ctx.lineTo(x + 14, y - 18);
  ctx.lineTo(x + 9, y);
  ctx.lineTo(x - 9, y);
  ctx.fill();
  ctx.fillStyle = "#e7c27a";
  ctx.fillRect(x - 14, y - 20, 28, 4);
  ctx.fillStyle = "#3f6b52";
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(time * 1.4 + i) * 2;
    ctx.beginPath();
    ctx.ellipse(x + (i - 2) * 7 + sway, y - 34 - (i % 2) * 10, 8, 16, (i - 2) * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const glow = 0.12 + Math.sin(time * 2) * 0.03;
  ctx.fillStyle = `rgba(255, 196, 110, ${glow})`;
  ctx.beginPath();
  ctx.ellipse(x, y - 46, 36, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a6a3b";
  ctx.fillRect(x - 2, y - 52, 4, 48);
  ctx.fillStyle = "#5c381f";
  ctx.fillRect(x - 10, y - 6, 20, 6);
  ctx.fillStyle = "#f3e2cc";
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 52);
  ctx.lineTo(x + 16, y - 52);
  ctx.lineTo(x + 12, y - 34);
  ctx.lineTo(x - 12, y - 34);
  ctx.fill();
  ctx.fillStyle = "#e2b56a";
  ctx.fillRect(x - 16, y - 54, 32, 3);
}

function drawBowl(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.fillStyle = "rgba(142, 188, 218, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y - 16, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 140, 170, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = x + Math.sin(time * 2.2) * 8;
  const fy = y - 16 + Math.cos(time * 1.6) * 4;
  ctx.fillStyle = "#d36b32";
  ctx.beginPath();
  ctx.ellipse(fx, fy, 6, 3, Math.sin(time * 2), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(x - 6, y - 22, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawMouse(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  flip: boolean,
  stunned: boolean,
  time: number,
) {
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h);
  if (flip) ctx.scale(-1, 1);
  if (stunned) ctx.rotate(0.8);
  const step = stunned ? 0 : Math.sin(time * 16) * 2;
  ctx.fillStyle = "#8d8580";
  ctx.beginPath();
  ctx.ellipse(0, -8, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d7a7a0";
  ctx.beginPath();
  ctx.ellipse(8, -13, 4, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c3136";
  ctx.beginPath();
  ctx.arc(6, -9, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c48b84";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.quadraticCurveTo(-18, -14 + step, -16, -2);
  ctx.stroke();
  ctx.fillStyle = "#6e6762";
  ctx.fillRect(-4, -3, 3, 3 + step);
  ctx.fillRect(3, -3, 3, 3 - step);
  ctx.restore();
}

function drawMoth(ctx: CanvasRenderingContext2D, r: Rect, stunned: boolean, time: number) {
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
  const flap = stunned ? 0.3 : 0.35 + Math.abs(Math.sin(time * 18)) * 0.75;
  ctx.fillStyle = "rgba(243, 226, 204, 0.92)";
  ctx.beginPath();
  ctx.ellipse(-8, 0, 10, 7 * flap, -0.4, 0, Math.PI * 2);
  ctx.ellipse(8, 0, 10, 7 * flap, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e2a322";
  ctx.beginPath();
  ctx.arc(-8, 0, 2, 0, Math.PI * 2);
  ctx.arc(8, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c381f";
  ctx.fillRect(-1.5, -5, 3, 10);
  ctx.restore();
}

function drawSpider(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  anchorY: number,
  stunned: boolean,
  time: number,
) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  ctx.strokeStyle = "rgba(90, 80, 70, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, anchorY);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, cy);
  if (stunned) ctx.rotate(Math.sin(time * 14) * 0.4);
  ctx.strokeStyle = "#2c3136";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const a = -0.8 + i * 0.45 + Math.sin(time * 6 + i) * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 8, -6, Math.cos(a) * 12, Math.sin(a) * 4);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-Math.cos(a) * 8, -6, -Math.cos(a) * 12, Math.sin(a) * 4);
    ctx.stroke();
  }
  ctx.fillStyle = "#3a342f";
  ctx.beginPath();
  ctx.ellipse(0, 2, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c3136";
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDraft(
  ctx: CanvasRenderingContext2D,
  gust: { x: number; y: number; w: number; h: number; dir: 1 | -1 },
  time: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(gust.x, gust.y, gust.w, gust.h);
  ctx.clip();
  for (let i = 0; i < 7; i++) {
    const span = gust.w + 80;
    const travel = ((time * 90 * gust.dir + i * 70) % span + span) % span;
    const x = gust.dir > 0 ? gust.x - 40 + travel : gust.x + gust.w + 40 - travel;
    const y = gust.y + 16 + ((i * 47) % Math.max(20, gust.h - 24));
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + (i % 3) * 0.06})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - gust.dir * 28, y + 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPillow(ctx: CanvasRenderingContext2D, pil: { x: number; y: number; w: number; h: number }, time: number) {
  const squash = 1 + Math.sin(time * 3) * 0.03;
  ctx.save();
  ctx.translate(pil.x + pil.w / 2, pil.y + pil.h);
  ctx.scale(squash, 1 / squash);
  ctx.fillStyle = "rgba(80,50,30,0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 2, pil.w * 0.42, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3e2cc";
  ctx.beginPath();
  ctx.roundRect(-pil.w / 2, -pil.h, pil.w, pil.h, 10);
  ctx.fill();
  ctx.strokeStyle = "#e2b56a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -pil.h + 4);
  ctx.quadraticCurveTo(6, -pil.h / 2, 0, -3);
  ctx.stroke();
  ctx.fillStyle = "#d7a15a";
  ctx.fillRect(-3, -pil.h / 2 - 3, 6, 6);
  ctx.restore();
}

function drawRoomba(
  ctx: CanvasRenderingContext2D,
  art: ArtSet,
  r: { x: number; y: number; w: number; h: number },
  stunned: boolean,
  time: number,
) {
  ctx.save();
  if (stunned) {
    ctx.translate(r.x + r.w / 2, r.y + r.h);
    ctx.rotate(Math.sin(time * 18) * 0.08);
    ctx.translate(-(r.x + r.w / 2), -(r.y + r.h));
  }
  drawProp(ctx, art.roomba, r.x + r.w / 2, r.y + r.h, 52, 32);
  if (stunned) {
    ctx.strokeStyle = "#e6c98a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2 - 8, r.y - 6, 4, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2 + 8, r.y - 8, 3, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCurtain(
  ctx: CanvasRenderingContext2D,
  c: { x: number; y: number; w: number; h: number },
  time: number,
  climbed: boolean,
) {
  ctx.fillStyle = "#c6a36a";
  ctx.fillRect(c.x - 8, c.y, c.w + 16, 7);
  ctx.fillStyle = "#8a6a3b";
  ctx.fillRect(c.x - 8, c.y + 6, c.w + 16, 3);
  const folds = 4;
  for (let i = 0; i < folds; i++) {
    const fw = c.w / folds + 1;
    const sway = Math.sin(time * 1.3 + i * 0.8) * 1.2;
    ctx.fillStyle = i % 2 === 0 ? "#3f6b52" : "#2f5344";
    ctx.fillRect(c.x + i * (c.w / folds) + sway, c.y + 8, fw, c.h - 14);
  }
  ctx.fillStyle = "#e6c98a";
  ctx.fillRect(c.x, c.y + c.h - 8, c.w, 8);
  if (!climbed) {
    ctx.strokeStyle = "rgba(246,239,228,0.55)";
    ctx.lineWidth = 2;
    const y = c.y + 28 + ((time * 36) % Math.max(40, c.h - 70));
    ctx.beginPath();
    ctx.moveTo(c.x + c.w * 0.35, y);
    ctx.lineTo(c.x + c.w * 0.5, y - 8);
    ctx.lineTo(c.x + c.w * 0.65, y);
    ctx.stroke();
  }
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  w: { x: number; y: number; w: number; h: number },
  art: ArtSet,
  camX: number,
  camY: number,
  time: number,
) {
  ctx.save();
  round(ctx, w.x, w.y, w.w, w.h, 8);
  ctx.clip();
  if (art.sky) {
    const iw = art.sky.width;
    const ih = art.sky.height;
    const scale = Math.max(w.w / iw, w.h / ih) * 1.4;
    const dx = w.x - camX * 0.08 - iw * scale * 0.15;
    const dy = w.y - camY * 0.05;
    ctx.drawImage(art.sky, dx, dy, iw * scale, ih * scale);
  } else {
    const g = ctx.createLinearGradient(w.x, w.y, w.x, w.y + w.h);
    g.addColorStop(0, "#8ebcda");
    g.addColorStop(1, "#f2d7b0");
    ctx.fillStyle = g;
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }
  ctx.restore();
  ctx.strokeStyle = "#8a623f";
  ctx.lineWidth = 6;
  round(ctx, w.x, w.y, w.w, w.h, 8);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,250,243,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w.x + w.w / 2, w.y + 4);
  ctx.lineTo(w.x + w.w / 2, w.y + w.h - 4);
  ctx.moveTo(w.x + 4, w.y + w.h / 2);
  ctx.lineTo(w.x + w.w - 4, w.y + w.h / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 214, 140, 0.14)";
  ctx.beginPath();
  ctx.moveTo(w.x + 8, w.y + w.h);
  ctx.lineTo(w.x + w.w - 8, w.y + w.h);
  ctx.lineTo(w.x + w.w + 36, w.y + w.h + 210);
  ctx.lineTo(w.x - 28, w.y + w.h + 210);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 244, 220, 0.45)";
  for (let i = 0; i < 4; i++) {
    const mote = (time * 12 + i * 40) % 180;
    ctx.beginPath();
    ctx.arc(w.x + 20 + i * (w.w / 4), w.y + w.h + mote, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBooks(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const colors = ["#6e4128", "#3f6b52", "#d36b32", "#2c3136", "#e2a322", "#7e4a3a"];
  let cursor = x + 4;
  let i = 0;
  while (cursor < x + w - 8) {
    const bw = 8 + ((i * 5) % 7);
    const bh = 22 + ((i * 3) % 10);
    ctx.fillStyle = colors[i % colors.length]!;
    ctx.fillRect(cursor, y - bh, bw, bh);
    cursor += bw + 2;
    i += 1;
  }
}

function drawRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = "#c45c48";
  round(ctx, x, y, w, 14, 7);
  ctx.fill();
  ctx.fillStyle = "#e7c27a";
  round(ctx, x + 6, y + 3, w - 12, 8, 4);
  ctx.fill();
}

function drawSolid(ctx: CanvasRenderingContext2D, s: Rect) {
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = WOOD;
  ctx.fillRect(s.x, s.y, s.w, Math.min(18, s.h));
  ctx.fillStyle = WOOD_LIP;
  ctx.fillRect(s.x, s.y, s.w, 5);
  ctx.strokeStyle = "rgba(80,40,20,0.25)";
  ctx.lineWidth = 1;
  for (let x = s.x + 28; x < s.x + s.w; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, s.y + 6);
    ctx.lineTo(x, s.y + Math.min(s.h, 70));
    ctx.stroke();
  }
}

function drawShelf(ctx: CanvasRenderingContext2D, s: Rect, mover: boolean) {
  ctx.fillStyle = WOOD_DARK;
  round(ctx, s.x, s.y, s.w, s.h, 3);
  ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.fillRect(s.x, s.y, s.w, 3);
  if (mover) {
    ctx.fillStyle = "#2c3136";
    ctx.beginPath();
    ctx.arc(s.x + 10, s.y + s.h + 3, 4, 0, Math.PI * 2);
    ctx.arc(s.x + s.w - 10, s.y + s.h + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBed(
  ctx: CanvasRenderingContext2D,
  art: ArtSet,
  x: number,
  y: number,
  on: boolean,
  time: number,
) {
  if (on) {
    ctx.strokeStyle = "rgba(63,107,82,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + 28, y - 6, 26, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(226, 163, 34, ${0.35 + Math.sin(time * 6) * 0.15})`;
    ctx.beginPath();
    ctx.arc(x + 28, y - 28, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (art.bed) drawProp(ctx, art.bed, x + 28, y, 64, 36);
  else {
    ctx.fillStyle = "#c46a45";
    ctx.beginPath();
    ctx.ellipse(x + 28, y - 8, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f6efe4";
    ctx.beginPath();
    ctx.ellipse(x + 28, y - 12, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlag(ctx: CanvasRenderingContext2D, art: ArtSet, goal: Rect, time: number) {
  const bob = Math.sin(time * 2.4) * 2;
  if (art.flag) {
    drawProp(ctx, art.flag, goal.x + goal.w / 2, goal.y + goal.h + bob, 54, 150);
    return;
  }
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(goal.x + 8, goal.y, 6, goal.h);
  ctx.fillStyle = "#fffaf3";
  ctx.beginPath();
  ctx.moveTo(goal.x + 14, goal.y + 8 + bob);
  ctx.lineTo(goal.x + 48, goal.y + 22 + bob);
  ctx.lineTo(goal.x + 14, goal.y + 36 + bob);
  ctx.fill();
}

function drawCoin(ctx: CanvasRenderingContext2D, art: ArtSet, x: number, y: number, time: number) {
  const sx = 0.35 + 0.65 * Math.abs(Math.sin(time * 2.2));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  if (art.coin) ctx.drawImage(art.coin, -16, -16, 32, 32);
  else {
    ctx.fillStyle = "#e2a322";
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  foot: number,
  w: number,
  h: number,
) {
  if (!img) return;
  ctx.drawImage(img, cx - w / 2, foot - h, w, h);
}

function poseFrame(t: number, dur: number, frames: number) {
  const u = Math.min(0.999, Math.max(0, t / dur)) * frames;
  return { frame: Math.min(frames - 1, Math.floor(u)) };
}

const RUN_FRAMES = [0, 1, 2, 3, 4, 5, 7, 9, 10, 11];
const CLIMB_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const JUMP_SCALE = [1, 1, 1.08, 1.14, 1.14, 1.14, 1.08, 0.96, 1, 1, 1, 1];

function drawPenny(ctx: CanvasRenderingContext2D, game: Game, art: ArtSet) {
  const p = game.player;
  const poof = p.poof > 0;
  const climbing = !!p.climbing || p.cling !== 0;
  const pouncing = game.isPouncing;
  let sheet: Sheet | null = null;
  let frame = 0;
  let key = "idle";
  let extraScale = 1;
  let tilt = 0;
  let bobY = 0;
  let breathX = 1;
  let breathY = 1;

  if (climbing) {
    sheet = art.climb ?? (poof ? art.poof : art.jump);
    key = "climb";
    if (sheet === art.climb) {
      if (p.cling !== 0) {
        frame = 8;
        tilt = p.cling * 0.08;
      } else if (Math.abs(p.vy) > 20) {
        frame = CLIMB_FRAMES[Math.floor(game.time * 9) % CLIMB_FRAMES.length]!;
      } else {
        frame = 2;
      }
    } else {
      const n = sheet?.frames ?? 12;
      frame = Math.floor(game.time * 4) % n;
    }
  } else if (pouncing) {
    sheet = poof ? art.poof : art.jump;
    key = poof ? "poof-pounce" : "pounce";
    frame = sheet === art.jump ? 8 : Math.floor(game.time * 8) % (sheet?.frames ?? 12);
    tilt = p.facing * 0.14;
  } else if (!p.grounded) {
    sheet = poof ? art.poof : art.jump;
    key = poof ? "poof-air" : "jump";
    if (sheet === art.jump) {
      if (p.vy < -420) frame = 2;
      else if (p.vy < -160) frame = 3;
      else if (p.vy <= 140) frame = p.vy < 0 ? 4 : 5;
      else if (p.vy <= 450) frame = 8;
      else frame = 9;
      extraScale = JUMP_SCALE[frame] ?? 1;
      tilt = Math.max(-0.14, Math.min(0.14, (p.vy / 2600) * p.facing));
    } else {
      const n = sheet?.frames ?? 12;
      frame = Math.floor(game.time * 8) % n;
    }
  } else if (p.fidget === "stretch" && art.stretch) {
    sheet = art.stretch;
    key = "stretch";
    frame = poseFrame(p.fidgetT, 3.2, sheet.frames).frame;
  } else if (p.fidget === "roll" && art.roll) {
    sheet = art.roll;
    key = "roll";
    frame = poseFrame(p.fidgetT, 3.4, sheet.frames).frame;
  } else if (p.fidget === "tail" && art.tail) {
    sheet = art.tail;
    key = "tail";
    frame = poseFrame(p.fidgetT, 2.8, sheet.frames).frame;
  } else if (p.fidget === "none" && Math.abs(p.vx) > 20) {
    sheet = poof ? art.poofRun : art.run;
    key = poof ? "poof-run" : "run";
    const idx = Math.floor(p.anim) % RUN_FRAMES.length;
    frame = RUN_FRAMES[idx]!;
    tilt = Math.max(-0.07, Math.min(0.07, p.vx / 4800));
    bobY = -Math.abs(Math.sin((p.anim * Math.PI) / RUN_FRAMES.length)) * 1.6;
  } else {
    sheet = poof ? art.poof : art.idle;
    key = poof ? "poof" : "idle";
    frame = poof ? Math.floor(game.time * 6) % (sheet?.frames ?? 12) : 0;
    const breath = Math.sin(game.time * 2.6) * 0.018;
    breathX = 1 - breath * 0.5;
    breathY = 1 + breath;
  }
  if (!sheet && art.idle) {
    sheet = art.idle;
    key = "idle";
  }

  for (const t of game.pounceTrail) {
    const trailSheet = t.poof > 0 ? art.poof : art.jump;
    if (!trailSheet) continue;
    const tScale = t.big ? 1.32 : 1;
    const tSize = 100 * tScale;
    const tCx = t.x + (t.big ? 34 * 1.2 : 34) / 2;
    const tFoot = t.y + (t.big ? 26 * 1.2 : 26);
    ctx.save();
    ctx.globalAlpha = 0.24 * (t.life / 0.16);
    blitSheet(ctx, trailSheet, trailSheet === art.jump ? 8 : 0, tCx, tFoot, tSize, t.facing === -1);
    ctx.restore();
  }

  if (!sheet) {
    const blink = p.iframe > 0 && Math.floor(game.time * 16) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.45 : 1;
    const scale = (p.big ? 1.32 : 1) * (game.phase === "dead" ? 0.92 : 1);
    const size = 100 * scale;
    const cx = p.x + p.w / 2;
    const foot = p.y + p.h;
    drawFallbackCat(ctx, cx, foot, size, p.facing === -1, game.time, poof, Math.abs(p.vx) > 30 || climbing);
    ctx.restore();
    return;
  }

  const flip = p.facing === -1;

  const blink = p.iframe > 0 && Math.floor(game.time * 16) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = blink ? 0.45 : 1;
  const scale = (p.big ? 1.32 : 1) * (game.phase === "dead" ? 0.92 : 1);
  const size = 100 * scale * extraScale;
  const cx = p.x + p.w / 2;
  const foot = p.y + p.h;
  ctx.fillStyle = "rgba(60,40,30,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, foot + 2, 16 * scale * (p.fidget === "roll" ? 1.35 : 1), 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, foot + bobY);
  if (game.phase === "dead") {
    ctx.rotate(p.facing * 0.4);
  } else if (tilt !== 0) {
    ctx.rotate(tilt);
  }
  ctx.scale(p.squashX * breathX, p.squashY * breathY);
  ctx.translate(-cx, -foot);

  blitSheet(ctx, sheet, frame, cx, foot, size, flip);
  ctx.restore();
  const debug = window as Window & { __pose?: { key: string; frame: number; fidget: string; x: number; vx: number } };
  debug.__pose = { key, frame, fidget: p.fidget, x: Math.round(p.x), vx: Math.round(p.vx) };
}

function blitSheet(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  cx: number,
  foot: number,
  size: number,
  flip: boolean,
) {
  const sw = sheet.img.width / sheet.cols;
  const sh = sheet.img.height / sheet.rows;
  const f = ((frame % sheet.frames) + sheet.frames) % sheet.frames;
  const col = f % sheet.cols;
  const row = Math.floor(f / sheet.cols);
  const pad = size * (8 / 256);
  const dx = cx - size / 2;
  const dy = foot - size + pad;
  ctx.save();
  if (flip) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }
  ctx.drawImage(sheet.img, col * sw, row * sh, sw, sh, dx, dy, size, size);
  ctx.restore();
}

function drawFallbackCat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  foot: number,
  size: number,
  flip: boolean,
  time: number,
  poof: boolean,
  running: boolean,
) {
  ctx.save();
  ctx.translate(cx, foot);
  if (flip) ctx.scale(-1, 1);
  const s = size / 92;
  ctx.scale(s, s);
  ctx.translate(0, -46);
  if (poof) {
    ctx.fillStyle = "#c5c8ce";
    ctx.beginPath();
    ctx.ellipse(0, 4, 34, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const leg = running ? Math.sin(time * 18) * 4 : 0;
  ctx.fillStyle = "#b7bcc4";
  ctx.fillRect(-16, 10, 6, 12 + leg);
  ctx.fillRect(-4, 10, 6, 12 - leg);
  ctx.fillRect(6, 10, 6, 12 + leg);
  ctx.strokeStyle = "#2a2e33";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.quadraticCurveTo(-36, -8 + Math.sin(time * 4) * 3, -28, 12);
  ctx.stroke();
  ctx.fillStyle = "#c5c8ce";
  ctx.beginPath();
  ctx.ellipse(-2, 2, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1c1f";
  ctx.beginPath();
  ctx.ellipse(-6, -2, 4, 3, 0.4, 0, Math.PI * 2);
  ctx.ellipse(4, 0, 3, 2.4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d5d8de";
  ctx.beginPath();
  ctx.arc(14, -4, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1c1f";
  ctx.beginPath();
  ctx.moveTo(6, -12);
  ctx.lineTo(10, -20);
  ctx.lineTo(14, -10);
  ctx.moveTo(16, -12);
  ctx.lineTo(22, -20);
  ctx.lineTo(22, -8);
  ctx.fill();
  ctx.fillStyle = "#e7b3a2";
  ctx.beginPath();
  ctx.arc(20, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d6a317";
  ctx.beginPath();
  ctx.arc(18, -6, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
