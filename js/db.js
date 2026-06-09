// 数据库模块
// 用浏览器自带的 IndexedDB 存日记。比 localStorage 能存更多，而且不卡页面

const DB = 'DreamDiaryDB';
const VER = 1;
let _db = null;

// 打开数据库
function open() {
  return new Promise((ok, fail) => {
    if (_db) return ok(_db);
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('diaries')) {
        const store = db.createObjectStore('diaries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }
    };
    r.onsuccess = (e) => { _db = e.target.result; ok(_db); };
    r.onerror = () => fail(new Error('打不开数据库'));
  });
}

// 存一篇日记（新增或更新）
export function saveDiary(diary) {
  return open().then(db => new Promise((ok, fail) => {
    const tx = db.transaction('diaries', 'readwrite');
    tx.objectStore('diaries').put(diary);
    tx.oncomplete = () => ok();
    tx.onerror = () => fail(new Error('保存失败'));
  }));
}

// 读一篇日记
export function getDiary(id) {
  return open().then(db => new Promise((ok, fail) => {
    const r = db.transaction('diaries').objectStore('diaries').get(id);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(new Error('读取失败'));
  }));
}

// 读全部日记（最新的排前面）
export function getAllDiaries() {
  return open().then(db => new Promise((ok, fail) => {
    const results = [];
    const r = db.transaction('diaries').objectStore('diaries')
      .index('createdAt').openCursor(null, 'prev');
    r.onsuccess = (e) => {
      const c = e.target.result;
      if (c) { results.push(c.value); c.continue(); }
      else ok(results);
    };
    r.onerror = () => fail(new Error('读取失败'));
  }));
}

// 删一篇日记
export function deleteDiary(id) {
  return open().then(db => new Promise((ok, fail) => {
    const tx = db.transaction('diaries', 'readwrite');
    tx.objectStore('diaries').delete(id);
    tx.oncomplete = () => ok();
    tx.onerror = () => fail(new Error('删除失败'));
  }));
}
