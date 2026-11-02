# BU想SAN班｜釜山 4 人行 2026.11

單一 HTML 的旅遊行程網站（`index.html`），日系繪本風，手機優先。

## 內容
- 首頁插圖、出發倒數
- 航班卡片（7C6164 去程、KE2085 回程）
- 每日行程（Day 1 到 Day 5）：交通標籤、必去標記、Naver Map 連結
- 花費試算（1 台幣＝40 韓元）與釜山 Pass 48HR 值回票價
- 可打勾的待辦清單（存在瀏覽器 localStorage）
- 住宿資訊

## 用 GitHub Pages 發布
1. 把這個資料夾推到 GitHub repo。
2. Settings → Pages → Branch 選 `main`、資料夾選 `/ (root)`。
3. 幾分鐘後就能用 `https://<帳號>.github.io/<repo>/` 開啟。

## 資料來源
行程資料整理在 Notion「韓國旅遊行程」（航班、住宿、每日行程、待辦、花費試算）。
網頁裡的資料放在 `index.html` 的 `FLIGHTS`、`DAYS`、`BACKUPS`、`TODOS`、`STAYS`，Notion 改完後同步到這裡即可。

## Naver Map 連結
景點用韓文名稱搜尋：`https://map.naver.com/p/search/<韓文名稱>`。
手機有裝 Naver Map 時通常會跳到 App。
