// 设置面板
// 填 API Key、调整朗读参数

export function load() {
  try {
    return JSON.parse(localStorage.getItem('dream-diary-settings') || '{}');
  } catch { return {}; }
}

export function save(obj) {
  localStorage.setItem('dream-diary-settings', JSON.stringify(obj));
}

export function render() {
  const s = load();
  const c = document.getElementById('page-settings');
  if (!c) return;

  c.innerHTML = `
    <div class="top-bar">
      <span class="brand-name" id="btn-back">← 返回</span>
      <span class="brand-name">⚙️ 设置</span>
      <span></span>
    </div>

    <div class="settings-body">
      <div class="set-group">
        <label>Gemini API Key</label>
        <input type="password" class="set-input" id="set-key"
               value="${escapeHtml(s.geminiApiKey || '')}"
               placeholder="粘贴你的 Gemini API Key">
        <p class="set-hint">
          去 <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a> 免费获取
        </p>
      </div>

      <div class="set-group">
        <label>朗读语速：${s.ttsRate || 1.0}x</label>
        <input type="range" id="set-rate" min="0.5" max="2" step="0.1"
               value="${s.ttsRate || 1.0}">
      </div>

      <button class="btn-save" id="btn-save-settings">保存设置</button>
    </div>
  `;

  document.getElementById('btn-back')?.addEventListener('click', () => {
    window.location.hash = '#main';
  });

  document.getElementById('set-rate')?.addEventListener('input', (e) => {
    const lbl = e.target.parentElement.querySelector('label');
    if (lbl) lbl.textContent = `朗读语速：${e.target.value}x`;
  });

  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    save({
      ...load(),
      geminiApiKey: document.getElementById('set-key')?.value || '',
      ttsRate: parseFloat(document.getElementById('set-rate')?.value || '1'),
    });
    alert('设置已保存 ✓');
    window.location.hash = '#main';
  });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
