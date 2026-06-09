// 语音朗读模块
// 用浏览器自带的"文字转语音"，把日记读出来

let _speaking = false;

// 朗读文字
export function speak(text, rate = 1.0) {
  stop();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = rate;
  const voices = speechSynthesis.getVoices();
  const zh = voices.find(v => v.lang.startsWith('zh'));
  if (zh) u.voice = zh;
  u.onstart = () => { _speaking = true; };
  u.onend = () => { _speaking = false; };
  speechSynthesis.speak(u);
}

// 停止朗读
export function stop() {
  speechSynthesis.cancel();
  _speaking = false;
}

// 正在读吗？
export function isActive() { return _speaking; }
