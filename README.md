# Penny's Pounce

A browser platformer. You play Penny, a silver-grey tabby with black spots and stripes, in a sunlit apartment.

## Run

```bash
npm install
npm run dev
```

The game is served at `http://127.0.0.1:8080`. `npm run typecheck` checks the TypeScript.

## Controls

- Move: A D or the arrow keys. On-screen Left / Right buttons work too.
- Sprint: hold Shift or X, or the Run button. Do not bind sprint to Control. Control swallows the direction keys.
- Jump: W or Space, again in the air.
- Pounce: C, K, or the Pounce button.
- Climb: hold Up on a curtain.

## Where the game lives

| Path | What |
| --- | --- |
| `src/components/PennyGame.tsx` | Screen, keyboard, touch buttons |
| `src/game/sim.ts` | Physics, pounce, enemies, the dog boss, fidget timing |
| `src/game/render.ts` | Canvas drawing and which sprite frame plays |
| `src/game/levels.ts` | Rooms |
| `src/game/assets.ts` | Sprite sheet layout |
| `public/game/` | Sheets, props, music |

## Animation rules

Sprite sheets are 4 columns by 3 rows, 12 frames, each cell 256×256. Feet sit 8px above the bottom of the cell. Every frame is scaled to about 168px tall.

Idle does not cycle. The twelve idle cells are the same drawing on purpose. Cycling different paintings reads as a glitch. `drawPenny` holds frame 0 while she stands.

The run cycle advances one frame per stride (`player.anim` in `sim.ts`). Do not blend two frames with alpha. The sheets are not in-betweens of one model, and a crossfade draws two cats at once.

Fidgets (stretch, tail, roll) play straight through, one frame at a time, and finish unless the player moves or jumps. Frames that collapsed to a flat strip were replaced with the previous good pose.

`window.__pose` reports the current animation key and frame while the game is running. `window.__controlsTest.setKeys` and `setFidget` drive it from a test.
