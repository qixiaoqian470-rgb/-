// 界面渲染模块
// 负责把数据变成屏幕上的 HTML 元素

import { getDiary } from './db.js';
import { formatDate, shortDate, timeOnly, escapeHtml } from './utils.js';
import { sendChat, clearChat } from './diary.js';

// ===== 首页 =====
export function renderMain(diaries) {
  const c = document.getElementById('page-main');
  if (!c) return;

  const hasDiary = diaries && diaries.length > 0;

  c.innerHTML = `
    <div class="top-bar">
      <span class="brand-name">🌙 梦中日记本</span>
      <div class="top-tabs">
        <span class="tab active">日记</span>
        <span class="tab">助手</span>
        <span class="tab">备忘录</span>
      </div>
      <span class="menu-icon" id="menu-btn">☰</span>
    </div>

    <div class="particle-area" id="particle-area">
      ${hasDiary
        ? `<div class="ai-label"><span class="ai-dot"></span><span>Claude</span></div>
           <div class="particle-placeholder">
             <span class="placeholder-icon">⛩️</span>
             <span class="placeholder-hint">← 滑动切换日记 →</span>
           </div>
           <div class="swipe-dots" id="swipe-dots"></div>`
        : `<div class="particle-placeholder">
             <span class="placeholder-icon">📖</span>
             <span class="placeholder-hint">点击下方麦克风</span>
             <span class="placeholder-hint">创建你的第一篇日记</span>
           </div>`
      }
    </div>

    <div class="main-actions">
      <button class="mic-btn" id="btn-mic">🎤</button>
      <button class="new-diary-btn" id="btn-new">＋新建日记</button>
    </div>
  `;
}

// ===== 日记详情页 =====
export async function renderDetail(id) {
  const diary = await getDiary(id);
  const c = document.getElementById('page-detail');
  if (!c) return;
  if (!diary) { c.innerHTML = '<p class="error-msg">日记不存在</p>'; return; }

  clearChat();

  c.innerHTML = `
    <div class="top-bar">
      <span class="brand-name">🌙 梦中日记本</span>
      <div class="top-tabs">
        <span class="tab active">日记</span>
        <span class="tab">助手</span>
        <span class="tab">备忘录</span>
      </div>
      <span class="menu-icon" id="menu-btn">☰</span>
    </div>

    <div class="diary-card" id="diary-card">
      <!-- AI 标识 -->
      <div class="card-ai">
        <span class="ai-dot"></span><span>Claude</span>
      </div>

      <!-- 标题 + 元数据 -->
      <div class="card-head">
        <h2 class="card-title">${escapeHtml(diary.title)}</h2>
        <div class="card-info">
          <span>${shortDate(diary.createdAt)}</span>
          <span>${timeOnly(diary.createdAt)}</span>
          <span>@Jasmine n CLAUDE</span>
          <span>—</span>
        </div>
      </div>

      <!-- 正文 -->
      <div class="card-body" id="card-body">
        ${diary.content.split('\n').filter(p => p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      </div>

      <!-- 间隔 -->
      <div class="card-gap">· · ·</div>

      <!-- AI 聊天区 -->
      <div class="chat-zone">
        <div class="chat-label">
          <span class="ai-dot sm"></span><span>Claude · 聊聊这篇日记</span>
        </div>
        <div class="chat-msgs" id="chat-msgs"></div>
        <div class="chat-bar">
          <input class="chat-input" id="chat-input" placeholder="继续聊聊这篇日记...">
          <button class="chat-btn" id="chat-btn">🎤</button>
        </div>
      </div>
    </div>

    <!-- 底部按钮（卡片外） -->
    <div class="detail-btns">
      <button class="act-btn save" id="btn-save">↓</button>
      <button class="act-btn" id="btn-copy">📋</button>
      <button class="act-btn del" id="btn-del">✕</button>
    </div>
  `;

  bindDetailEvents(id);
}

function bindDetailEvents(id) {
  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    const d = await getDiary(id);
    await navigator.clipboard.writeText(`${d.title}\n\n${d.content}`);
    toast('已复制到剪贴板 ✓');
  });

  document.getElementById('btn-del')?.addEventListener('click', async () => {
    if (!confirm('确定删除这篇日记吗？')) return;
    const { removeDiary } = await import('./diary.js');
    await removeDiary(id);
  });

  document.getElementById('btn-save')?.addEventListener('click', () => {
    toast('日记已自动保存 ✓');
  });

  const send = async () => {
    const inp = document.getElementById('chat-input');
    const msg = inp.value.trim();
    if (!msg) return;
    addChatBubble('user', msg);
    inp.value = '';
    try {
      const reply = await sendChat(id, msg);
      addChatBubble('ai', reply);
    } catch (err) {
      addChatBubble('ai', '暂时无法回复，请检查网络和 API Key');
    }
  };

  document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') send();
  });
  document.getElementById('chat-btn')?.addEventListener('click', send);
}

function addChatBubble(role, text) {
  const c = document.getElementById('chat-msgs');
  if (!c) return;
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = role === 'ai'
    ? `<span class="avatar">🤖</span><span class="bub">${escapeHtml(text)}</span>`
    : `<span class="bub">${escapeHtml(text)}</span><span class="avatar me">J</span>`;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

// ===== 通用 =====
export function showLoading(msg = '加载中...') {
  let el = document.getElementById('loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loader';
    el.className = 'loader';
    document.body.appendChild(el);
  }
  el.innerHTML = `<p>${msg}</p>`;
  el.classList.remove('hidden');
}

export function hideLoading() {
  document.getElementById('loader')?.classList.add('hidden');
}

export function toast(msg) {
  alert(msg); // 简单弹窗，后续可改成更好看的提示
}
