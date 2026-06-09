// 工具函数库
// 就像工具箱，放一些各处都要用的小工具

// 生成唯一 ID（每篇日记的"身份证号"）
export function generateId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16));
}

// 格式化日期：把电脑时间格式变成人看的 "2026年6月9日 15:32"
export function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 `
    + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 短日期：卡片上用的 "06/09/26"
export function shortDate(iso) {
  const d = new Date(iso);
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/`
    + `${String(d.getFullYear()).slice(-2)}`;
}

// 时间：只显示 "07:08 PM"
export function timeOnly(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2,'0')}:${m} ${ampm}`;
}

// 防抖：用户快速连点只响应最后一次
// 比如快速点新建按钮，只触发一次
export function debounce(fn, wait = 500) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

// 安全显示文字：避免用户输入的内容被当成代码执行
export function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
