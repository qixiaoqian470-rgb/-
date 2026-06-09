# 秒秒的AI日记 — UI 设计语言深度分析与复刻提示词

> 截图分析时间：2026年6月9日
> 这份提示词可直接粘贴给 Cursor / Windsurf / v0 / Lovable 等 AI 编程工具

---

## 一、截图逐层拆解

```
┌──────────────────────────────────────┐
│  秒秒的AI日记    THE GARDEN  MEMORY  │ ← 顶部导航：中文衬线体 + 英文小大写
│                  MUSIC  INFO  🔊 ≡   │   极简线框图标
├──────────────────────────────────────┤
│  🟢 Gemini                           │ ← AI状态标签：绿色圆点 + 模型名
│                                      │
│                                      │
│           ╭──────────────╮           │
│           │              │           │ ← 粒子系统生成的有机形状
│           │    ⛩️ 🌅     │           │   内部是一幅梦境般的画面：
│           │              │           │   山丘上的亭子，暖金色调
│           │      ▶       │           │   中央叠加播放按钮
│           │              │           │   粒子在边缘不断生成/消散
│           ╰──────────────╯           │   "记忆正在成形"的隐喻
│                                      │
│                                      │
│              ○  ●                    │ ← 轮播指示点
│             ╭─────╮                  │ ← 圆形麦克风按钮（主要交互）
│             │ 🎤  │                  │
│             ╰─────╯                  │
│         00:59  Save Memory >  ✕      │ ← 计时器 + 保存 + 关闭
└──────────────────────────────────────┘
```

---

## 二、设计语言核心提取

### 2.1 配色方案

| 用途 | 色值 | 说明 |
|------|------|------|
| 全局背景 | `#000000` | 纯黑，无渐变，营造沉浸感和"闭眼"的隐喻 |
| 主文字 | `#FFFFFF` / `rgba(255,255,255,0.9)` | 白色，高对比度 |
| 次级文字 | `rgba(255,255,255,0.5)` | 50%透明白，用于导航、计时器 |
| 按钮描边 | `rgba(255,255,255,0.3)` | 30%透明白，极细线条 |
| 状态指示灯 | `#34D399` | 翠绿色，表示AI在线 |
| 视觉内容色调 | 暖金 / 橙粉 / 琥珀色 | 仅出现在粒子图像内部，UI chrome 不抢戏 |

> **核心原则：UI Chrome 只用黑白+透明度，所有色彩来自内容本身（照片、粒子）**

### 2.2 字体系统

| 层级 | 字体 | 字重 | 用途 |
|------|------|------|------|
| 品牌名 | **衬线体（宋体/楷体类）** | Regular/Bold | "秒秒的AI日记" |
| 导航 | **无衬线小大写（Inter/Helvetica）** | Light 300 | "THE GARDEN", "MEMORY" |
| 状态标签 | 无衬线 | Regular | "Gemini" |
| 计时器 | 等宽/无衬线 | Thin | "00:59" |
| 操作文字 | 无衬线 | Light | "Save Memory >" |

推荐实现：
```css
--font-serif: 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif;
--font-sans: 'Inter', 'Helvetica Neue', 'PingFang SC', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

### 2.3 间距与布局

```
边距系统：
- 水平内边距：24px（移动端）/ 48px（桌面端）
- 顶部导航高度：约 56px
- 各区块间距：精简到极致，大量留白
- 粒子视觉区：占据视口 45-55% 高度，垂直居中
- 底部操作区：bottom: 40-60px，水平居中

布局哲学：
- 一切居中，纵向流动
- 不做网格、不做卡片
- 信息密度极低
- 每个元素都有呼吸空间
```

---

## 三、核心技术难点拆解

### 3.1 粒子系统（最关键的视觉元素）

这是整个UI的**灵魂**。粒子围绕一张背景图像，在图像边缘形成有机形状，模拟"记忆碎片"的感觉。

**技术方案A：Canvas 粒子系统（推荐）**
```
原理：
1. 将目标图像绘制到离屏 Canvas
2. 对图像边缘检测，生成边缘像素坐标数组
3. 在边缘附近随机分布 2000+ 粒子
4. 每个粒子有生命周期：出生 → 漂浮 → 消散 → 重生
5. 粒子颜色从图像边缘采样，保持色调一致
6. 使用 requestAnimationFrame 持续更新
```

**技术方案B：Three.js / WebGL（进阶）**
```
1. 使用 GLSL shader 实现更细腻的粒子效果
2. 添加 depth 和 blur，增强梦境感
3. 粒子可以响应鼠标/触摸移动
```

### 3.2 粒子动画行为

```
每个粒子的属性：
- x, y：坐标（围绕图像边缘分布）
- size：1-4px
- opacity：0 → 0.8 → 0（生命周期）
- color：从邻近像素采样
- velocityX/Y：微小随机偏移
- life：500-3000ms
- delay：随机初始延迟

动画：
- 粒子从图像边缘"生长"出来
- 向上/向外漂浮 10-30px 后消散
- 新的粒子不断补充
- 整体呈现"呼吸"感——密度周期性变化
```

### 3.3 录音交互

```
麦克风按钮：
- 圆形描边，直径约 64px
- 描边色：rgba(255,255,255,0.3)
- 内部：麦克风 SVG 图标
- 点击后：
  → 描边变亮（rgba(255,255,255,0.6)）
  → 粒子动画加速 / 变密
  → 计时器开始走动
  → 底部出现 "Save Memory >" 
- 再次点击停止
```

---

## 四、完整 Vibe Coding 提示词（复制即用）

```
你是一位顶尖的 UI/UX 设计师和前端开发者。请帮我创建一个「AI 语音日记」Web 应用的单页界面。

【设计哲学】
这是一个冥想级的语音日记工具。用户对着手机说话，AI 帮你把口语变成日记。整个 UI 应该像"闭上眼睛回忆梦境"的感觉——黑暗、安静、让内容发光。

【核心设计语言】
1. 纯黑背景 (#000000)，无渐变，无纹理
2. UI Chrome（导航、按钮）只用白色+透明度变化
3. 所有色彩来自 AI 生成的内容图像
4. 信息密度极低，大量留白，一切居中
5. 氛围：静谧、私密、电影感、治愈

【布局结构（从上到下）】

1. 顶部导航栏
   - 左侧：品牌名"秒秒的AI日记"——衬线体（Noto Serif SC），白色，字重 Regular
   - 右侧：四个导航项——"THE GARDEN" "MEMORY" "MUSIC" "INFO"——无衬线小大写（Inter Light），字间距 4px，50% 透明白
   - 最右侧：🔊 和 ≡ 图标——极简 SVG 线框图标，24px，白色 60% 透明

2. AI 状态标签
   - 圆角椭圆胶囊形状
   - 左侧绿色圆点 + 右侧白色文字"Gemini"
   - background: rgba(255,255,255,0.08)，border-radius: 20px

3. 中央视觉区（粒子梦境画面）
   - 这是整个页面的灵魂！
   - 一个圆形/椭圆形的区域，内部显示一幅 AI 生成的梦幻画面
   - 画面内容：暖金色调的自然场景（例：山丘上的亭子、海边的灯塔、林间小屋——每次生成不同）
   - 画面边缘被粒子系统包围——数千个彩色粒子围绕图像边缘不断生成、漂浮、消散
   - 粒子颜色从邻近像素采样，与图像色调和谐
   - 粒子尺寸：1-4px 随机
   - 粒子生命周期：生成 → 上浮 10-30px → 淡出 → 重生
   - 使用 Canvas + requestAnimationFrame 实现
   - 中央叠加一个半透明的三角形播放按钮 ▶
   - 整体效果：记忆正在成形和消散的隐喻

4. 轮播指示器
   - 两个小圆点，水平居中
   - 激活点：白色实心；非激活：白色 20% 透明

5. 录音交互区
   - 圆形描边按钮（直径约 64px）
   - 描边：rgba(255,255,255,0.3)，线宽 1.5px
   - 内部：麦克风 SVG 图标
   - 录音激活时：描边变亮 + 粒子加速 + 外圈脉冲光晕动画
   - 下方：
     - 计时器 "00:00"（等宽字体，白色 40% 透明）
     - "Save Memory >" 文字（白色 60% 透明，录音停止后显示）
     - ✕ 关闭按钮（白色 30% 透明）

【技术实现要求】
- 纯 HTML + CSS + JS 单文件，可以直接在浏览器打开
- Canvas 用于粒子系统
- 麦克风使用 MediaRecorder API
- 响应式设计：移动端优先，桌面端居中适配
- 字体从 Google Fonts 引入（Noto Serif SC + Inter）
- 所有图标使用内联 SVG

【CSS 关键变量】
--bg-primary: #000000;
--text-primary: rgba(255,255,255,0.9);
--text-secondary: rgba(255,255,255,0.5);
--text-tertiary: rgba(255,255,255,0.3);
--border-light: rgba(255,255,255,0.15);
--accent-green: #34D399;
--font-serif: 'Noto Serif SC', serif;
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

【交互细节】
- 所有按钮 hover 时透明度增加到 0.9
- 页面初次加载时有 0.5s 淡入动画
- 录音时粒子密度翻倍
- 录音停止后 1.5s 过渡期再显示 "Save Memory"
- 计时器用等宽字体，数字变化无跳动

【请直接输出完整的单文件 HTML 代码】
```

---

## 五、关键 CSS 片段参考

```css
/* 全局重置与氛围 */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #000000;
  color: rgba(255,255,255,0.9);
  font-family: 'Inter', 'PingFang SC', sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* 顶部导航 */
.navbar {
  width: 100%;
  max-width: 640px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
}

.brand {
  font-family: 'Noto Serif SC', serif;
  font-size: 16px;
  font-weight: 400;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 24px;
  font-size: 12px;
  font-weight: 300;
  color: rgba(255,255,255,0.5);
  letter-spacing: 3px;
  text-transform: uppercase;
}

/* 粒子 Canvas */
#particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* 录音按钮 */
.record-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.3);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-btn.recording {
  border-color: rgba(255,255,255,0.6);
  box-shadow: 0 0 30px rgba(255,255,255,0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(255,255,255,0.05); }
  50% { box-shadow: 0 0 40px rgba(255,255,255,0.15); }
}
```

---

## 六、与上一份提示词的关系

| 维度 | 上一份（功能提示词） | 本份（UI设计提示词） |
|------|---------------------|---------------------|
| 侧重 | 功能实现、API 对接、数据流 | 视觉风格、粒子系统、氛围营造 |
| 配色 | 治愈系暖色渐变 | 纯黑极简 |
| 复杂度 | 多页面（列表+录音+详情） | 单页沉浸式体验 |
| 灵感来源 | 文字描述 | 截图精确分析 |

> **建议**：将两份提示词组合使用——用第一份的功能骨架 + 第二份的 UI 风格，可以打造最完整的应用。

---

## 七、备用方案（如果粒子系统太复杂）

如果 AI 工具无法稳定实现 Canvas 粒子系统，可以使用以下降级方案：

**方案1：CSS 动画替代粒子**
```css
/* 使用多个 box-shadow 和 animation-delay 模拟粒子 */
.dream-image {
  border-radius: 50%;
  overflow: hidden;
  position: relative;
}

.dream-image::after {
  content: '';
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, 
    transparent 60%,
    rgba(255,180,100,0.15) 75%,
    rgba(255,140,60,0.08) 85%,
    transparent 100%
  );
  animation: breathe 4s ease-in-out infinite;
}
```

**方案2：纯色渐变圆 + 静态内图**
```
用一个大圆形容器，内部放置 AI 生成的图片，
圆形边缘用多层 box-shadow 做发光和扩散效果。
```
