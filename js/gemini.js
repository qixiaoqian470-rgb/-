// AI 调用模块
// 把用户说的话发给 Gemini，让它帮忙润色成优美的日记

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash';

// 告诉 AI 它是什么角色、该怎么写
const DIARY_PROMPT = `你是一位温暖、细腻的文学编辑。用户会给你一段口语化的文字，你需要将其变成一篇精美的日记。

请严格按以下 JSON 格式返回（只返回 JSON，不要多余内容）：

{
  "title": "诗意的标题，10个字以内",
  "content": "润色后的日记正文，温暖文学的语调",
  "tags": ["标签1", "标签2", "标签3"],
  "mood": "整体情绪（开心/平静/忧伤/感动/思念/迷茫等）",
  "quote": "从日记中选一句最有感触的话"
}

要求：保持第一人称，不改变原意，风格像村上春树或吉本芭娜娜的散文，适当分段。`;

// 聊天时的 AI 人设
const CHAT_PROMPT = `你是一位温柔贴心的朋友，正在和用户聊ta写的日记。
请用自然、温暖的语气回应，3-5句话即可，像朋友发消息一样。`;

// 读取用户存的 API Key
function getKey() {
  try {
    return JSON.parse(localStorage.getItem('dream-diary-settings') || '{}').geminiApiKey || '';
  } catch { return ''; }
}

// 调用 Gemini API 的核心函数
async function callGemini(systemPrompt, userText) {
  const key = getKey();
  if (!key) throw new Error('请先在设置里填入 Gemini API Key');

  const res = await fetch(`${BASE}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userText }] }]
    })
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `请求失败（${res.status}）`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// 润色日记：口语进去 → 漂亮日记出来
export async function polishDiary(rawText) {
  const text = await callGemini(DIARY_PROMPT, rawText);
  const cleaned = text.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleaned);
}

// 和 AI 聊日记
export async function chatAboutDiary(diaryContent, userMsg, history = []) {
  const parts = [
    { text: `我写了一篇日记：\n\n${diaryContent}\n\n我的消息：${userMsg}` }
  ];
  return await callGemini(CHAT_PROMPT, parts[0].text);
}
