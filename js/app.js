// 主入口
// 负责路由切换、菜单、全局事件

import { loadMain } from './diary.js';
import { renderDetail, showLoading, hideLoading, toast } from './ui.js';
import { render as renderSettings } from './settings.js';

// 页面容器
const pages = {
  main:    document.getElementById('page-main'),
  detail:  document.getElementById('page-detail'),
  settings: document.getElementById('page-settings'),
};

function switchTo(name) {
  Object.values(pages).forEach(p => p.classList.add('hidden'));
  pages[name]?.classList.remove('hidden');
}

// 路由
async function route() {
  const hash = window.location.hash || '#main';
  const [path, id] = hash.split('/');

  if (path === '#settings') {
    switchTo('settings');
    renderSettings();
  } else if (path === '#detail' && id) {
    switchTo('detail');
    showLoading('加载日记...');
    await renderDetail(id);
    hideLoading();
  } else {
    switchTo('main');
    await loadMain();
  }

  // 滚动到顶部
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ===== 菜单 =====
const overlay = document.getElementById('menu-overlay');

document.addEventListener('click', (e) => {
  // 打开菜单
  if (e.target.closest('#menu-btn') || e.target.id === 'menu-btn') {
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="menu-panel">
        <div class="menu-item">
          <span>🎵 背景音乐</span>
          <input type="range" min="0" max="100" value="40" style="width:80px">
        </div>
        <div class="menu-item">
          <span>🔊 音量</span>
          <input type="range" min="0" max="100" value="60" style="width:80px">
        </div>
        <div class="menu-item" id="menu-goto-settings">
          <span>⚙️ 设置</span>
          <span>→</span>
        </div>
      </div>
    `;
    document.getElementById('menu-goto-settings')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
      window.location.hash = '#settings';
    });
    return;
  }

  // 点遮罩关闭
  if (e.target === overlay) {
    overlay.classList.add('hidden');
  }
});
