// 粒子引擎
// 把照片变成几千个缓缓飘动的墨点，像点彩画一样
// 核心思路：采样照片像素颜色 → 生成墨色粒子 → 用正弦波模拟自然摇摆

let particles = [];
let canvas = null;
let ctx = null;
let rafId = null;

// ===== 从图片生成粒子 =====

// 加载图片并分析像素
export function loadImage(src) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 缩放到统一尺寸分析
      const size = 200;
      const tmp = document.createElement('canvas');
      tmp.width = size; tmp.height = size;
      const tcx = tmp.getContext('2d');
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      tcx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      ok(tcx.getImageData(0, 0, size, size));
    };
    img.onerror = () => fail(new Error('图片加载失败'));
    img.src = src;
  });
}

// 把像素数据变成粒子数组
export function generate(imageData, count = 2000) {
  const { data, width, height } = imageData;
  particles = [];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const idx = (y * width + x) * 4;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];

    // 转灰度：彩色照片变成黑白浓淡
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    // 深色区域 = 浓墨大粒子，浅色区域 = 淡墨小粒子
    const darkness = 1 - gray / 255;

    particles.push({
      x, y,                          // 当前位置
      ox: x, oy: y,                  // 原始位置（飘走后要回来）
      size: 2 + darkness * 4,        // 粒子大小 2-6px
      alpha: 0.3 + darkness * 0.6,   // 透明度 0.3-0.9
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
    });
  }
  return particles;
}

// ===== 动画渲染 =====

// 初始化画布（挂到指定容器里）
export function initCanvas(container, w, h) {
  canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.style.cssText = 'width:100%;height:100%;border-radius:18px;';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');
}

// 用一个简化方式模拟"像水草一样的自然摇摆"（近似 Perlin Noise）
function sway(px, py, time, phase, speed) {
  const t = time * 0.001;
  return {
    dx: Math.sin(px * 0.05 + t * speed + phase) * 2
      + Math.cos(py * 0.03 + t * 0.7 * speed) * 1.5,
    dy: Math.cos(py * 0.05 + t * speed + phase) * 2
      + Math.sin(px * 0.03 + t * 0.7 * speed) * 1.5,
  };
}

// 开始动画
export function startAnim(volumeFn) {
  if (rafId) return;
  const start = performance.now();
  const loop = (now) => {
    render(now - start, volumeFn?.() || 0);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

// 停止动画
export function stopAnim() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// 渲染一帧
function render(time, vol) {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const boost = 1 + vol * 2;

  for (const p of particles) {
    const s = sway(p.ox, p.oy, time, p.phase, p.speed);
    const x = p.ox + s.dx * boost;
    const y = p.oy + s.dy * boost;
    const r = p.size / 2;

    // 径向渐变：中心实 → 边缘虚，墨点看起来柔和
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(0,0,0,${p.alpha})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// 销毁
export function destroy() {
  stopAnim();
  particles = [];
  canvas?.remove();
  canvas = null; ctx = null;
}

export function getCount() { return particles.length; }
