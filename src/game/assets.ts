export type Sheet = {
  img: HTMLImageElement;
  cols: number;
  rows: number;
  frames: number;
};

export type ArtSet = {
  sky: HTMLImageElement | null;
  food: HTMLImageElement | null;
  laser: HTMLImageElement | null;
  coin: HTMLImageElement | null;
  flag: HTMLImageElement | null;
  cactus: HTMLImageElement | null;
  bed: HTMLImageElement | null;
  roomba: HTMLImageElement | null;
  idle: Sheet | null;
  run: Sheet | null;
  jump: Sheet | null;
  poof: Sheet | null;
  poofRun: Sheet | null;
  stretch: Sheet | null;
  tail: Sheet | null;
  roll: Sheet | null;
  climb: Sheet | null;
};

export const EMPTY_ART: ArtSet = {
  sky: null,
  food: null,
  laser: null,
  coin: null,
  flag: null,
  cactus: null,
  bed: null,
  roomba: null,
  idle: null,
  run: null,
  jump: null,
  poof: null,
  poofRun: null,
  stretch: null,
  tail: null,
  roll: null,
  climb: null,
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSheet(src: string, cols: number, rows: number, frames: number): Promise<Sheet | null> {
  const img = await loadImage(src);
  if (!img) return null;
  return { img, cols, rows, frames };
}

export async function loadArt(): Promise<ArtSet> {
  const [sky, food, laser, coin, flag, cactus, bed, roomba, idle, run, jump, poof, poofRun, stretch, tail, roll, climb] =
    await Promise.all([
      loadImage("/game/sky.jpg"),
      loadImage("/game/food.png"),
      loadImage("/game/laser.png"),
      loadImage("/game/coin.png"),
      loadImage("/game/flag.png"),
      loadImage("/game/cactus.png"),
      loadImage("/game/bed.png"),
      loadImage("/game/roomba.png"),
      loadSheet("/game/penny-idle.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-run.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-jump.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-poof.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-poof-run.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-stretch.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-tail.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-roll.png?v=6", 4, 3, 12),
      loadSheet("/game/penny-climb.png?v=6", 4, 3, 12),
    ]);
  return { sky, food, laser, coin, flag, cactus, bed, roomba, idle, run, jump, poof, poofRun, stretch, tail, roll, climb };
}
