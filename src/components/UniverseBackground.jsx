import { useEffect, useRef } from 'react';

/*
  Calm night sky behind the inner pages:
  - northern lights in the full spectrum (drawn small and softened with CSS blur, so it's cheap)
  - the Milky Way and a few distant galaxies (pre-rendered once per screen size)
  - stars at three depths that twinkle and drift with the cursor (parallax)
  - a faint stardust trail behind the cursor
  - an occasional comet, and a small shooting star wherever you click
  Honors prefers-reduced-motion (one still frame) and pauses while the tab is hidden.
*/

// Each curtain sweeps through a range of hues (degrees) that slowly drifts over time,
// so together they cover the whole spectrum: red, orange, gold, green, teal, blue, indigo, violet, rose.
const AURORA_BANDS = [
  // base height (fraction of screen), amplitude, wave frequency, speed, hue start, hue range, hue drift, thickness, alpha
  { y: 0.24, amp: 0.07, freq: 1.6, speed: 0.06, hue: 150, range: 120, drift: 6, thick: 0.22, alpha: 0.5 },   // green -> blue
  { y: 0.33, amp: 0.05, freq: 2.3, speed: -0.045, hue: 260, range: 110, drift: -5, thick: 0.18, alpha: 0.42 }, // indigo -> violet -> rose
  { y: 0.18, amp: 0.045, freq: 3.1, speed: 0.08, hue: 330, range: 90, drift: 7, thick: 0.12, alpha: 0.36 },  // rose -> red -> orange
  { y: 0.40, amp: 0.035, freq: 1.2, speed: 0.03, hue: 20, range: 110, drift: 4, thick: 0.13, alpha: 0.3 },   // orange -> gold -> lime
  { y: 0.29, amp: 0.06, freq: 0.9, speed: -0.025, hue: 175, range: 60, drift: -3, thick: 0.10, alpha: 0.28 }, // teal -> sky
];


const DEPTHS = [
  { share: 0.6, size: [0.4, 0.9], shift: 6, alpha: 0.55 },
  { share: 0.3, size: [0.8, 1.4], shift: 14, alpha: 0.8 },
  { share: 0.1, size: [1.3, 2.0], shift: 26, alpha: 1 },
];

function rand(a, b) { return a + Math.random() * (b - a); }
function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }

/** Milky Way: a soft diagonal band of nebula glow, dense faint stars and darker dust lanes. */
function renderMilkyWay(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  // Band runs from lower-left to upper-right
  const x0 = -0.1 * w, y0 = 0.95 * h, x1 = 1.1 * w, y1 = 0.02 * h;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len, uy = (y1 - y0) / len;   // along the band
  const nx = -uy, ny = ux;                              // across the band
  const width = Math.min(w, h) * 0.16;
  const point = (along, across) => [x0 + ux * along + nx * across, y0 + uy * along + ny * across];

  // Nebula clouds in soft warm, blue and rose tones
  const tones = ['255, 226, 196', '170, 185, 255', '235, 170, 215', '255, 240, 220'];
  for (let i = 0; i < 160; i++) {
    const [x, y] = point(Math.random() * len, gauss() * width * 0.9);
    const r = rand(width * 0.4, width * 1.3);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = tones[i % tones.length];
    grad.addColorStop(0, `rgba(${tone}, ${rand(0.018, 0.04)})`);
    grad.addColorStop(1, `rgba(${tone}, 0)`);
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // Dense, faint stars concentrated toward the centre line
  const count = Math.round((w * h) / 520);
  for (let i = 0; i < count; i++) {
    const [x, y] = point(Math.random() * len, gauss() * width * 0.8);
    g.fillStyle = `rgba(240, 236, 255, ${rand(0.12, 0.55)})`;
    g.fillRect(x, y, rand(0.4, 1.1), rand(0.4, 1.1));
  }
  // Dust lanes: soft dark patches slightly off the centre line
  for (let i = 0; i < 70; i++) {
    const [x, y] = point(Math.random() * len, gauss() * width * 0.25 + width * 0.08);
    const r = rand(width * 0.15, width * 0.45);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(5, 8, 18, 0.35)');
    grad.addColorStop(1, 'rgba(5, 8, 18, 0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return c;
}

/** A distant spiral (arms > 0) or oval (arms = 0) galaxy, drawn once into a sprite. */
function renderGalaxy(size, arms, coreRgb, armRgb) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const m = size / 2;
  const halo = g.createRadialGradient(m, m, 0, m, m, m);
  halo.addColorStop(0, `rgba(${armRgb}, 0.22)`);
  halo.addColorStop(1, `rgba(${armRgb}, 0)`);
  g.fillStyle = halo; g.fillRect(0, 0, size, size);
  const stars = arms ? 1600 : 900;
  for (let i = 0; i < stars; i++) {
    const t = Math.pow(Math.random(), 0.8);
    const r = t * m * 0.92;
    let angle;
    if (arms) {
      const arm = i % arms;
      angle = (arm / arms) * Math.PI * 2 + t * 4.2 + gauss() * 0.28;
    } else {
      angle = Math.random() * Math.PI * 2;
    }
    const x = m + Math.cos(angle) * r + gauss() * size * 0.012;
    const y = m + Math.sin(angle) * r + gauss() * size * 0.012;
    const warm = t < 0.35;
    g.fillStyle = `rgba(${warm ? coreRgb : armRgb}, ${(1 - t) * 0.7 + 0.08})`;
    g.fillRect(x, y, 1, 1);
  }
  const core = g.createRadialGradient(m, m, 0, m, m, m * 0.28);
  core.addColorStop(0, 'rgba(255, 248, 232, 0.95)');
  core.addColorStop(0.4, `rgba(${coreRgb}, 0.45)`);
  core.addColorStop(1, `rgba(${coreRgb}, 0)`);
  g.fillStyle = core;
  g.beginPath(); g.arc(m, m, m * 0.28, 0, Math.PI * 2); g.fill();
  return c;
}

export default function UniverseBackground() {
  const auroraRef = useRef(null);
  const skyRef = useRef(null);

  useEffect(() => {
    const auroraCanvas = auroraRef.current;
    const skyCanvas = skyRef.current;
    const actx = auroraCanvas.getContext('2d');
    const sctx = skyCanvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1;
    let stars = [];
    let milkyWay = null;
    let galaxies = [];
    const dust = [];
    const comets = [];
    // Cursor, eased so everything follows it softly
    const pointer = { x: 0.5, y: 0.35, tx: 0.5, ty: 0.35, px: null, py: null, active: false };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      skyCanvas.width = w * dpr;
      skyCanvas.height = h * dpr;
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Aurora is drawn at a quarter size and blurred by CSS when scaled up
      auroraCanvas.width = Math.ceil(w / 4);
      auroraCanvas.height = Math.ceil(h / 4);
      milkyWay = renderMilkyWay(w, h);
      const scale = Math.max(0.6, Math.min(1.2, Math.min(w, h) / 850));
      galaxies = [
        { sprite: renderGalaxy(Math.round(200 * scale), 2, '255, 214, 170', '170, 190, 255'), x: 0.84, y: 0.2, tilt: 0.45, rot: rand(0, 6), spin: 0.004, shift: 3 },
        { sprite: renderGalaxy(Math.round(120 * scale), 3, '255, 200, 220', '200, 170, 255'), x: 0.1, y: 0.62, tilt: 0.7, rot: rand(0, 6), spin: -0.006, shift: 4 },
        { sprite: renderGalaxy(Math.round(90 * scale), 0, '255, 236, 200', '230, 220, 255'), x: 0.58, y: 0.86, tilt: 0.5, rot: 0.6, spin: 0, shift: 2 },
      ];
      const count = Math.round((w * h) / 3800);
      stars = [];
      DEPTHS.forEach((d, depth) => {
        for (let i = 0; i < count * d.share; i++) {
          stars.push({ x: Math.random() * w, y: Math.random() * h, r: rand(d.size[0], d.size[1]), depth, phase: Math.random() * Math.PI * 2, speed: rand(0.4, 1.4), warm: Math.random() < 0.12 });
        }
      });
    };

    const spawnComet = (x, y, fromClick) => {
      const angle = fromClick ? rand(0.35, 0.65) : rand(0.25, 0.5); // heading down-right
      const speed = fromClick ? rand(5, 7) : rand(4, 6);
      comets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, trail: [] });
    };

    const drawAurora = (t) => {
      const aw = auroraCanvas.width, ah = auroraCanvas.height;
      actx.clearRect(0, 0, aw, ah);
      actx.globalCompositeOperation = 'lighter';
      const sway = (pointer.x - 0.5) * 0.6; // curtains lean toward the cursor
      AURORA_BANDS.forEach((b, i) => {
        const top = [];
        for (let x = 0; x <= aw; x += 3) {
          const u = x / aw;
          const wave = Math.sin(u * b.freq * Math.PI * 2 + t * b.speed * 6 + i + sway)
            + 0.5 * Math.sin(u * b.freq * 4.7 + t * b.speed * 9 - i);
          top.push([x, (b.y + wave * b.amp) * ah]);
        }
        const thick = b.thick * ah;
        // Brighter where the cursor is
        const glowX = pointer.x * aw;
        top.forEach(([x, y]) => {
          const near = pointer.active ? Math.max(0, 1 - Math.abs(x - glowX) / (aw * 0.25)) : 0;
          const shimmer = 0.75 + 0.25 * Math.sin(x * 0.08 + t * 1.3 + i * 2);
          const a = b.alpha * shimmer * (1 + near * 0.6);
          // Hue flows along the curtain and drifts slowly over time
          const hue = (b.hue + (x / aw) * b.range + t * b.drift + 360) % 360;
          const headColor = `hsla(${hue}, 78%, 64%, `;
          const tailColor = `hsla(${(hue + 25) % 360}, 70%, 55%, `;
          const g = actx.createLinearGradient(0, y, 0, y + thick);
          g.addColorStop(0, `${headColor}0)`);
          g.addColorStop(0.15, `${headColor}${a})`);
          g.addColorStop(0.6, `${tailColor}${a * 0.45})`);
          g.addColorStop(1, `${tailColor}0)`);
          actx.fillStyle = g;
          actx.fillRect(x, y, 3, thick);
        });
      });
      actx.globalCompositeOperation = 'source-over';
    };

    const drawSky = (t) => {
      sctx.clearRect(0, 0, w, h);
      const ox = (pointer.x - 0.5);
      const oy = (pointer.y - 0.5);
      const cx = pointer.x * w, cy = pointer.y * h;

      // Deepest layer: the Milky Way barely moves with the cursor and breathes very slowly
      if (milkyWay) {
        sctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.15);
        sctx.drawImage(milkyWay, -ox * 3, -oy * 3, w, h);
        sctx.globalAlpha = 1;
      }
      // Distant galaxies: almost imperceptible rotation, a little brighter when the cursor is near
      for (const gx of galaxies) {
        const size = gx.sprite.width;
        const x = gx.x * w - ox * gx.shift;
        const y = gx.y * h - oy * gx.shift;
        const near = pointer.active ? Math.max(0, 1 - Math.hypot(x - cx, y - cy) / (size * 1.5)) : 0;
        sctx.save();
        sctx.translate(x, y);
        sctx.rotate(gx.rot + t * gx.spin);
        sctx.scale(1, gx.tilt);
        sctx.globalAlpha = 0.6 + near * 0.4;
        sctx.globalCompositeOperation = 'lighter';
        sctx.drawImage(gx.sprite, -size / 2, -size / 2);
        sctx.restore();
      }

      // Stars with parallax and twinkle; the ones near the cursor glow a little
      for (const s of stars) {
        const d = DEPTHS[s.depth];
        const x = s.x - ox * d.shift;
        const y = s.y - oy * d.shift;
        const twinkle = 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        let near = 0;
        if (pointer.active) {
          const dist = Math.hypot(x - cx, y - cy);
          near = Math.max(0, 1 - dist / 140);
        }
        const a = Math.min(1, d.alpha * twinkle + near * 0.6);
        const r = s.r * (1 + near * 0.8);
        sctx.fillStyle = s.warm ? `rgba(255, 226, 180, ${a})` : `rgba(235, 240, 255, ${a})`;
        sctx.beginPath(); sctx.arc(x, y, r, 0, Math.PI * 2); sctx.fill();
        if (near > 0.35 || (s.depth === 2 && twinkle > 0.92)) {
          const g = sctx.createRadialGradient(x, y, 0, x, y, r * 6);
          g.addColorStop(0, `rgba(255, 240, 210, ${0.35 * Math.max(near, 0.4)})`);
          g.addColorStop(1, 'rgba(255, 240, 210, 0)');
          sctx.fillStyle = g;
          sctx.beginPath(); sctx.arc(x, y, r * 6, 0, Math.PI * 2); sctx.fill();
        }
      }

      // Stardust behind the cursor
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) { dust.splice(i, 1); continue; }
        sctx.fillStyle = `rgba(255, 232, 190, ${p.life * 0.7})`;
        sctx.beginPath(); sctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); sctx.fill();
      }

      // Comets with soft tails
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.trail.push([c.x, c.y]);
        if (c.trail.length > 28) c.trail.shift();
        c.x += c.vx; c.y += c.vy;
        c.life -= 0.006;
        if (c.life <= 0 || c.x > w + 80 || c.y > h + 80) { comets.splice(i, 1); continue; }
        for (let k = 1; k < c.trail.length; k++) {
          const [x1, y1] = c.trail[k - 1];
          const [x2, y2] = c.trail[k];
          const f = k / c.trail.length;
          sctx.strokeStyle = `rgba(255, 236, 200, ${f * 0.55 * c.life})`;
          sctx.lineWidth = f * 2.2;
          sctx.beginPath(); sctx.moveTo(x1, y1); sctx.lineTo(x2, y2); sctx.stroke();
        }
        const g = sctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 10);
        g.addColorStop(0, `rgba(255, 248, 230, ${c.life})`);
        g.addColorStop(1, 'rgba(255, 248, 230, 0)');
        sctx.fillStyle = g;
        sctx.beginPath(); sctx.arc(c.x, c.y, 10, 0, Math.PI * 2); sctx.fill();
      }
    };

    resize();

    if (reduce) {
      drawAurora(8);
      drawSky(8);
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }

    const onMove = (e) => {
      pointer.tx = e.clientX / w;
      pointer.ty = e.clientY / h;
      pointer.active = true;
      if (pointer.px !== null && e.pointerType === 'mouse') {
        const moved = Math.hypot(e.clientX - pointer.px, e.clientY - pointer.py);
        if (moved > 6 && dust.length < 120) {
          dust.push({ x: e.clientX, y: e.clientY, vx: rand(-0.3, 0.3), vy: rand(-0.4, 0.1), r: rand(0.8, 1.8), life: 1 });
        }
      }
      pointer.px = e.clientX; pointer.py = e.clientY;
    };
    const onLeave = () => { pointer.active = false; };
    const onDown = (e) => { if (comets.length < 4) spawnComet(e.clientX - 60, e.clientY - 40, true); };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', resize);

    let raf;
    let last = performance.now();
    let nextComet = performance.now() + rand(4000, 9000);
    const frame = (now) => {
      const t = now / 1000;
      // ease toward the cursor
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      if (now > nextComet) {
        spawnComet(rand(-0.1, 0.6) * w, rand(-0.05, 0.3) * h, false);
        nextComet = now + rand(9000, 18000);
      }
      // the aurora changes slowly, so 30fps is plenty
      if (now - last > 33) { drawAurora(t); last = now; }
      drawSky(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="universe" aria-hidden="true">
      <canvas ref={auroraRef} className="universe-aurora" />
      <canvas ref={skyRef} className="universe-sky" />
      <div className="universe-horizon" />
    </div>
  );
}
