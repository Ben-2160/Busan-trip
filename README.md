# BU想SAN班｜釜山 4 人行 2026.11

**👉 [點這裡開啟旅遊行程網站](https://ben-2160.github.io/Busan-trip/)**

網址：<https://ben-2160.github.io/Busan-trip/>（需先在 Settings → Pages 啟用，詳見下方）

單一 HTML 的旅遊行程網站（`index.html`），日系繪本風，手機優先。

## 內容
- 首頁插圖、出發倒數
- 航班卡片（7C6164 去程、KE2085 回程）
- 每日行程（Day 1 到 Day 5）：交通標籤、必去標記、Naver Map 連結
- 花費試算（1 台幣＝40 韓元）與釜山 Pass 48HR 值回票價
- 可打勾的待辦清單（存在瀏覽器 localStorage）
- 住宿資訊

## 用 GitHub Pages 發布
1. 免費帳號的 Pages 需要 repo 是 Public：Settings → Danger Zone → Change visibility。
2. Settings → Pages → Source 選 *Deploy from a branch*，Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
3. 等 1 到 2 分鐘，就能用 <https://ben-2160.github.io/Busan-trip/> 開啟。

## 資料來源
行程資料整理在 Notion「韓國旅遊行程」（航班、住宿、每日行程、待辦、花費試算）。
網頁裡的資料放在 `index.html` 的 `FLIGHTS`、`DAYS`、`BACKUPS`、`TODOS`、`STAYS`。
目前只改 Notion 不會自動更新網站，Notion 改完後要同步到這個檔案再推上 GitHub。

## Naver Map 連結
景點用韓文名稱搜尋：`https://map.naver.com/p/search/<韓文名稱>`。
手機有裝 Naver Map 時通常會跳到 App。
