// 日记流程：上传照片→粒子化→录音→AI生成
import { saveDiary, getAllDiaries, getDiary, deleteDiary as dbDel } from './db.js';
import { polishDiary, chatAboutDiary } from './gemini.js';
import { generateId } from './utils.js';
import * as recorder from './recorder.js';
import * as particles from './particles.js';
import { updateFloatingCard, renderDetail, showLoading, hideLoading, toast } from './ui.js';

let chatHistory = [];
let currentPhoto = null;
let isRecording = false;
let timerInterval = null;
let secondsElapsed = 0;

// ===== 首页加载 =====
export async function loadMain() {
  const diaries = await getAllDiaries();
  bindMainEvents(diaries);

  // 有历史日记 → 显示最新一篇的卡片 + 粒子
  if (diaries.length > 0) {
    updateFloatingCard(diaries[0]);
    loadDiaryParticles(diaries[0]);
  }
}

function bindMainEvents(diaries) {
  // 上传照片按钮
  document.getElementById('btn-upload')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click();
  });
  // 点击传送门也触发上传
  document.getElementById('portal-inner')?.addEventListener('click', (e) => {
    if (e.target.tagName === 'CANVAS') return; // 拖拽时不上传
    document.getElementById('file-input')?.click();
  });
  // 文件选择
  document.getElementById('file-input')?.addEventListener('change', handlePhoto);

  // 麦克风
  document.getElementById('btn-mic')?.addEventListener('click', toggleRecording);

  // Memory 入口
  document.getElementById('memory-entry')?.addEventListener('click', () => {
    toast(diaries.length > 0 ? `共 ${diaries.length} 篇日记` : '还没有日记');
  });

  // 浮动卡片点击 → 进入详情
  document.getElementById('floating-card')?.addEventListener('click', () => {
    if (diaries.length > 0) window.location.hash = `#detail/${diaries[0].id}`;
  });
}

// ===== 照片上传 =====
async function handlePhoto(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    currentPhoto = ev.target.result;
    // 初始化粒子
    particles.destroy();
    const container = document.getElementById('portal-inner');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) * 2;
    particles.initCanvas(container, size, size);
    try {
      const imgData = await particles.loadImage(currentPhoto);
      particles.generate(imgData, size, size, 25000);
      particles.startAnim();
      document.getElementById('portal-hint').textContent = '拖拽旋转 · 说说这张照片';
    } catch { toast('照片处理失败'); }
  };
  reader.readAsDataURL(file);
}

// ===== 录音 =====
async function toggleRecording() {
  if (isRecording) { recorder.stop(); return; }
  if (!recorder.isSupported()) { toast('请用 Chrome 打开'); return; }
  if (!currentPhoto) { toast('请先上传一张照片'); return; }

  isRecording = true; recorder.reset(); secondsElapsed = 0;
  document.getElementById('btn-mic')?.classList.add('recording');
  document.getElementById('recording-info').style.display = 'flex';
  startTimer();

  recorder.start(
    (text) => { document.getElementById('timer-text').textContent = text.slice(0, 30) || '聆听中...'; },
    async (state, data) => {
      if (state === 'stop') {
        isRecording = false; stopTimer();
        document.getElementById('btn-mic')?.classList.remove('recording');
        document.getElementById('recording-info').style.display = 'none';
        const txt = data || '';
        if (txt.trim().length < 5) { toast('内容太短，请再说多一点'); return; }
        await createDiary(txt);
      } else if (state === 'error') {
        isRecording = false; stopTimer();
        document.getElementById('btn-mic')?.classList.remove('recording');
        document.getElementById('recording-info').style.display = 'none';
        toast(`录音出错：${data}`);
      }
    }
  );
}

function startTimer() {
  secondsElapsed = 0;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const m = String(Math.floor(secondsElapsed/60)).padStart(2,'0');
    const s = String(secondsElapsed%60).padStart(2,'0');
    document.getElementById('timer-text').textContent = `${m}:${s}`;
  }, 1000);
}
function stopTimer() { clearInterval(timerInterval); }

// ===== 创建日记 =====
async function createDiary(rawText) {
  showLoading('AI 正在写日记...');
  try {
    const prompt = `用户上传了一张照片并描述了它："${rawText}"\n请基于描述生成温暖的日记。`;
    const result = await polishDiary(prompt);
    const diary = {
      id: generateId(), rawText,
      title: result.title, content: result.content,
      tags: result.tags, mood: result.mood, quote: result.quote,
      imageData: currentPhoto,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await saveDiary(diary);
    hideLoading();
    updateFloatingCard(diary);
    window.location.hash = `#detail/${diary.id}`;
  } catch (err) { hideLoading(); toast(`生成失败：${err.message}`); }
}

// ===== 加载已有日记的粒子 =====
async function loadDiaryParticles(diary) {
  if (!diary.imageData) return;
  try {
    particles.destroy();
    const container = document.getElementById('portal-inner');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) * 2;
    particles.initCanvas(container, size, size);
    const imgData = await particles.loadImage(diary.imageData);
    particles.generate(imgData, size, size, 25000);
    particles.startAnim();
  } catch { /* ignore */ }
}

// ===== 聊天 =====
export async function sendChat(diaryId, msg) {
  const diary = await getDiary(diaryId);
  if (!diary) throw new Error('日记不存在');
  const reply = await chatAboutDiary(diary.content, msg, chatHistory);
  chatHistory.push({ role:'user', parts:[{text:msg}] }, { role:'model', parts:[{text:reply}] });
  return reply;
}
export function clearChat() { chatHistory = []; }
export async function removeDiary(id) { await dbDel(id); window.location.hash='#main'; }
