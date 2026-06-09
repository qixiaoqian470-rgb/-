// 日记业务逻辑
// 把"录音 → AI润色 → 存储 → 展示"串起来的核心

import { saveDiary, getAllDiaries, getDiary, deleteDiary as dbDel } from './db.js';
import { polishDiary, chatAboutDiary } from './gemini.js';
import { generateId, escapeHtml } from './utils.js';
import * as recorder from './recorder.js';
import * as particles from './particles.js';
import { renderMain, renderDetail, showLoading, hideLoading, toast } from './ui.js';

let chatHistory = [];

// ===== 首页 =====
export async function loadMain() {
  const diaries = await getAllDiaries();
  renderMain(diaries);
  bindMainEvents(diaries);
}

function bindMainEvents(diaries) {
  // 麦克风按钮
  document.getElementById('btn-mic')?.addEventListener('click', () => toggleRecording());
  // 新建日记按钮
  document.getElementById('btn-new')?.addEventListener('click', () => toggleRecording());

  // 滑动切换（粒子区左右滑动）
  if (diaries.length > 1) {
    let startX = 0, currentIdx = 0;
    const area = document.getElementById('particle-area');
    area?.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; });
    area?.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        currentIdx = diff > 0
          ? Math.min(currentIdx + 1, diaries.length - 1)
          : Math.max(currentIdx - 1, 0);
        loadDiaryParticles(diaries[currentIdx], currentIdx, diaries.length);
      }
    });
  }
}

let isRecording = false;
let transcriptDiv = null;

async function toggleRecording() {
  if (isRecording) {
    // 停止录音
    recorder.stop();
    return;
  }

  if (!recorder.isSupported()) {
    toast('浏览器不支持语音识别，请用 Chrome 打开');
    return;
  }

  isRecording = true;
  recorder.reset();
  document.getElementById('btn-mic')?.classList.add('recording');

  // 显示转写文字区
  showTranscriptArea();

  recorder.start(
    (text, interim) => {
      if (transcriptDiv) transcriptDiv.textContent = text || '正在聆听...';
    },
    async (state, data) => {
      if (state === 'stop') {
        isRecording = false;
        document.getElementById('btn-mic')?.classList.remove('recording');
        hideTranscriptArea();
        const txt = data || '';
        if (txt.trim().length < 5) { toast('内容太短了，请再说多一点吧'); return; }
        await createDiary(txt);
      } else if (state === 'error') {
        isRecording = false;
        document.getElementById('btn-mic')?.classList.remove('recording');
        hideTranscriptArea();
        toast(`录音出错了：${data}`);
      }
    }
  );
}

function showTranscriptArea() {
  const area = document.getElementById('particle-area');
  if (!area) return;
  transcriptDiv = document.createElement('div');
  transcriptDiv.className = 'transcript-overlay';
  transcriptDiv.innerHTML = '<p class="transcript-text">正在聆听...</p>';
  area.appendChild(transcriptDiv);
}

function hideTranscriptArea() {
  transcriptDiv?.remove();
  transcriptDiv = null;
}

// 创建日记：AI 润色 + 存库
async function createDiary(rawText) {
  showLoading('AI 正在帮你写日记...');
  try {
    const result = await polishDiary(rawText);
    const diary = {
      id: generateId(),
      rawText,
      title: result.title,
      content: result.content,
      tags: result.tags,
      mood: result.mood,
      quote: result.quote,
      imageData: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDiary(diary);
    hideLoading();
    window.location.hash = `#detail/${diary.id}`;
  } catch (err) {
    hideLoading();
    toast(`生成失败：${err.message}`);
  }
}

// 给粒子区加载某篇日记的粒子
async function loadDiaryParticles(diary, idx, total) {
  updateSwipeDots(idx, total);
  if (!diary.imageData) return;
  try {
    const imgData = await particles.loadImage(diary.imageData);
    particles.generate(imgData, 1500);
    particles.startAnim();
  } catch { /* 没有照片就算了 */ }
}

function updateSwipeDots(current, total) {
  const dots = document.getElementById('swipe-dots');
  if (!dots) return;
  dots.innerHTML = Array.from({ length: total }, (_, i) =>
    `<span class="dot${i === current ? ' current' : ''}"></span>`
  ).join('');
}

// ===== 聊天 =====
export async function sendChat(diaryId, msg) {
  const diary = await getDiary(diaryId);
  if (!diary) throw new Error('日记找不到了');
  const reply = await chatAboutDiary(diary.content, msg, chatHistory);
  chatHistory.push(
    { role: 'user', parts: [{ text: msg }] },
    { role: 'model', parts: [{ text: reply }] }
  );
  return reply;
}

export function clearChat() { chatHistory = []; }

// ===== 删除 =====
export async function removeDiary(id) {
  await dbDel(id);
  window.location.hash = '#main';
}
