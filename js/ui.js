// 界面渲染
import { getDiary } from './db.js';
import { shortDate, timeOnly, escapeHtml } from './utils.js';
import { sendChat, clearChat } from './diary.js';

// ===== 更新浮动卡片 =====
export function updateFloatingCard(diary) {
  if (!diary) {
    document.getElementById('fc-title').textContent = '等待你的第一篇日记';
    document.getElementById('fc-date').textContent = '';
    document.getElementById('fc-text').innerHTML = '上传一张照片，对它说说话<br>AI 会帮你写成温暖的日记';
    document.getElementById('fc-tags').innerHTML = '';
    return;
  }
  document.getElementById('fc-title').textContent = diary.title;
  document.getElementById('fc-date').textContent = shortDate(diary.createdAt) + ' · ' + diary.mood;
  document.getElementById('fc-text').textContent = diary.content.slice(0, 120) + '...';
  const tagsEl = document.getElementById('fc-tags');
  tagsEl.innerHTML = (diary.tags || []).map(t =>
    `<span class="fc-tag">#${escapeHtml(t)}</span>`
  ).join('');
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
      <span class="brand-name">← 返回</span>
      <div class="top-tabs"><span class="tab active">日记</span></div>
      <span class="menu-icon" id="menu-btn">☰</span>
    </div>
    <div class="diary-card" id="diary-card">
      <div class="card-ai"><span class="ai-dot"></span><span>Claude</span></div>
      <div class="card-head">
        <h2 class="card-title">${escapeHtml(diary.title)}</h2>
        <div class="card-info">
          <span>${shortDate(diary.createdAt)}</span>
          <span>${timeOnly(diary.createdAt)}</span>
          <span>@Jasmine n CLAUDE</span>
        </div>
      </div>
      <div class="card-body">${diary.content.split('\n').filter(p=>p.trim()).map(p=>`<p>${escapeHtml(p)}</p>`).join('')}</div>
      <div class="card-gap">· · ·</div>
      <div class="chat-zone">
        <div class="chat-label"><span class="ai-dot sm"></span><span>Claude · 聊聊这篇日记</span></div>
        <div class="chat-msgs" id="chat-msgs"></div>
        <div class="chat-bar">
          <input class="chat-input" id="chat-input" placeholder="聊聊这篇日记...">
          <button class="chat-btn" id="chat-btn">🎤</button>
        </div>
      </div>
    </div>
    <div class="detail-btns">
      <button class="act-btn save" id="btn-save">↓</button>
      <button class="act-btn" id="btn-copy">📋</button>
      <button class="act-btn del" id="btn-del">✕</button>
    </div>
  `;

  document.getElementById('brand-name')?.addEventListener('click',()=>{ window.location.hash='#main'; });
  bindDetailEvents(id);
}

function bindDetailEvents(id) {
  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    const d = await getDiary(id);
    await navigator.clipboard.writeText(`${d.title}\n\n${d.content}`);
    toast('已复制');
  });
  document.getElementById('btn-del')?.addEventListener('click', async () => {
    if (!confirm('确定删除？')) return;
    const { removeDiary } = await import('./diary.js');
    await removeDiary(id);
  });
  document.getElementById('btn-save')?.addEventListener('click', () => toast('已保存 ✓'));
  const send = async () => {
    const inp = document.getElementById('chat-input');
    const msg = inp.value.trim(); if (!msg) return;
    addChatBubble('user', msg); inp.value = '';
    try { addChatBubble('ai', await sendChat(id, msg)); }
    catch { addChatBubble('ai', '暂时无法回复，请检查网络和 API Key'); }
  };
  document.getElementById('chat-input')?.addEventListener('keypress', e => { if (e.key==='Enter') send(); });
  document.getElementById('chat-btn')?.addEventListener('click', send);
}

function addChatBubble(role, text) {
  const c = document.getElementById('chat-msgs'); if (!c) return;
  const d = document.createElement('div'); d.className = `msg ${role}`;
  d.innerHTML = role==='ai'
    ? `<span class="avatar">🤖</span><span class="bub">${escapeHtml(text)}</span>`
    : `<span class="bub">${escapeHtml(text)}</span><span class="avatar me">J</span>`;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}

// ===== 通用 =====
export function showLoading(msg='加载中...') {
  let el = document.getElementById('loader');
  if (!el) { el = document.createElement('div'); el.id='loader'; el.className='loader'; document.body.appendChild(el); }
  el.innerHTML=`<p>${msg}</p>`; el.classList.remove('hidden');
}
export function hideLoading() { document.getElementById('loader')?.classList.add('hidden'); }
export function toast(msg) { alert(msg); }
