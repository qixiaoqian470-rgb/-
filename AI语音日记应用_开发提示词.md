# AI 语音交互日记应用 —— 完整开发提示词

> 灵感来源：秒秒Guo「梦中日记本」 | 基于 Google Gemini + Vibe Coding
> 这份提示词可以直接复制粘贴给 Cursor / Windsurf / AI Studio 等 AI 编程工具使用。

---

## 📋 项目概述

请帮我创建一个名为「梦中日记本」的 AI 语音交互日记 Web 应用。这是一个面向普通用户的个人日记工具，核心交互方式是**语音输入**，AI 将用户的语音内容转化为精美、有温度的日记条目。

目标用户：任何想记录生活但懒得打字的人。氛围应该是**温暖、治愈、私密**的。

---

## 🎯 核心功能需求

### 1. 语音录制与转写
- 用户点击麦克风按钮开始录音，再次点击结束
- 使用浏览器 Web Speech API 或 MediaRecorder API 实现语音录入
- 录音时显示动态波形动画，给用户反馈"我正在听"
- 支持最长 5 分钟的连续录音
- 录音结束后自动调用 AI 进行转写和润色

### 2. AI 日记生成
- 将用户的语音内容（口语化、碎片化）发送给 Google Gemini API
- AI 需要完成以下处理：
  - 将口语转为书面语，修正语法错误
  - 提取关键情绪和主题
  - 以温暖、文学化的风格重新组织内容
  - 自动生成一个诗意的标题
  - 自动提取 3-5 个情绪标签（如：开心、思念、迷茫、期待）
- 生成结果以卡片形式展示，包含标题、正文、情绪标签、时间戳

### 3. 日记管理与浏览
- 日记列表页：按时间倒序排列，每条显示标题、日期、情绪标签
- 支持搜索和按情绪标签筛选
- 日记详情页：完整展示日记内容，支持 AI 语音朗读（TTS）
- 支持编辑和删除

### 4. 语音朗读（TTS）
- 在日记详情页提供"听日记"按钮
- 使用浏览器内置 SpeechSynthesis API 实现语音朗读
- 可选择不同声音（温柔女声 / 磁性男声）

### 5. 数据持久化
- 使用浏览器的 localStorage 存储所有日记数据
- 数据结构包含：id、原始语音文本、AI 润色后文本、标题、情绪标签、创建时间

---

## 🎨 UI/UX 设计要求

### 整体风格
- **治愈系设计**：柔和的渐变色背景（淡紫 → 淡粉 → 暖黄）
- **毛玻璃效果**：卡片使用 backdrop-filter: blur() 实现磨砂质感
- **圆角设计**：所有卡片、按钮使用大圆角（12-20px）
- **温暖配色**：主色调为薰衣草紫 #8B7EC8，辅以暖橙色、柔粉色
- **字体**：使用优雅的中文字体，标题可用衬线体

### 页面结构

**首页（日记列表）**
```
┌──────────────────────────┐
│     🌙 梦中日记本         │  ← 顶部导航
│     记录你的每一天         │
├──────────────────────────┤
│  [🔍 搜索日记...]  [+新日记] │
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │ 📅 6月9日           │  │  ← 日记卡片
│  │ 今天阳光很好...      │  │
│  │ #开心 #日常          │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 📅 6月8日           │  │
│  │ 做了一个很奇怪的梦... │  │
│  │ #梦境 #奇妙          │  │
│  └────────────────────┘  │
│         ...              │
└──────────────────────────┘
```

**录音页面**
```
┌──────────────────────────┐
│     ← 返回               │
├──────────────────────────┤
│                          │
│      🎙️                 │  ← 中央麦克风图标
│   点击开始记录           │  ← 动态波形环
│   ╭───────╮             │
│   │ 00:32  │             │  ← 计时器
│   ╰───────╯             │
│                          │
│    [点击结束录音]        │
│                          │
├──────────────────────────┤
│  正在聆听你的故事...      │
└──────────────────────────┘
```

**日记详情页**
```
┌──────────────────────────┐
│     ← 返回    [编辑] [删除]│
├──────────────────────────┤
│                          │
│   六月的风吹过窗台        │  ← AI 生成的诗意标题
│                          │
│  今天阳光很好，我坐在     │
│  窗边喝了一杯温热的奶茶   │  ← AI 润色后的正文
│  。楼下的小猫又在晒太阳   │
│  ，懒洋洋的，让人羡慕...  │
│                          │
│  #开心 #日常 #治愈        │  ← 情绪标签
│                          │
│  2026年6月9日 15:32      │  ← 时间戳
│                          │
│  [🔊 听日记]  [📝 编辑]  │  ← 操作按钮
└──────────────────────────┘
```

### 交互动效
- 页面切换使用淡入淡出过渡
- 录音时麦克风图标呼吸式缩放动画
- 日记卡片 hover 时微微上浮 + 阴影加深
- AI 生成日记时显示打字机效果（逐字出现）
- 加载状态使用柔和的骨架屏

---

## 🔧 技术实现要求

### 技术栈
- **前端框架**：纯 HTML + CSS + JavaScript（单文件应用）
- **AI 接口**：Google Gemini API（gemini-2.5-flash 或 gemini-2.5-pro）
- **语音录入**：浏览器 MediaRecorder API + Web Audio API
- **语音合成**：浏览器 SpeechSynthesis API
- **存储**：localStorage
- **部署**：可直接在浏览器打开的单个 HTML 文件

### API 调用设计

**Gemini Prompt 设计（关键！）**

调用 Gemini 时的 System Prompt 如下：

```
你是一位温暖、细腻的文学编辑。用户会给你一段口语化的语音转写文本，
你需要将其转化为一篇精美的日记。

请按以下 JSON 格式返回（只返回 JSON，不要其他内容）：

{
  "title": "诗意的标题（10字以内）",
  "content": "润色后的日记正文，温暖文学的语调，保留原意的同时让文字更优美",
  "tags": ["情绪标签1", "情绪标签2", "情绪标签3"],
  "mood": "整体情绪（开心/平静/忧伤/焦虑/期待/感动/思念/迷茫）",
  "quote": "从日记中提取一句最有感触的话"
}

要求：
1. 保持第一人称，不要改变用户的原意
2. 风格温暖治愈，像村上春树或吉本芭娜娜的散文语调
3. 适当分段，让阅读节奏舒适
4. 标签要准确反映情绪，不要泛化
```

### 关键代码模块

```javascript
// 1. Gemini API 调用
async function generateDiary(transcript) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: transcript }] }]
      })
    }
  );
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  // 解析 JSON（去除可能的 markdown 代码块标记）
  return JSON.parse(text.replace(/```json\n?|```/g, '').trim());
}

// 2. 录音功能
async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];
  
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    // 将音频发送给 Gemini 进行语音转文字
    const transcript = await transcribeAudio(blob);
    // 生成日记
    const diary = await generateDiary(transcript);
    // 保存并展示
    saveDiary(diary);
    showDiary(diary);
  };
  
  mediaRecorder.start();
  return mediaRecorder;
}

// 3. Gemini 语音转文字
async function transcribeAudio(audioBlob) {
  const base64Audio = await blobToBase64(audioBlob);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "请将这段音频转写为中文文本，只返回转写结果" },
            { inline_data: { mime_type: "audio/webm", data: base64Audio } }
          ]
        }]
      })
    }
  );
  // 解析返回的转写文本
  // ...
}
```

---

## ⚠️ 注意事项

1. **API Key 安全**：在代码中使用占位符 `YOUR_GEMINI_API_KEY`，提示用户在设置中填入
2. **浏览器兼容**：需要 HTTPS 或 localhost 才能使用麦克风
3. **移动端适配**：确保在手机上也能流畅使用（响应式设计）
4. **隐私保护**：所有数据仅存储在用户本地浏览器，不上传至任何服务器
5. **错误处理**：录音失败、API 调用失败、网络中断等情况要有友好的提示
6. **Gemini API 配额**：提醒用户注意 API 调用频率限制

---

## 🚀 部署方式

1. **本地使用**：直接在浏览器打开 HTML 文件 + 配置 API Key
2. **部署到 EdgeOne Pages / CloudStudio**：静态托管
3. **PWA 支持**（可选）：添加 manifest.json，支持添加到手机主屏幕

---

## 📝 Vibe Coding 提示词（复制即用）

如果你使用 Cursor / Windsurf / AI Studio，可以直接粘贴下面这段：

```
你是一个全栈开发者。请帮我创建一个 AI 语音日记 Web 应用，具体要求：

【产品定位】
名为「梦中日记本」，是一款语音交互的个人日记应用。用户说话，AI 帮你写成优美的日记。

【核心流程】
1. 用户点击麦克风 → 开始录音（带波形动画）
2. 点击停止 → 音频发送给 Gemini API 转文字
3. 将文字再次发送给 Gemini → AI 润色生成日记（标题+正文+情绪标签）
4. 以精美卡片展示 → 支持语音朗读
5. 存储在 localStorage → 形成日记列表

【技术要求】
- 纯 HTML+CSS+JS 单文件，可直接在浏览器打开
- 使用 Google Gemini API（gemini-2.5-flash）
- 语音转文字用 Gemini 的多模态能力（音频直接传入）
- 语音朗读用浏览器 SpeechSynthesis API
- 治愈系 UI：毛玻璃效果、柔和渐变、大圆角

【请完整实现以下内容】
1. 完整的 HTML 结构（日记列表页 + 录音页 + 详情页，用单页切换）
2. 完整的 CSS 样式（包含动画、过渡、响应式）
3. 完整的 JavaScript 逻辑（录音、API 调用、存储、朗读）
4. Gemini API 的 System Prompt（润色日记的核心指令）
5. 错误处理：权限被拒、网络异常、API 报错
6. 设置面板：用户填入自己的 Gemini API Key

请直接输出完整的单文件 HTML 代码。
```
