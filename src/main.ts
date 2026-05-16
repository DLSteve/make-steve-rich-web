import './style.css';

// ── Rotating Earth dot-cloud animation ──────────────────────────────────────

const TARGET_LAND_DOTS = 15000;
const ROTATION_SPEED = 0.0015;
const TILT_X = 0.38;
const MAX_EVENTS = 5;
const EVENT_INTERVAL_MS = 2200;

const STEVE_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'NYC',         lat: 40.71,  lng: -74.00 },
  { name: 'London',      lat: 51.51,  lng: -0.13  },
  { name: 'Tokyo',       lat: 35.68,  lng: 139.69 },
  { name: 'Sydney',      lat: -33.87, lng: 151.21 },
  { name: 'São Paulo',   lat: -23.55, lng: -46.63 },
  { name: 'Mumbai',      lat: 19.08,  lng: 72.88  },
  { name: 'Dubai',       lat: 25.20,  lng: 55.27  },
  { name: 'Cairo',       lat: 30.04,  lng: 31.24  },
  { name: 'Singapore',   lat: 1.35,   lng: 103.82 },
  { name: 'Toronto',     lat: 43.65,  lng: -79.38 },
  { name: 'Berlin',      lat: 52.52,  lng: 13.40  },
  { name: 'Lagos',       lat: 6.52,   lng: 3.38   },
  { name: 'Seoul',       lat: 37.57,  lng: 126.98 },
  { name: 'Mexico City', lat: 19.43,  lng: -99.13 },
  { name: 'LA',          lat: 34.05,  lng: -118.24 },
  { name: 'Chicago',     lat: 41.88,  lng: -87.63 },
  { name: 'Paris',       lat: 48.86,  lng: 2.35   },
  { name: 'Auckland',    lat: -36.85, lng: 174.76 },
];

const AMOUNTS = [500, 750, 1200, 2500, 3200, 5000, 7500, 10000, 1800, 4200];

function rotY(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function rotX(x: number, y: number, z: number, a: number): [number, number, number] {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function isLand(r: number, g: number, b: number): boolean {
  const isBlueDominant = b > r + 15 && b > g + 5;
  if (isBlueDominant) return false;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luminance < 60) return true;
  if (luminance > 230) return true;
  return true;
}

let landDots: Float32Array = new Float32Array(0);

async function loadAndProcessLandMask(): Promise<void> {
  const img = new Image();
  img.src = '/world-mask.jpg';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load world-mask.jpg'));
  });

  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const offscreen = document.createElement('canvas');
  offscreen.width = W;
  offscreen.height = H;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) throw new Error('Could not get 2D context for offscreen canvas');

  offCtx.drawImage(img, 0, 0, W, H);
  const imageData = offCtx.getImageData(0, 0, W, H);
  const data = imageData.data;

  let landPixelCount = 0;
  const totalPixels = W * H;
  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    if (isLand(r, g, b)) landPixelCount++;
  }
  console.log(`[globe] land fraction: ${(landPixelCount / totalPixels).toFixed(3)}`);

  const dots = new Float32Array(TARGET_LAND_DOTS * 3);
  let kept = 0;
  let attempts = 0;
  const MAX_ATTEMPTS = TARGET_LAND_DOTS * 8;

  while (kept < TARGET_LAND_DOTS && attempts < MAX_ATTEMPTS) {
    attempts++;
    const u = Math.random();
    const v = Math.random();
    const lat = Math.asin(2 * u - 1);
    const lng = 2 * Math.PI * v - Math.PI;

    const px = Math.min(Math.floor((lng + Math.PI) / (2 * Math.PI) * W), W - 1);
    const py = Math.min(Math.floor((Math.PI / 2 - lat) / Math.PI * H), H - 1);
    const idx = (py * W + px) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    if (!isLand(r, g, b)) continue;

    const cx = Math.cos(lat) * Math.cos(lng);
    const cy = Math.sin(lat);
    const cz = Math.cos(lat) * Math.sin(lng);

    const [tx, ty, tz] = rotX(cx, cy, cz, TILT_X);
    dots[kept * 3]     = tx;
    dots[kept * 3 + 1] = ty;
    dots[kept * 3 + 2] = tz;
    kept++;
  }

  console.log(`[globe] kept ${kept} dots from ${attempts} attempts (ratio: ${(kept / attempts).toFixed(3)})`);
  landDots = dots.slice(0, kept * 3);
}

function globeMetrics(cssW: number, cssH: number): { radius: number; cx: number; cy: number } {
  const radius = Math.min(cssW, cssH) * 0.44;
  const cx = cssW >= 900 ? cssW * 0.62 : cssW * 0.5;
  const cy = cssH * 0.5;
  return { radius, cx, cy };
}

const colorCache = new Map<number, string>();

function dotColor(rz: number, alpha: number): string {
  const zBucket = Math.round(rz * 8);
  const aBucket = Math.round(alpha * 16);
  const key = zBucket * 100 + aBucket;
  const cached = colorCache.get(key);
  if (cached !== undefined) return cached;

  const t = (rz + 1) / 2;
  const r = Math.round(5   + (124 - 5)   * (1 - t));
  const g = Math.round(112 + (92  - 112) * (1 - t));
  const b = Math.round(222 + (252 - 222) * (1 - t));
  const result = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
  colorCache.set(key, result);
  return result;
}

interface SteveEvent {
  tx: number;
  ty: number;
  tz: number;
  amount: number;
  city: string;
  startTime: number;
  duration: number;
}

let events: SteveEvent[] = [];

function spawnEvent(now: number): void {
  if (events.length >= MAX_EVENTS) events.shift();
  const city = STEVE_CITIES[Math.floor(Math.random() * STEVE_CITIES.length)];
  const lat = city.lat * Math.PI / 180;
  const lng = city.lng * Math.PI / 180;
  const cx = Math.cos(lat) * Math.cos(lng);
  const cy = Math.sin(lat);
  const cz = Math.cos(lat) * Math.sin(lng);
  const [tx, ty, tz] = rotX(cx, cy, cz, TILT_X);
  events.push({
    tx, ty, tz,
    amount: AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)],
    city: city.name,
    startTime: now,
    duration: 4200,
  });
}

async function initHeroCanvas(): Promise<void> {
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas!.width  = canvas!.offsetWidth  * dpr;
    canvas!.height = canvas!.offsetHeight * dpr;
    ctx!.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  await loadAndProcessLandMask();

  function drawFrame(now: number, rotAngle: number): void {
    const cssW = canvas!.offsetWidth;
    const cssH = canvas!.offsetHeight;
    const { radius, cx, cy } = globeMetrics(cssW, cssH);
    const dotCount = landDots.length / 3;

    ctx!.clearRect(0, 0, cssW, cssH);
    ctx!.globalCompositeOperation = 'source-over';

    for (let i = 0; i < dotCount; i++) {
      const bx = landDots[i * 3];
      const by = landDots[i * 3 + 1];
      const bz = landDots[i * 3 + 2];
      const [rx, ry, rz] = rotY(bx, by, bz, rotAngle);
      if (rz < -0.05) continue;

      const sx = cx + rx * radius;
      const sy = cy - ry * radius;
      const alpha = Math.max(0, rz * 1.1 + 0.05);
      const dotR = 0.4 + rz * 0.5;

      ctx!.fillStyle = dotColor(rz, alpha * 0.75);
      ctx!.fillRect(sx - dotR, sy - dotR, dotR * 2, dotR * 2);
    }

    const visibleEvents: Array<{ ex: number; ey: number; e: SteveEvent; progress: number }> = [];
    for (const e of events) {
      const progress = (now - e.startTime) / e.duration;
      if (progress >= 1) continue;
      const [rx, ry, rz] = rotY(e.tx, e.ty, e.tz, rotAngle);
      if (rz < 0.1) continue;
      const ex = cx + rx * radius;
      const ey = cy - ry * radius;
      visibleEvents.push({ ex, ey, e, progress });
    }

    for (let a = 0; a < visibleEvents.length; a++) {
      for (let b = a + 1; b < visibleEvents.length; b++) {
        const { ex: ax, ey: ay } = visibleEvents[a];
        const { ex: bx2, ey: by2 } = visibleEvents[b];
        const mx = (ax + bx2) / 2;
        const my = (ay + by2) / 2 - Math.hypot(bx2 - ax, by2 - ay) * 0.25;
        ctx!.beginPath();
        ctx!.moveTo(ax, ay);
        ctx!.quadraticCurveTo(mx, my, bx2, by2);
        ctx!.strokeStyle = 'rgba(255, 99, 71, 0.35)';
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }
    }

    for (const { ex, ey, e, progress } of visibleEvents) {
      const ringRadius = 4 + progress * 22;
      const ringAlpha = (1 - progress) * 0.7;
      ctx!.beginPath();
      ctx!.arc(ex, ey, ringRadius, 0, Math.PI * 2);
      ctx!.strokeStyle = `rgba(5, 112, 222, ${ringAlpha})`;
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      const ring2 = 4 + progress * 14;
      ctx!.beginPath();
      ctx!.arc(ex, ey, ring2, 0, Math.PI * 2);
      ctx!.strokeStyle = `rgba(124, 92, 252, ${ringAlpha * 0.6})`;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx!.fillStyle = '#0570DE';
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(ex, ey, 1.8, 0, Math.PI * 2);
      ctx!.fillStyle = '#ffffff';
      ctx!.fill();

      const labelAlpha = progress < 0.15
        ? progress / 0.15
        : progress > 0.75
          ? (1 - progress) / 0.25
          : 1;

      const label = `Steve, ${e.city}  +$${e.amount.toLocaleString()}`;
      ctx!.font = '500 11px "Source Sans 3", sans-serif';
      const textW = ctx!.measureText(label).width;
      const padX = 8;
      const pillW = textW + padX * 2;
      const pillH = 20;
      const pillX = ex + 10;
      const pillY = ey - pillH / 2;

      ctx!.fillStyle = `rgba(255,255,255,${labelAlpha * 0.92})`;
      ctx!.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(pillX, pillY, pillW, pillH, 10);
      ctx!.fill();

      ctx!.strokeStyle = `rgba(5,112,222,${labelAlpha * 0.4})`;
      ctx!.lineWidth = 0.8;
      ctx!.stroke();

      ctx!.fillStyle = `rgba(10,37,64,${labelAlpha})`;
      ctx!.fillText(label, pillX + padX, pillY + pillH / 2 + 4);
    }

    ctx!.globalCompositeOperation = 'source-over';
    const vig = ctx!.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * 1.1);
    vig.addColorStop(0, 'rgba(255,255,255,0)');
    vig.addColorStop(1, 'rgba(255,255,255,0.92)');
    ctx!.fillStyle = vig;
    ctx!.fillRect(0, 0, cssW, cssH);
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    drawFrame(0, 0);
    return;
  }

  let rotAngle = 0;
  let lastTime = 0;
  let lastEventTime = 0;

  function loop(now: number): void {
    if (now - lastTime < 16) {
      requestAnimationFrame(loop);
      return;
    }
    lastTime = now;

    if (now - lastEventTime > EVENT_INTERVAL_MS) {
      spawnEvent(now);
      lastEventTime = now;
    }
    events = events.filter(e => now - e.startTime < e.duration);

    rotAngle += ROTATION_SPEED;

    drawFrame(now, rotAngle);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// ── Donation ticker ──────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRandomIncrement(): number {
  return Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
}

function getRandomInterval(): number {
  return Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
}

function initDonationTicker(): void {
  const tickerEl = document.getElementById('donation-ticker');
  if (!tickerEl) return;

  let currentAmount = 4_782_341;
  tickerEl.textContent = formatCurrency(currentAmount);

  function tick(): void {
    currentAmount += getRandomIncrement();
    tickerEl!.classList.add('scale-110', 'text-[#2E9E6B]');

    requestAnimationFrame(() => {
      tickerEl!.textContent = formatCurrency(currentAmount);

      setTimeout(() => {
        tickerEl!.classList.remove('scale-110', 'text-[#2E9E6B]');
      }, 600);
    });

    setTimeout(tick, getRandomInterval());
  }

  setTimeout(tick, getRandomInterval());
}

function initSmoothScroll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const href = anchor.getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initDonationTicker();
  initSmoothScroll();
});
