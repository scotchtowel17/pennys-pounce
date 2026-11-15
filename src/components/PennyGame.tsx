import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { PawPrint, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { EMPTY_ART, loadArt, type ArtSet } from "@/game/assets";
import { Sfx } from "@/game/audio";
import { LEVELS } from "@/game/levels";
import {
  EMPTY_INPUT,
  Game,
  type InputState,
  type Snapshot,
} from "@/game/sim";
import { drawWorld } from "@/game/render";

type Screen = "title" | "levels" | "play";

type Save = { v: 1; cleared: [boolean, boolean, boolean, boolean]; best: [number, number, number, number] };

const SAVE_KEY = "pennys-pounce-v1";

const blankSave = (): Save => ({
  v: 1,
  cleared: [false, false, false, false],
  best: [0, 0, 0, 0],
});

function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return blankSave();
    const parsed = JSON.parse(raw) as { v?: number; cleared?: boolean[]; best?: number[] };
    if (parsed?.v !== 1 || !Array.isArray(parsed.cleared)) return blankSave();
    const cleared = [false, false, false, false] as Save["cleared"];
    const best = [0, 0, 0, 0] as Save["best"];
    for (let i = 0; i < 4; i++) {
      cleared[i] = !!parsed.cleared[i];
      best[i] = parsed.best?.[i] ?? 0;
    }
    return { v: 1, cleared, best };
  } catch {
    return blankSave();
  }
}

const TOUCH_CODES = ["L", "R", "J", "Dn", "U", "Rn", "Po"] as const;
const MOVE_CODES = [
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
] as const;

function readInput(held: Set<string>, aim: number): InputState {
  let left = held.has("KeyA") || held.has("ArrowLeft") || held.has("L");
  let right = held.has("KeyD") || held.has("ArrowRight") || held.has("R");
  if (left && right) {
    if (aim >= 0) left = false;
    else right = false;
  }
  return {
    left,
    right,
    jump: held.has("KeyW") || held.has("ArrowUp") || held.has("Space") || held.has("J"),
    down: held.has("KeyS") || held.has("ArrowDown") || held.has("Dn"),
    up: held.has("KeyW") || held.has("ArrowUp") || held.has("U"),
    run: held.has("ShiftLeft") || held.has("ShiftRight") || held.has("KeyX") || held.has("Rn"),
    leap: held.has("Space") || held.has("J"),
    pounce: held.has("KeyC") || held.has("KeyK") || held.has("Po"),
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys?: (codes: string[]) => void;
      setFidget?: (kind: "none" | "stretch" | "roll" | "tail") => void;
    };
  }
}

export function PennyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heldRef = useRef(new Set<string>());
  const fingersRef = useRef(new Map<number, string>());
  const keyFreshRef = useRef(new Map<string, number>());
  const aimRef = useRef(0);
  const armTouchAt = useRef(0);
  const gameRef = useRef<Game | null>(null);
  const artRef = useRef<ArtSet>(EMPTY_ART);
  const sfxRef = useRef(new Sfx());
  const [musicOn, setMusicOn] = useState(() => sfxRef.current.musicOn);
  const uiRef = useRef<{ screen: Screen; paused: boolean }>({ screen: "title", paused: false });
  const [screen, setScreen] = useState<Screen>("title");
  const [paused, setPaused] = useState(false);
  const [level, setLevel] = useState(0);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [save, setSave] = useState<Save>(blankSave);
  const [art, setArt] = useState<ArtSet>(EMPTY_ART);
  const savedClear = useRef(false);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  useEffect(() => {
    artRef.current = art;
  }, [art]);

  useEffect(() => {
    let cancel = false;
    void loadArt().then((next) => {
      if (!cancel) setArt(next);
    });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game();
    gameRef.current = game;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const held = heldRef.current;
    const fingers = fingersRef.current;
    const keyFresh = keyFreshRef.current;
    const aim = aimRef;

    const noteAim = (code: string) => {
      if (code === "KeyA" || code === "ArrowLeft" || code === "L") aim.current = -1;
      else if (code === "KeyD" || code === "ArrowRight" || code === "R") aim.current = 1;
    };
    const releaseMove = (code: string) => {
      held.delete(code);
      keyFresh.delete(code);
      const left = held.has("KeyA") || held.has("ArrowLeft") || held.has("L");
      const right = held.has("KeyD") || held.has("ArrowRight") || held.has("R");
      if (left && !right) aim.current = -1;
      else if (right && !left) aim.current = 1;
      else if (!left && !right) aim.current = 0;
    };

    const syncTouch = () => {
      for (const code of TOUCH_CODES) held.delete(code);
      for (const code of fingers.values()) held.add(code);
    };
    const dropStaleKeys = (now: number) => {
      for (const code of MOVE_CODES) {
        const at = keyFresh.get(code);
        if (at === undefined || !held.has(code)) continue;
        if (now - at > 4000) releaseMove(code);
      }
    };

    const onDown = (e: KeyboardEvent) => {
      const runKey = e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyX";
      if (MOVE_CODES.includes(e.code as (typeof MOVE_CODES)[number]) || runKey || e.code === "KeyC" || e.code === "KeyK") {
        e.preventDefault();
      }
      if (e.code === "Escape") {
        if (e.repeat) return;
        const ui = uiRef.current;
        if (ui.screen === "play" && game.phase === "play") {
          ui.paused = !ui.paused;
          setPaused(ui.paused);
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) {
        const steer =
          e.code === "ArrowLeft" ||
          e.code === "ArrowRight" ||
          e.code === "ArrowUp" ||
          e.code === "ArrowDown" ||
          e.code === "KeyA" ||
          e.code === "KeyD" ||
          e.code === "KeyW" ||
          e.code === "KeyS" ||
          e.code === "Space";
        if (!steer) return;
      }
      held.add(e.code);
      keyFresh.set(e.code, performance.now());
      noteAim(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta" || e.key === "Alt") {
        for (const code of MOVE_CODES) releaseMove(code);
        return;
      }
      releaseMove(e.code);
    };
    const onPointerEnd = (e: globalThis.PointerEvent) => {
      fingers.delete(e.pointerId);
      syncTouch();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        fingers.clear();
        syncTouch();
      }
    };
    const onBlur = () => {
      held.clear();
      fingers.clear();
      keyFresh.clear();
      aim.current = 0;
    };
    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pointerup", onPointerEnd, true);
    window.addEventListener("pointercancel", onPointerEnd, true);
    window.addEventListener("touchend", onTouchEnd, true);
    window.addEventListener("touchcancel", onTouchEnd, true);

    window.__controlsTest = {
      getYaw: () => (game.player.facing === -1 ? Math.PI : 0),
      getSpeed: () => game.player.vx,
      getX: () => game.player.x,
      getY: () => game.player.y,
      setKeys: (codes) => {
        held.clear();
        aim.current = 0;
        for (const code of codes) {
          held.add(code);
          if (code === "ArrowLeft" || code === "KeyA") aim.current = -1;
          if (code === "ArrowRight" || code === "KeyD") aim.current = 1;
        }
      },
      setFidget: (kind: "none" | "stretch" | "roll" | "tail") => {
        game.player.fidget = kind;
        game.player.fidgetT = 0;
        game.player.vx = 0;
        game.player.vy = 0;
        game.player.grounded = true;
      },
    };

    let last = performance.now();
    let raf = 0;
    let published = "";

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      dropStaleKeys(now);
      syncTouch();
      const ui = uiRef.current;
      const playing = ui.screen === "play" && !ui.paused && game.phase === "play";
      const input = playing ? readInput(held, aim.current) : EMPTY_INPUT;
      const active = !ui.paused;
      const next = game.frame(dt, input, active);
      for (const ev of game.events) sfxRef.current.play(ev);
      game.events.length = 0;

      const key = [
        next.levelIndex,
        next.coins,
        next.phase,
        next.big ? 1 : 0,
        Math.ceil(next.poof),
        next.banner,
        Math.ceil(next.bannerT * 4),
        next.sprinting ? 1 : 0,
        next.climbing ? 1 : 0,
        next.clinging ? 1 : 0,
        next.pounceReady ? 1 : 0,
        next.bossHits,
        next.bossMax,
      ].join("|");
      if (key !== published) {
        published = key;
        setSnap(next);
        setLevel(next.levelIndex);
      }

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW > 0 && cssH > 0) drawWorld(ctx, cssW, cssH, game, artRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerup", onPointerEnd, true);
      window.removeEventListener("pointercancel", onPointerEnd, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchEnd, true);
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    if (!snap || snap.phase !== "cleared" || savedClear.current) return;
    savedClear.current = true;
    setSave((prev) => {
      const cleared = [...prev.cleared] as Save["cleared"];
      const best = [...prev.best] as Save["best"];
      cleared[snap.levelIndex] = true;
      best[snap.levelIndex] = Math.max(best[snap.levelIndex] ?? 0, snap.coins);
      const next = { v: 1 as const, cleared, best };
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      return next;
    });
  }, [snap]);

  function setUi(next: { screen: Screen; paused: boolean }) {
    uiRef.current = next;
    setScreen(next.screen);
    setPaused(next.paused);
  }

  function start(index: number) {
    sfxRef.current.unlock();
    savedClear.current = false;
    fingersRef.current.clear();
    keyFreshRef.current.clear();
    armTouchAt.current = performance.now() + 450;
    heldRef.current.clear();
    aimRef.current = 0;
    gameRef.current?.load(index, "play");
    setLevel(index);
    setSnap(gameRef.current?.snapshot() ?? null);
    setUi({ screen: "play", paused: false });
  }

  function goTitle() {
    fingersRef.current.clear();
    keyFreshRef.current.clear();
    armTouchAt.current = performance.now() + 450;
    heldRef.current.clear();
    aimRef.current = 0;
    gameRef.current?.load(0, "attract");
    setUi({ screen: "title", paused: false });
  }

  function toggleMusic() {
    setMusicOn(sfxRef.current.toggleMusic());
  }

  const phase = snap?.phase ?? "attract";
  const showTouch = screen === "play" && !paused && phase === "play";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-cream text-ink">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {screen === "title" && (
        <div className="pointer-events-none absolute inset-0 flex items-end sm:items-center">
          <div className="pointer-events-auto m-3 max-h-[86dvh] w-full max-w-xl overflow-auto rounded-2xl bg-panel/92 p-5 shadow-lg sm:m-10 sm:p-7">
            <p className="font-sans text-xs font-extrabold tracking-widest text-sage uppercase">
              A tabby platformer
            </p>
            <h1 className="mt-1 font-display text-5xl leading-none text-ink sm:text-6xl">
              Penny's Pounce
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-ink-soft">
              Penny is silver-grey with black spots and stripes. Run the sills, pocket the fish
              coins, and don't sit on the cactus.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ginger px-5 font-sans text-base font-extrabold text-panel"
                onClick={() => start(0)}
              >
                <Play size={18} />
                Play
              </button>
              <button
                className="inline-flex h-12 items-center gap-2 rounded-full bg-cream-deep px-5 font-sans text-base font-extrabold text-ink"
                onClick={() => setUi({ screen: "levels", paused: false })}
              >
                <PawPrint size={18} />
                Choose a room
              </button>
              <button
                className="inline-flex h-12 items-center gap-2 rounded-full px-4 font-sans text-base font-extrabold text-ink"
                onClick={toggleMusic}
                aria-label={musicOn ? "Mute music" : "Play music"}
              >
                {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                Music
              </button>
            </div>
            <div className="mt-5 grid gap-1 text-sm leading-relaxed text-ink-soft">
              <p>
                <Key>A</Key> <Key>D</Key> or arrows to move. Hold <Key>Shift</Key> or <Key>X</Key> to
                sprint. <Key>W</Key> <Key>Space</Key> to jump, again in the air. <Key>C</Key> or the
                Pounce button lunges.
              </p>
              <p>
                Hold into a wall and jump to kick off. Pillows launch you. Open windows blow you
                sideways. Stomp the vacuum, mice, moths, and spiders — or pounce through the little ones.
                The last room is a dog. Wait for the stars, then pounce the jar.
              </p>
            </div>
          </div>
        </div>
      )}

      {screen === "levels" && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/30 p-4">
          <div className="max-h-[86dvh] w-full max-w-lg overflow-auto rounded-2xl bg-panel p-5 shadow-lg sm:p-6">
            <h2 className="font-display text-3xl text-ink">Choose a room</h2>
            <p className="mt-1 text-sm text-ink-soft">Three rooms, then the dog. Any order.</p>
            <div className="mt-4 grid gap-3">
              {LEVELS.map((lv, i) => (
                <button
                  key={lv.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream px-4 py-3 text-left"
                  onClick={() => start(i)}
                >
                  <span>
                    <span className="block font-display text-xl leading-tight text-ink">{lv.name}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{lv.subtitle}</span>
                  </span>
                  <span className="text-right text-xs font-extrabold text-sage">
                    {save.cleared[i] ? "Cleared" : "Open"}
                    <span className="mt-1 block text-ink-soft">Best {save.best[i]}</span>
                  </span>
                </button>
              ))}
            </div>
            <button
              className="mt-4 h-11 rounded-full px-4 font-sans font-extrabold text-ink-soft"
              onClick={() => (gameRef.current?.phase === "play" ? setUi({ screen: "play", paused: true }) : goTitle())}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {screen === "play" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-4">
            <div className="pointer-events-auto rounded-2xl bg-panel/90 px-3 py-2 shadow-sm">
              <div className="font-display text-lg leading-none">{snap?.levelName ?? LEVELS[level]?.name}</div>
              <div className="mt-1 flex items-center gap-2 font-sans text-sm font-extrabold">
                {art.coin ? (
                  <img src="/game/coin.png" alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="inline-block h-4 w-4 rounded-full bg-gold" />
                )}
                {snap?.coins ?? 0}/{snap?.total ?? 0}
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              {snap?.big && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-ginger">
                  Tuna
                </span>
              )}
              {(snap?.bossMax ?? 0) > 0 && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-ink">
                  Treats {snap?.bossHits ?? 0}/{snap?.bossMax}
                </span>
              )}
              {snap?.sprinting && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-ink">
                  Sprint
                </span>
              )}
              {snap?.climbing && !snap.clinging && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-sage">
                  Claws
                </span>
              )}
              {snap?.clinging && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-sage">
                  Wall
                </span>
              )}
              {snap && !snap.pounceReady && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-ink-soft">
                  Pounce…
                </span>
              )}
              {(snap?.poof ?? 0) > 0 && (
                <span className="rounded-full bg-panel/90 px-3 py-2 text-xs font-extrabold text-laser">
                  Hackles {Math.ceil(snap?.poof ?? 0)}
                </span>
              )}
              <IconButton label={musicOn ? "Mute music" : "Play music"} onClick={toggleMusic}>
                {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </IconButton>
              <IconButton label="Restart room" onClick={() => start(level)}>
                <RotateCcw size={18} />
              </IconButton>
              <IconButton
                label={paused ? "Resume" : "Pause"}
                onClick={() => setUi({ screen: "play", paused: !paused })}
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </IconButton>
            </div>
          </div>

          {snap && snap.bannerT > 0 && phase === "play" && (
            <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 rounded-full bg-ink/85 px-4 py-2 text-sm font-extrabold text-cream">
              {snap.banner}
            </div>
          )}

          {paused && (
            <Overlay
              title="Paused"
              body="Penny waits on the sill."
              actions={
                <>
                  <button
                    className="h-12 rounded-full bg-ginger px-5 font-sans font-extrabold text-panel"
                    onClick={() => setUi({ screen: "play", paused: false })}
                  >
                    Resume
                  </button>
                  <button
                    className="h-12 rounded-full bg-cream-deep px-5 font-sans font-extrabold text-ink"
                    onClick={() => start(level)}
                  >
                    Restart room
                  </button>
                  <button
                    className="h-12 rounded-full px-5 font-sans font-extrabold text-ink"
                    onClick={() => setUi({ screen: "levels", paused: false })}
                  >
                    Choose a room
                  </button>
                </>
              }
            />
          )}

          {phase === "dead" && (
            <Overlay
              title="Oof."
              body="Back to the last cat bed, or start the room over."
              actions={
                <>
                  <button
                    className="h-12 rounded-full bg-ginger px-5 font-sans font-extrabold text-panel"
                    onClick={() => {
                      sfxRef.current.unlock();
                      gameRef.current?.respawn();
                      setSnap(gameRef.current?.snapshot() ?? null);
                    }}
                  >
                    Continue
                  </button>
                  <button
                    className="h-12 rounded-full bg-cream-deep px-5 font-sans font-extrabold text-ink"
                    onClick={() => start(level)}
                  >
                    Restart room
                  </button>
                </>
              }
            />
          )}

          {phase === "cleared" && (
            <Overlay
              title="Room clear"
              body={`${snap?.coins ?? 0} of ${snap?.total ?? 0} fish coins.`}
              actions={
                <>
                  {level < LEVELS.length - 1 && (
                    <button
                      className="h-12 rounded-full bg-ginger px-5 font-sans font-extrabold text-panel"
                      onClick={() => start(level + 1)}
                    >
                      Next room
                    </button>
                  )}
                  <button
                    className="h-12 rounded-full bg-cream-deep px-5 font-sans font-extrabold text-ink"
                    onClick={() => setUi({ screen: "levels", paused: false })}
                  >
                    Choose a room
                  </button>
                  <button
                    className="h-12 rounded-full px-5 font-sans font-extrabold text-ink"
                    onClick={goTitle}
                  >
                    Title
                  </button>
                </>
              }
            />
          )}

          {showTouch && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-3">
              <div className="flex gap-2">
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="L"
                  label="Left"
                />
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="R"
                  label="Right"
                />
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="Rn"
                  label="Run"
                />
              </div>
              <div className="flex gap-2">
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="U"
                  label="Up"
                />
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="Dn"
                  label="Drop"
                />
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="Po"
                  label="Pounce"
                  wide
                />
                <Touch
                  held={heldRef}
                  fingers={fingersRef}
                  armAt={armTouchAt}
                  aim={aimRef}
                  code="J"
                  label="Jump"
                  wide
                />
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="mx-0.5 rounded-md border border-line bg-cream px-1.5 py-0.5 font-sans text-xs font-extrabold text-ink">
      {children}
    </kbd>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-panel/90 text-ink shadow-sm"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Overlay({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/35 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-panel p-6 text-center shadow-lg">
        <h2 className="font-display text-4xl text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

function Touch({
  held,
  fingers,
  armAt,
  aim,
  code,
  label,
  wide,
}: {
  held: RefObject<Set<string>>;
  fingers: RefObject<Map<number, string>>;
  armAt: RefObject<number>;
  aim: RefObject<number>;
  code: string;
  label: string;
  wide?: boolean;
}) {
  const sync = () => {
    const keys = held.current;
    if (!keys || !fingers.current) return;
    for (const touchCode of TOUCH_CODES) keys.delete(touchCode);
    for (const touchCode of fingers.current.values()) keys.add(touchCode);
    const left = keys.has("L");
    const right = keys.has("R");
    if (code === "L" || code === "R") {
      if (left && right) aim.current = code === "L" ? -1 : 1;
      else if (left) aim.current = -1;
      else if (right) aim.current = 1;
      else aim.current = 0;
    }
  };
  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (performance.now() < (armAt.current ?? 0)) return;
    if (!fingers.current || !held.current) return;
    e.preventDefault();
    fingers.current.set(e.pointerId, code);
    sync();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* some mobile browsers reject capture; window pointerup still releases */
    }
  };
  const release = (e: ReactPointerEvent<HTMLButtonElement>) => {
    fingers.current?.delete(e.pointerId);
    sync();
  };
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-12 touch-none items-center justify-center rounded-2xl bg-ink/80 font-sans text-xs font-extrabold text-cream select-none ${wide ? "w-16" : "w-12"}`}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {label}
    </button>
  );
}
