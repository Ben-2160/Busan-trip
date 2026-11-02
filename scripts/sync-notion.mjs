// 從 Notion 讀取行程，改寫 index.html 內 /*DATA:START*/ ... /*DATA:END*/ 之間的資料。
// 用法：NOTION_TOKEN=secret_xxx node scripts/sync-notion.mjs
// 測試：node scripts/sync-notion.mjs --fixture fixture.json --out out.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const FIXTURE = opt('--fixture');
const HTML_IN = path.resolve(opt('--in') || path.join(ROOT, 'index.html'));
const HTML_OUT = path.resolve(opt('--out') || HTML_IN);

// Notion「韓國旅遊行程」底下四個資料庫的 ID（網址最後那串 32 碼）
const DB = {
  flights: process.env.DB_FLIGHTS || '62842e241c984e82b285c8ae216568c5',
  stays:   process.env.DB_STAYS   || '5c53c839b4f64704bc30d2bfe6916263',
  days:    process.env.DB_DAYS    || '785d60e672e5445384b0e6861d9a8496',
  todos:   process.env.DB_TODOS   || 'eb9846b9f4b648fdbf69776a616d3ae4',
};
const PEOPLE = ['B', 'C', 'H', 'K'];
const TRANSIT = ['計程車', '地鐵', '公車', '機場快線', '高鐵/KTX', '包車'];

/* ---------- Notion API ---------- */
async function queryAll(id, sorts) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('缺少 NOTION_TOKEN');
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}), ...(sorts ? { sorts } : {}) }),
    });
    if (!res.ok) throw new Error(`Notion ${id} 讀取失敗 ${res.status}：${(await res.text()).slice(0, 300)}`);
    const j = await res.json();
    rows.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}

/* ---------- 屬性讀取 ---------- */
const P = (page, name) => (page.properties || {})[name];
const plain = arr => (arr || []).map(x => x.plain_text || '').join('');
const title = (pg, n) => plain((P(pg, n) || {}).title).trim();
const text = (pg, n) => plain((P(pg, n) || {}).rich_text).trim();
const sel = (pg, n) => ((P(pg, n) || {}).select || {}).name || '';
const multi = (pg, n) => (((P(pg, n) || {}).multi_select) || []).map(x => x.name);
const num = (pg, n) => { const v = (P(pg, n) || {}).number; return typeof v === 'number' ? v : 0; };
const check = (pg, n) => !!(P(pg, n) || {}).checkbox;
const url = (pg, n) => (P(pg, n) || {}).url || '';
const dateStart = (pg, n) => (((P(pg, n) || {}).date) || {}).start || '';
// 時間用「看到的數字」就好，不做時區轉換（輸入的就是當地時間）
const isoDay = s => s.slice(0, 10);
const isoMin = s => (s.length > 10 ? s.slice(0, 16) + ':00' : s.slice(0, 10) + 'T00:00:00');

const koFromUrl = u => {
  const m = u && u.match(/\/search\/(.+)$/);
  if (!m) return '';
  try { return decodeURIComponent(m[1]); } catch { return m[1]; }
};

/* ---------- 費用文字 → 數字 ---------- */
// 格式（用「｜」分隔多段）：
//   約 11,000 韓元／人          → 餐飲（有交通方式標籤時視為交通；寫「車資」也算交通）
//   車資約 5,000 韓元／人        → 交通
//   購物預算 30,000 韓元／人     → 購物
//   釜山 Pass 原價 12,000 韓元   → Pass 原價
//   醫美費用另計，待填            → 只顯示文字
export function parseCost(raw, tags = []) {
  const out = {};
  const parts = String(raw || '').replace(/,/g, '').split('｜').map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    let m;
    if ((m = p.match(/Pass\s*原價\s*(\d+)/i))) { out.pass = +m[1]; continue; }
    if ((m = p.match(/購物預算\s*(\d+)/))) { out.cost = +m[1]; out.kind = 'shop'; continue; }
    if ((m = p.match(/約\s*(\d+)\s*韓元/))) {
      out.cost = +m[1];
      if (/車資|交通/.test(p)) out.kind = 'move';
      else if (/餐/.test(p)) out.kind = 'food';
      else out.kind = tags.some(t => TRANSIT.includes(t)) ? 'move' : 'food';
      continue;
    }
    if (/另計|待填|未定/.test(p)) { out.special = p; continue; }
  }
  return out;
}

/* ---------- 各表轉換 ---------- */
export function buildFlights(rows) {
  return rows.map(pg => {
    const split = s => { const m = s.match(/^(\S+)\s*(.*)$/); return m ? [m[1], m[2]] : [s, '']; };
    const [from, fromN] = split(text(pg, '出發機場'));
    const [to, toN] = split(text(pg, '抵達機場'));
    let note = '';
    const meta = text(pg, '行李/備註').split('｜').map(s => s.trim()).filter(Boolean).filter(s => {
      if (/^時間皆為當地時間/.test(s)) { const m = s.match(/[（(]([^）)]*)[）)]/); if (m) note = m[1]; return false; }
      return true;
    });
    return { dir: sel(pg, '方向'), dep: isoMin(dateStart(pg, '出發時間')), arr: isoMin(dateStart(pg, '抵達時間')),
      from, fromN, to, toN, airline: text(pg, '航空公司'), no: text(pg, '班次'), meta, note };
  }).filter(f => f.dep.length > 10).sort((a, b) => (a.dep < b.dep ? -1 : 1));
}

export function buildDays(rows) {
  const byDay = new Map();
  const backups = [];
  for (const pg of rows) {
    const name = title(pg, '景點/活動'); if (!name) continue;
    const day = sel(pg, 'Day');
    const ko = text(pg, '韓文店名/地名') || koFromUrl(url(pg, 'Naver Map 連結'));
    const tags = multi(pg, '交通方式');
    const costRaw = text(pg, '預估花費');
    if (!day) {
      const c = parseCost(costRaw);
      backups.push({ n: name.replace(/^備案[：:]\s*/, ''), ko, price: c.pass || 0, note: text(pg, '簡介/備註'), _o: num(pg, '順序') });
      continue;
    }
    if (!byDay.has(day)) byDay.set(day, { label: day, date: '', theme: '', items: [] });
    const d = byDay.get(day);
    const ds = isoDay(dateStart(pg, '日期'));
    if (ds && !d.date) d.date = ds;
    const th = text(pg, '當日主題'); if (th && !d.theme) d.theme = th;
    d.items.push({ _o: num(pg, '順序'), t: text(pg, '時間'), n: name, tags, must: check(pg, '必去'), ko, note: text(pg, '簡介/備註'), ...parseCost(costRaw, tags) });
  }
  const dayNo = l => +(l.match(/\d+/) || [0])[0];
  const days = [...byDay.values()].filter(d => d.date).sort((a, b) => dayNo(a.label) - dayNo(b.label));
  for (const d of days) {
    d.items.sort((a, b) => a._o - b._o || (a.t < b.t ? -1 : 1));
    d.items.forEach(i => delete i._o);
  }
  backups.sort((a, b) => a._o - b._o); backups.forEach(b => delete b._o);
  return { days, backups };
}

export function buildTodos(rows) {
  return rows.map(pg => {
    const o = { t: title(pg, '待辦事項'), c: sel(pg, '類別') };
    const d = isoDay(dateStart(pg, '期限')); if (d) o.d = d;
    const n = text(pg, '備註'); if (n) o.n = n;
    return o;
  }).filter(x => x.t);
}

export function buildStays(rows) {
  return rows.map(pg => ({
    name: title(pg, '住宿名稱'), inD: isoDay(dateStart(pg, '入住日')), outD: isoDay(dateStart(pg, '退房日')),
    addr: text(pg, '地址'), ko: koFromUrl(url(pg, 'Naver Map 連結')), price: text(pg, '價格'), note: text(pg, '備註'),
    share: Object.fromEntries(PEOPLE.map(id => [id, num(pg, `${id} 每人(韓元)`)])),
  })).filter(s => s.name && s.inD && s.outD).sort((a, b) => (a.inD < b.inD ? -1 : 1));
}

export function replaceDataBlock(html, data) {
  const re = /\/\*DATA:START\*\/[\s\S]*?\/\*DATA:END\*\//;
  if (!re.test(html)) throw new Error('index.html 找不到 /*DATA:START*/ ... /*DATA:END*/ 區塊');
  const json = JSON.stringify(data, null, 1).replace(/<\//g, '<\\/');
  return html.replace(re, () => `/*DATA:START*/\nconst DATA = ${json};\n/*DATA:END*/`);
}

/* ---------- 主程式 ---------- */
async function main() {
  let src;
  if (FIXTURE) src = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  else {
    const [flights, stays, days, todos] = await Promise.all([
      queryAll(DB.flights), queryAll(DB.stays), queryAll(DB.days),
      queryAll(DB.todos, [{ timestamp: 'created_time', direction: 'ascending' }]),
    ]);
    src = { flights, stays, days, todos };
  }
  const { days, backups } = buildDays(src.days);
  const data = { flights: buildFlights(src.flights), days, backups, todos: buildTodos(src.todos), stays: buildStays(src.stays) };

  // 基本檢查：資料太少就不要覆蓋，避免把網站洗成空白
  const problems = [];
  if (!data.flights.length) problems.push('沒有讀到任何航班');
  if (!data.days.length) problems.push('沒有讀到任何每日行程（Day 與日期都要填）');
  if (!data.stays.length) problems.push('沒有讀到任何住宿');
  if (problems.length) { console.error('資料不完整，不更新網站：\n- ' + problems.join('\n- ')); process.exit(1); }

  const out = replaceDataBlock(fs.readFileSync(HTML_IN, 'utf8'), data);
  fs.writeFileSync(HTML_OUT, out);
  const n = data.days.reduce((a, d) => a + d.items.length, 0);
  console.log(`完成：航班 ${data.flights.length}、行程 ${data.days.length} 天 ${n} 項、備案 ${data.backups.length}、待辦 ${data.todos.length}、住宿 ${data.stays.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e.message); process.exit(1); });
}
