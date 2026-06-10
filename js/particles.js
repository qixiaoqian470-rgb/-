// 粒子引擎
// 中心粒子密且稳 → 边缘粒子疏且波 → 无硬边界 → 可拖拽旋转

let particles = [];
let canvas = null;
let ctx = null;
let rafId = null;
let rotation = 0;          // 当前旋转角度（弧度）
let targetRotation = 0;    // 目标角度（平滑过渡）

// ===== 加载图片 =====
export function loadImage(src) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const size = 300;
      const tmp = document.createElement('canvas');
      tmp.width = size; tmp.height = size;
      const tcx = tmp.getContext('2d');
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      tcx.drawImage(img, (size-w)/2, (size-h)/2, w, h);
      ok(tcx.getImageData(0, 0, size, size));
    };
    img.onerror = () => fail(new Error('图片加载失败'));
    img.src = src;
  });
}

// ===== 生成粒子 =====
export function generate(imageData, canvasW, canvasH, maxCount = 25000) {
  const { data, width, height } = imageData;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.sqrt(cx*cx + cy*cy);
  particles = [];

  const scale = Math.min(canvasW / width, canvasH / height);
  const imgW = width * scale, imgH = height * scale;
  const offsetX = (canvasW - imgW) / 2;
  const offsetY = (canvasH - imgH) / 2;
  const canvasCX = canvasW / 2, canvasCY = canvasH / 2;

  for (let i = 0; i < maxCount; i++) {
    const px = Math.floor(Math.random() * width);
    const py = Math.floor(Math.random() * height);
    const idx = (py * width + px) * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    const brightness = (r + g + b) / 3 / 255;

    // 双重过滤：亮度 + 径向距离
    const distFromCenter = Math.sqrt((px-cx)*(px-cx) + (py-cy)*(py-cy)) / maxR; // 0=中心 1=边缘
    // 中心区域保留率高，边缘保留率低 → 自然淡出无边界
    const keepChance = brightness * 1.1 * (1 - distFromCenter * 0.7);
    if (Math.random() > keepChance) continue;

    const canvasX = offsetX + px * scale;
    const canvasY = offsetY + py * scale;
    const jitter = scale * 0.5;

    // 距离画布中心的径向距离（用于后续波动计算）
    const dx = canvasX - canvasCX, dy = canvasY - canvasCY;
    const radialDist = Math.sqrt(dx*dx + dy*dy) / (canvasW/2); // 0=中心 1=边缘

    particles.push({
      x: canvasX + (Math.random()-0.5)*jitter,
      y: canvasY + (Math.random()-0.5)*jitter,
      ox: canvasX + (Math.random()-0.5)*jitter,
      oy: canvasY + (Math.random()-0.5)*jitter,
      cx: canvasCX, cy: canvasCY,   // 旋转中心
      r, g, b,
      brightness,
      radialDist: Math.max(0, radialDist), // 0中心→1边缘
      size: Math.max(0.5, scale*0.7 + Math.random()*scale),
      alpha: 0.45 + brightness*0.45,
      phase: Math.random()*Math.PI*2,
      speed: 0.05 + Math.random()*0.3,
    });
  }
  return particles;
}

// ===== Canvas =====
export function initCanvas(container, w, h) {
  canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.style.cssText = 'width:100%;height:100%;border-radius:50%;position:absolute;top:0;left:0;z-index:2;cursor:grab;';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');
  bindRotation(canvas);
}

// ===== 360° 旋转交互 =====
let dragging = false, lastX = 0, lastY = 0;
let spinVelocity = 0; // 惯性

function bindRotation(el) {
  el.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; spinVelocity = 0; el.style.cursor = 'grabbing'; });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    targetRotation += dx * 0.01;
    spinVelocity = dx * 0.01;
    lastX = e.clientX;
  });
  window.addEventListener('mouseup', () => { dragging = false; el.style.cursor = 'grab'; });

  el.addEventListener('touchstart', (e) => { dragging = true; lastX = e.touches[0].clientX; spinVelocity = 0; });
  el.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - lastX;
    targetRotation += dx * 0.01;
    spinVelocity = dx * 0.01;
    lastX = e.touches[0].clientX;
  });
  el.addEventListener('touchend', () => { dragging = false; });
}

// ===== 波动（中心稳 → 边缘波幅大） =====
function sway(x, y, time, phase, speed, radialDist) {
  const t = time * 0.001;
  // 中心几乎不动(0.5px)，边缘大幅波动(12px)
  const amp = 0.5 + radialDist * radialDist * 11.5;
  return {
    dx: Math.sin(y*0.04 + t*speed + phase)*amp*0.7 + Math.cos(x*0.03 + t*0.7*speed)*amp*0.5,
    dy: Math.cos(x*0.04 + t*speed + phase)*amp*0.7 + Math.sin(y*0.03 + t*0.7*speed)*amp*0.5,
  };
}

// ===== 旋转坐标 =====
function rotatePoint(x, y, cx, cy, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx*cos - dy*sin, y: cy + dx*sin + dy*cos };
}

// ===== 动画 =====
export function startAnim(volumeFn) {
  if (rafId) return;
  const start = performance.now();
  const loop = (now) => {
    const elapsed = now - start;
    // 平滑过渡旋转 + 惯性衰减
    if (!dragging) {
      targetRotation += spinVelocity;
      spinVelocity *= 0.95; // 惯性逐渐衰减
    }
    rotation += (targetRotation - rotation) * 0.15; // 平滑插值
    render(elapsed, volumeFn?.() || 0);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

export function stopAnim() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

function render(time, vol) {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of particles) {
    // 旋转原始位置
    const rotated = rotatePoint(p.ox, p.oy, p.cx, p.cy, rotation);
    // 叠加波动
    const s = sway(rotated.x, rotated.y, time, p.phase, p.speed, p.radialDist);
    const x = rotated.x + s.dx * (1+vol);
    const y = rotated.y + s.dy * (1+vol);

    ctx.beginPath();
    ctx.arc(x, y, p.size/2, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha})`;
    ctx.fill();
  }
}

export function destroy() {
  stopAnim();
  particles = [];
  canvas?.remove();
  canvas = null; ctx = null;
}

export function getCount() { return particles.length; }
