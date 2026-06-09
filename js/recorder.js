// 录音模块
// 用浏览器自带语音识别，把说出来的话实时转成文字。免费，不用 API Key

let recog = null;
let _recording = false;
let _transcript = '';
let _onText = null;
let _onState = null;

// 检查浏览器能不能用语音识别
export function isSupported() {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

// 开始录音
export function start(onText, onState) {
  if (!isSupported()) throw new Error('浏览器不支持语音识别，请用 Chrome');

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recog = new SR();
  recog.lang = 'zh-CN';
  recog.interimResults = true;
  recog.continuous = true;
  _transcript = '';
  _onText = onText;
  _onState = onState;

  recog.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    if (final) _transcript += final;
    _onText?.(_transcript + interim, interim.length > 0);
  };

  recog.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    _onState?.('error', e.error);
  };

  recog.onstart = () => { _recording = true; _onState?.('start'); };
  recog.onend = () => { _recording = false; _onState?.('stop', _transcript); };

  recog.start();
  return _transcript;
}

// 停止录音
export function stop() {
  recog?.stop();
}

// 当前是否在录音
export function isActive() {
  return _recording;
}

// 获取目前的文字
export function getText() {
  return _transcript;
}

// 清空（准备下次录音）
export function reset() {
  _transcript = '';
}
