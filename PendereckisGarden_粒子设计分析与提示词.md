# Penderecki's Garden —— 粒子系统深度分析与设计提示词

> 基于 Huncwot 摄影测量点云 WebGL 纪念项目 | Awwwards SOTD 获奖作品
> 项目地址：https://pendereckisgarden.pl/en

---

## 一、项目概述

| 维度 | 详情 |
|------|------|
| **项目名称** | Penderecki's Garden（潘德列茨基的花园） |
| **开发团队** | Huncwot（波兰华沙创意机构，Awwwards Pro） |
| **委托方** | 亚当·密茨凯维奇研究所（Adam Mickiewicz Institute） |
| **纪念对象** | Krzysztof Penderecki（20世纪最伟大的作曲家之一 + 狂热园艺家） |
| **核心技术栈** | Three.js · TypeScript · GSAP · 自定义 GLSL 着色器 · Web Audio API |
| **数据来源** | 无人机航拍 + 摄影测量（Photogrammetry）→ 数十亿粒子点云 |
| **上线时间** | 2026年3月（Awwwards SOTD：2021年4月，持续更新迭代） |
| **开发周期** | 约 6 个月 |
| **Awwwards 评分** | 综合 7.56/10（创意性 7.97 最高） |

---

## 二、粒子系统深度分析

### 2.1 数据管线

```
无人机航拍 → 摄影测量(Photogrammetry) → 数十亿粒子点云(PCD格式)
                                                    ↓
                                             gzip 压缩（耗时数月）
                                                    ↓
                                           浏览器可实时渲染的高密度点云
```

**关键特征**：
- 原始粒子量级：**数十亿**（billions）
- 压缩目标：浏览器 60fps 流式渲染
- 存储格式：PCD（Point Cloud Data）+ gzip 压缩
- 真实扫描：20 公顷庄园，1500+ 种树种，迷宫 15,000 棵角树

### 2.2 粒子视觉特征

#### 色彩体系（从 Awwwards 提取的官方配色）
```
⬛ 黑色背景：   #000000   — 深空/虚无画布
🔵 深蓝强调：   #2779a7   — 冰冷、克制、音乐感
🩵 青绿生命：   #49c5b6   — 植物/自然/生机
```

**设计意图**：
- **极简三色**（black + deep blue + teal）—— 用极少的颜色制造极高的辨识度
- 黑色背景 = 宇宙般的虚无，让粒子"漂浮"其中
- 深蓝 = 夜晚、深远、古典音乐的沉静
- 青绿 = 植物、生命、花园的本质

**粒子本身的颜色**：
- 粒子颜色来源于真实摄影测量数据——树木是自然的绿/棕，路径是泥土色
- 但在深色背景下，所有颜色都被压制为**暗色调**，整体呈"沉入夜色"的效果
- 「工作室」章节中，粒子会随音乐旋律**实时改变颜色和形态**

#### 排列与形态
```
┌────────────────────────────────────────────┐
│                                            │
│     ·  ·   ··   ··  ·   ·   ··   ·        │  ← 树冠：粒子密集区
│       ·  ···  ····  ··  ···  ····   ·     │     粒子数量高、颜色偏绿
│     ··  ···  ···  ··  ···  ···  ··  ·    │
│       │    │     │    │     │    │         │  ← 树干/路径：粒子稀疏区
│       │    │     │    │     │    │         │     粒子呈线性排列
│    ───┴────┴─────┴────┴─────┴────┴───      │  ← 地面：粒子水平分布
│                                            │
│              ✦ 交互热点（发光标记）           │  ← SVG 纹理烘焙
│                                            │
└────────────────────────────────────────────┘
```

**粒子密度分布**：
- **树冠区域**：高密度（数千粒子/平方米），模拟树叶的丰满感
- **树干/枝干**：中等密度，呈柱状/线状分布
- **路径/地面**：低密度，水平延展
- **热点标记**：独立粒子群，发光高亮

#### 粒子运动（GLSL 着色器核心逻辑）

```
运动类型：有机摇摆（Organic Sway）

┌─────────────────────────────────────┐
│  基础状态：静止点云（摄影测量原始位置）  │
│         ↓                           │
│  叠加层 1：Perlin/Simplex Noise      │
│  → 低频大振幅（模拟树枝缓慢摇曳）       │
│         ↓                           │
│  叠加层 2：高频微振幅噪声              │
│  → 模拟叶片微颤                       │
│         ↓                           │
│  叠加层 3：音频分析数据（Web Audio）    │
│  → 粒子随音乐"呼吸"                    │
│  → 节奏强时振幅增大                    │
│  → 频率变化时颜色/形态漂移              │
└─────────────────────────────────────┘
```

**运动参数估算**：
- 基础摇摆幅度：粒子原始位置的 ±2-5%（微小的偏移制造"活着"的感觉）
- 噪声频率：低频 0.1-0.3Hz（树枝），高频 1-3Hz（叶片）
- 音频联动：FFT 频谱分析 → 低频驱动大位移，高频驱动微颤

### 2.3 GLSL 着色器技术架构

```
顶点着色器（Vertex Shader）
├── 读取粒子原始位置（摄影测量数据）
├── 采样 Perlin Noise 纹理 → 低频位移
├── 采样音频分析纹理 → 幅度调制位移
├── 输出 gl_Position + 变换后的颜色信息
│
片元着色器（Fragment Shader）
├── 圆形粒子（点精灵 Point Sprite）
├── 径向渐变边缘（硬边 → 软消退）
├── 可选 bloom 后处理（辉光叠加）
├── 音频驱动的颜色偏移（The Studio 章节特有）
│
性能优化
├── SVG 热点纹理烘焙到 WebGL 层（非 DOM 叠加）
├── 视锥剔除（Frustum Culling）
├── LOD（远处粒子合并/简化）
└── gzip 流式加载分块点云数据
```

### 2.4 音频-视觉联动机制

```
Penderecki 音乐文件
        ↓
Web Audio API → AnalyserNode
        ↓
    ┌───┴───┐
    ↓       ↓
 时域数据  频域数据（FFT 频谱）
    ↓       ↓
 音量包络  频率分布
    ↓       ↓
 粒子振幅  粒子颜色偏移
 （整体缩放）（不同频段驱动不同区域）
```

| 音频参数 | 映射到视觉效果 |
|---------|--------------|
| **整体音量** | 粒子摇摆幅度（安静的段落粒子几乎静止，强奏时粒子剧烈波动） |
| **低频段（20-250Hz）** | 树干/大型粒子的位移强度 |
| **中频段（250-2000Hz）** | 树冠粒子的波动频率 |
| **高频段（2k-20kHz）** | 粒子颜色漂移 / 发光强度 |
| **节奏/节拍检测** | 粒子群的整体脉冲式缩放 |

---

## 三、UI 交互设计分析

### 3.1 导航系统

```
多入口导航架构：

  首页滑块（Carousel）
       ↓
  交互式地图（全局扫描俯瞰）
       ↓
  顶部菜单（传统导航）
       ↓
  章节选择器（Chapter Selector）
       ↓
  键盘快捷键（全键盘可访问）
```

| 交互方式 | 平台 | 说明 |
|---------|------|------|
| **鼠标拖拽旋转** | 桌面端 | 标准轨道控制（Orbit Controls） |
| **滚轮缩放** | 桌面端 | 从全景缩放到近景细节 |
| **键盘导航** | 桌面端 | 完整的键盘可访问（WebGL 项目极罕见） |
| **陀螺仪旋转** | 移动端 | 转动设备查看花园不同角度 |
| **Google Cardboard** | VR | 沉浸式 VR 路径 |
| **热点点击** | 全平台 | SVG 纹理烘焙的交互标记 |

### 3.2 章节结构（叙事架构）

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  🌿 The Labyrinth  迷宫                               │
│  ├─ 15,000 棵角树点云                                  │
│  ├─ 粒子中隐藏了 Penderecki 作曲片段                    │
│  └─ 用户在树丛间"寻找"隐藏的音乐                         │
│                                                      │
│  🏠 The Studio  工作室                                │
│  ├─ 庄园建筑的 3D 扫描模型                              │
│  ├─ 粒子颜色/形态随《双簧管随想曲》实时变化                │
│  └─ 建筑粒子与音乐同步"呼吸"                            │
│                                                      │
│  🌸 The Park  公园                                    │
│  ├─ 55+ 幅手绘植物插画                                  │
│  ├─ 手绘与点云扫描混合展示                               │
│  └─ 模拟与数字美学的融合                                 │
│                                                      │
│  🎵 The Music Salon  音乐沙龙                          │
│  ├─ Penderecki 作品完整录音                            │
│  ├─ 专业背景解读文本                                    │
│  └─ 沉浸式聆听体验                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 3.3 设计哲学

| 原则 | 具体表现 |
|------|---------|
| **真实高于完美** | 拒绝人工 3D 建模树木，坚持摄影测量真实数据 |
| **数字 ≠ 虚拟** | 用数字技术"重现"而非"模拟"实体空间 |
| **声音驱动视觉** | 视觉不是装饰，而是音乐的可视化延伸 |
| **深度 > 广度** | 四个章节而非大量内容，每个都有完整叙事 |
| **混合美学** | 手绘插画 + 点云扫描 + 摄影测量 = 模拟-数字混合 |
| **古典克制** | 极简三色、暗色调、古典排版，匹配 Penderecki 的严肃实验音乐风格 |

---

## 四、与「梦中日记本」的粒子设计对比

| 维度 | Penderecki's Garden | 梦中日记本（秒秒Guo） |
|------|-------------------|---------------------|
| **粒子来源** | 摄影测量（真实数据） | AI 生成（程序化生成） |
| **粒子数量** | 数十亿 → 压缩后仍极高密度 | 500-1000（轻量） |
| **排列方式** | 还原真实空间结构 | 自由漂浮、无固定形态 |
| **运动逻辑** | 微幅有机摇摆 + 音频驱动 | Perlin Noise 自由漂移 |
| **色彩** | 实景色彩 + 极简三色 UI | 暖金 + 柔白（情感暖色） |
| **交互** | 轨道旋转 + 陀螺仪 + VR | 鼠标吸引 + 点击对话 |
| **技术栈** | Three.js + GLSL + Web Audio | Gemini 生成代码 |
| **情感** | 肃穆、宏大、纪念性 | 温暖、私密、治愈 |
| **规模感** | 殿堂级（20公顷 → 浏览器） | 个人日记级 |

---

## 五、设计提示词（可直接用于 AI 工具）

### 提示词 A：完整粒子花园（适合 Gemini / Claude —— 生成完整 Three.js 体验）

```
Please create an immersive WebGL point-cloud garden experience inspired by Penderecki's Garden. This is a digital memorial that reconstructs a real garden as drifting particles, synchronized with classical music.

【Core Concept】
Reconstruct a garden as a cosmos of floating point-cloud particles. The experience should feel like drifting through a memory — trees, paths, and structures rendered entirely as colored particles against a dark void, slowly swaying as if breathing.

【Visual Design】
- Background: Pure black (#000000), creating an infinite void
- UI accent colors: Deep blue (#2779a7) and teal (#49c5b6) — use only these 3 colors in the UI
- Particles: Thousands of colored points derived from a real-garden color palette (muted greens, earth browns, dusty path grays)
- Overall feel: Subdued, serious, meditative — matching the tone of 20th-century classical composition
- The entire scene should feel like it's suspended in a dark cosmos, not like a video game
- UI elements (titles, navigation) should be minimal, with classical serif typography, very low opacity white text

【Particle System Specifications】
- Use Three.js PointsMaterial with PointSprites
- Each particle is a soft circle with radial gradient edges (hard center → soft fade)
- Particle density varies by zone:
  * Canopy areas: high density (thousands of particles per cluster), simulating fullness of leaves
  * Trunk/path areas: medium to low density, linear distribution
  * Ground plane: sparse horizontal distribution
- Add subtle organic sway via vertex shader:
  * Layer 1: Low-frequency Perlin/Simplex noise for slow branch-like drift (amplitude: 2-5% of position)
  * Layer 2: Higher-frequency micro-tremor for leaf flutter
  * The sway should be barely perceptible — like leaves in a very gentle breeze

【Audio-Visual Synchronization】
- Use Web Audio API to load and analyze a classical music track
- Map audio analysis to particle behavior:
  * Overall volume → global sway amplitude (quiet = still, loud = vigorous)
  * Low frequencies (20-250Hz) → large/trunk particle displacement
  * Mid frequencies (250-2000Hz) → canopy flutter intensity
  * High frequencies (2k-20kHz) → subtle color shift toward blue/teal
- The goal: the garden should literally "breathe" with the music

【Interaction】
- Desktop: Mouse drag to orbit, scroll to zoom, full keyboard navigation
- Mobile: Gyroscope-based look-around (device orientation controls the camera)
- Click/tap on glowing hotspot markers to trigger audio clips or textual content
- Hotspots should be SVG-texture icons baked into WebGL (NOT DOM overlays)
- Smooth chapter transitions using GSAP (camera flies between garden zones)

【Chapter Structure】
Create 4 distinct zones within the particle garden:
1. The Grove: Dense tree particles forming a labyrinth. Hidden among the particles are interactive "sparkle" points that reveal fragments of poetry/text.
2. The Atelier: A structure-like cluster of particles (suggesting a building/manor). These particles subtly shift color in a breathing rhythm.
3. The Meadow: Sparser, more open particle field. Integrate simple botanical illustration-style elements (could be flat SVG overlays or particle-clusters shaped like flowers).
4. The Salon: A calm, centered zone with fewer particles. This is where the full music plays, with particles drifting in slow, meditative circles.

【Technical Requirements】
- Pure frontend: HTML + Three.js + custom GLSL shaders
- TypeScript or vanilla JS
- GSAP for camera and transition animations
- Use BufferGeometry with position/color attributes for the point cloud
- Implement frustum culling
- Load point cloud data in chunks (progressive loading)
- Target 60fps on desktop, 30fps minimum on mobile
- Add a subtle post-processing bloom/glow pass (using EffectComposer or custom)

【UX Requirements】
- Initial load: Show a loading indicator with chapter name
- First interaction: Camera slowly auto-orbits until user interacts
- Audio: Auto-play muted, with an unmute button (respect browser autoplay policy)
- Transitions: 1.5-2s smooth camera flight between chapters
- Typography: Use a classical serif font (e.g., Cormorant Garamond or Playfair Display)
- All text: white at 60-80% opacity, subtle, never dominating the visual

【What to Avoid】
- No neon colors, no sci-fi aesthetic
- No sharp particle edges (all particles must have soft edges)
- No aggressive/jarring animations — everything is slow and deliberate
- No complex UI chrome — the particles ARE the interface
- No fake 3D tree models — everything must be particles
```

---

### 提示词 B：GLSL 粒子着色器（核心着色器代码方向）

```
Write custom GLSL vertex and fragment shaders for a Three.js point cloud system that simulates an organic, breathing particle garden.

【Vertex Shader Requirements】
Goal: Transform each particle's position with organic noise + audio-reactive displacement

Input uniforms:
- float uTime: elapsed time in seconds
- float uSwayAmplitude: base sway amount (0.0 - 0.05, representing 0-5% of position)
- float uSwayFrequency: noise sampling speed (0.1 - 0.5)
- float uAudioLow: FFT low-frequency energy (0.0 - 1.0)
- float uAudioMid: FFT mid-frequency energy (0.0 - 1.0)
- float uAudioHigh: FFT high-frequency energy (0.0 - 1.0)
- float uAudioVolume: overall volume (0.0 - 1.0)
- sampler2D uNoiseTexture: pre-generated Perlin/Simplex noise texture
- float uParticleSize: base point size
- float uMicroTremor: higher-frequency flutter amplitude (0.0 - 0.02)

Displacement logic:
1. Sample noise texture at (position.xy * uSwayFrequency + uTime * 0.1) for low-freq drift
2. Sample noise texture at (position.xy * uSwayFrequency * 5.0 + uTime * 0.3) for micro-tremor
3. Combine: displacement = lowFreqDrift * uSwayAmplitude * uAudioVolume + microTremor * uMicroTremor * uAudioMid
4. Apply displacement to position in the plane perpendicular to the particle's "up" direction
5. Add a slight Y-axis bob based on uAudioLow

Color logic:
- Base color from attribute (photogrammetry-derived real color)
- Mix in uAudioHigh-driven blue tint: color.rgb = mix(color.rgb, vec3(0.15, 0.47, 0.65), uAudioHigh * 0.3)
- Output varying vColor for fragment shader

Point size:
- gl_PointSize = uParticleSize * (1.0 + uAudioLow * 0.5)
- Perspective scaling: size *= 300.0 / -viewPosition.z

【Fragment Shader Requirements】
Goal: Soft, circular particles with radial gradient edges

- Use distance from center (length(gl_PointCoord - 0.5) * 2.0) as main factor
- Create a smooth radial falloff: alpha = 1.0 - smoothstep(0.0, 1.0, dist)
- Add a subtle inner glow: alpha += 0.15 * (1.0 - dist) for center brightness
- Final alpha should be 0.0 at edges, ~0.9 at center
- Apply vColor from vertex shader
- Use premultiplied alpha blending

【Shader Variant for "The Studio" Chapter】
Add a color-shift capability:
- Accept uniform vec3 uTargetColor and float uShiftAmount
- Mix base color toward target color based on audio rhythm
- color = mix(baseColor, uTargetColor, uShiftAmount)
```

---

### 提示词 C：音频可视化联动系统

```
Create a Web Audio API-based audio-visual synchronization system for a particle garden experience.

【Audio Pipeline】
1. Load audio file using fetch + AudioContext.decodeAudioData()
2. Create source node → AnalyserNode → destination
3. AnalyserNode configuration:
   - fftSize: 2048 (for good frequency resolution)
   - smoothingTimeConstant: 0.8 (smooth transitions, prevent jitter)
   - minDecibels: -90, maxDecibels: -10

【Data Extraction (every animation frame)】
1. Time-domain data (waveform):
   const timeData = new Uint8Array(analyser.fftSize)
   analyser.getByteTimeDomainData(timeData)
   → Calculate RMS volume: sqrt(mean of squared normalized samples)
   → Output: uAudioVolume (0.0 - 1.0)

2. Frequency-domain data (spectrum):
   const freqData = new Uint8Array(analyser.frequencyBinCount)
   analyser.getByteFrequencyData(freqData)

   → Low band (index 0 to fftSize/4 * 250/22050):
     Average values → uAudioLow (0.0 - 1.0)

   → Mid band (fftSize/4 * 250/22050 to fftSize/4 * 2000/22050):
     Average values → uAudioMid (0.0 - 1.0)

   → High band (fftSize/4 * 2000/22050 to fftSize/2):
     Average values → uAudioHigh (0.0 - 1.0)

3. Beat detection (onset detection):
   - Track spectral flux (rate of change between consecutive frames)
   - When flux exceeds threshold → beat detected
   → Output: uBeatDetected (boolean pulse)

【Uniform Update (per frame)】
Pass all extracted values to vertex shader uniforms:
- uAudioVolume: RMS volume
- uAudioLow: low-frequency energy
- uAudioMid: mid-frequency energy
- uAudioHigh: high-frequency energy
- uBeatPulse: 1.0 on beat, decays to 0.0 over ~200ms (exponential decay)

【On-beat effect】
When uBeatPulse > 0.5:
- Particles globally scale up by 10%
- Fade back over 200ms
- Creates a subtle "breathing" pulse synchronized with musical rhythm
```

---

### 提示词 D：完整设计系统

```
# Penderecki's Garden · 设计系统

## 色彩
仅使用 3 种颜色：
- bg-primary: #000000（纯黑，画布/虚空）
- accent-blue: #2779a7（深蓝，UI 强调、链接、热点）
- accent-teal: #49c5b6（青绿，自然/生命/第二强调）

粒子颜色：
- 来自摄影测量实景数据（暗绿、泥土棕、路径灰），不做人工染色
- UI 文字：rgba(255,255,255,0.6) ~ rgba(255,255,255,0.8)

## 字体
- 标题：Playfair Display / Cormorant Garamond（古典衬线体）
  - 字号：48px (desktop), 32px (mobile)
  - 字重：400（Regular）
  - 字母间距：0.05em
- 正文：Georgia / Noto Serif
  - 字号：16px
  - 行高：1.8
  - 颜色：rgba(255,255,255,0.7)
- 导航/标签：系统无衬线体（如 Inter / system-ui）
  - 字号：12px
  - 字母间距：0.1em
  - 颜色：accent-blue or accent-teal

## 间距
- 页面边距：40px (desktop), 20px (mobile)
- UI 元素位于边缘（不侵入粒子视觉区）
- 热点标记间距：基于 3D 世界坐标，不做网格对齐

## 动效
- 粒子摇摆：持续、缓慢、有机（非循环动画）
- 章节切换：GSAP 驱动相机飞行，1.5-2s，ease: power2.inOut
- 热点悬停：scale 1.0 → 1.2，0.3s，ease: back.out(1.7)
- 文字出现：fade-in + translateY(10px→0)，0.8s
- 音频联动：实时，无缓冲延迟

## 交互状态
- 热点默认：发光脉冲（2s 周期，opacity 0.6↔1.0）
- 热点悬停：放大 + 文字标签浮现
- 热点激活：颜色变 accent-teal，周围粒子轻微聚拢
- 相机拖拽中：光标变为 grab/grabbing
- 加载中：章节名称 + 淡入淡出圆点动画

## 核心原则
1. 粒子即界面 —— 不另建 UI 层覆盖粒子视觉
2. 慢即是美 —— 所有动效放缓，匹配古典音乐节奏
3. 真实胜于完美 —— 摄影测量数据的瑕疵是特征而非 bug
4. 声音驱动视觉 —— 视觉服务于音乐，而非反过来
5. 克制用色 —— 只用三色，让粒子自然色彩承担视觉重量
```

---

## 六、技术实现要点总结

| 技术点 | 实现方案 | 备注 |
|--------|---------|------|
| **点云压缩** | PCD + gzip 分块加载 | 数十亿 → 浏览器可渲染，耗时数月 |
| **粒子渲染** | Three.js BufferGeometry + PointsMaterial | 每粒子一个顶点 |
| **有机运动** | 自定义 GLSL 顶点着色器，Perlin Noise 采样 | 低频 + 高频噪声叠加 |
| **音频联动** | Web Audio API → AnalyserNode → FFT → uniform | 实时，每帧更新 |
| **热点系统** | SVG 纹理烘焙到 WebGL 层 | 避免 DOM 叠加的性能开销 |
| **相机控制** | 自定义 Orbit Controls + GSAP 过渡 | 支持键盘/鼠标/触屏/陀螺仪 |
| **VR 支持** | Google Cardboard 路径 | 立体渲染 + 陀螺仪 |
| **后处理** | EffectComposer + Bloom Pass | 柔和辉光 |
| **移动端** | 陀螺仪 API + 响应式降级 | 降低粒子数、简化着色器 |

---

## 七、参考资源

| 资源 | 链接 |
|------|------|
| 项目官网 | https://pendereckisgarden.pl/en |
| Awwwards SOTD 页面 | https://www.awwwards.com/sites/pendereckis-garden |
| WebGPU Community 分析 | https://www.webgpu.com/showcase/pendereckis-garden-threejs-point-cloud-photogrammetry/ |
| Communication Arts 专题 | https://www.commarts.com/webpicks/penderecki-s-garden |
| Huncwot 官网 | https://huncwot.com |

---

> **总结**：Penderecki's Garden 是当前 WebGL 粒子系统在文化艺术领域的巅峰实践。其核心设计语言可归纳为：**真实数据 × 粒子宇宙 × 音频呼吸 × 极简三色 × 古典克制**。它不是制造一个"看起来很酷的粒子效果"，而是将真实的物理空间（20公顷花园）转化为可探索的数字记忆，让粒子承载真实数据、让音乐驱动视觉行为。上述设计提示词可以直接用于 Gemini、Claude 等 AI 工具，复现类似的粒子花园体验。
