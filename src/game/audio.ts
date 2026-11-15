export class Sfx {
  private ctx: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  musicOn: boolean;

  constructor() {
    try {
      this.musicOn = localStorage.getItem("pennys-pounce-music") !== "0";
    } catch {
      this.musicOn = true;
    }
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.startMusic();
  }

  startMusic() {
    if (!this.musicOn) return;
    if (!this.music) {
      const track = new Audio("/game/morning-pounce.m4a");
      track.loop = true;
      track.preload = "auto";
      track.volume = 0.38;
      this.music = track;
    }
    if (this.music.paused) void this.music.play().catch(() => {});
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    try {
      localStorage.setItem("pennys-pounce-music", this.musicOn ? "1" : "0");
    } catch {
      /* ignore private mode */
    }
    if (this.musicOn) this.unlock();
    else this.music?.pause();
    return this.musicOn;
  }

  play(event: string) {
    this.unlock();
    switch (event) {
      case "jump":
        this.meow(1.15, 0.16, 0.05);
        break;
      case "double":
        this.meow(1.45, 0.14, 0.05);
        break;
      case "coin":
        this.beep(880, 0.06, "square", 0.04);
        this.beep(1320, 0.08, "square", 0.035);
        break;
      case "food":
        this.meow(0.9, 0.32, 0.06);
        this.beep(659, 0.09, "triangle", 0.04);
        this.beep(784, 0.12, "triangle", 0.04);
        break;
      case "laser":
        this.hiss(0.18, 0.05);
        this.beep(988, 0.08, "triangle", 0.035);
        break;
      case "hurt":
        this.hiss(0.28, 0.07);
        break;
      case "die":
        this.meow(0.62, 0.42, 0.06);
        break;
      case "checkpoint":
        this.meow(1.35, 0.12, 0.04);
        this.beep(830, 0.1, "triangle", 0.03);
        break;
      case "win":
        this.meow(1.05, 0.34, 0.06);
        this.beep(784, 0.1, "triangle", 0.04);
        this.beep(1046, 0.18, "triangle", 0.045);
        break;
      case "bounce":
        this.meow(1.6, 0.1, 0.045);
        break;
      case "pounce":
        this.noise(0.06, 0.05, 1800, 1.2);
        this.meow(1.7, 0.08, 0.04);
        break;
      case "wall":
        this.noise(0.05, 0.04, 1100, 0.8);
        this.meow(1.35, 0.09, 0.04);
        break;
      case "meow":
        this.meow(1, 0.3, 0.055);
        break;
      case "mrrp":
        this.meow(1.55, 0.12, 0.04);
        break;
      case "purr":
        this.purr();
        break;
      case "hiss":
        this.hiss(0.22, 0.06);
        break;
      case "scuttle":
        this.noise(0.045, 0.035, 1400, 1.4);
        break;
      case "scuttle-fast":
        this.noise(0.03, 0.04, 2100, 1.8);
        break;
      case "scratch":
        this.noise(0.07, 0.04, 900, 0.7);
        break;
      case "grab":
        this.noise(0.08, 0.045, 700, 0.6);
        this.meow(1.4, 0.1, 0.035);
        break;
      case "bark":
        this.beep(140, 0.12, "sawtooth", 0.05, -40);
        this.noise(0.1, 0.05, 400, 0.8);
        break;
      case "thud":
        this.noise(0.12, 0.07, 180, 0.5);
        this.beep(90, 0.08, "sine", 0.06);
        break;
      case "clink":
        this.beep(1320, 0.06, "square", 0.035);
        this.beep(1760, 0.09, "triangle", 0.03);
        break;
      default:
        break;
    }
  }

  private beep(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private meow(pitch: number, dur: number, gain: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    const a = 720 * pitch;
    const b = 380 * pitch;
    const c = 540 * pitch;
    o.frequency.setValueAtTime(a, t);
    o.frequency.linearRampToValueAtTime(b, t + dur * 0.42);
    o.frequency.linearRampToValueAtTime(c, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private purr() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(32, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.57);
    this.noise(0.5, 0.02, 180, 0.5);
  }

  private hiss(dur: number, gain: number) {
    this.noise(dur, gain, 3200, 0.45);
  }

  private noise(dur: number, gain: number, freq: number, q: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
}
