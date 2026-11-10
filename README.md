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
- 記帳頁（`ledger.html`）：旅途中的實際花費與分帳，跟行程頁的預估花費分開

## 用 GitHub Pages 發布
1. 免費帳號的 Pages 需要 repo 是 Public：Settings → Danger Zone → Change visibility。
2. Settings → Pages → Source 選 *Deploy from a branch*，Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
3. 等 1 到 2 分鐘，就能用 <https://ben-2160.github.io/Busan-trip/> 開啟。

## 只改 Notion，網站自動更新
行程資料放在 Notion「韓國旅遊行程」的四個表格（航班、住宿、每日行程、待辦）。
GitHub Action（`.github/workflows/sync-notion.yml`）每 30 分鐘讀一次 Notion，把資料寫進 `index.html`，有變動就自動提交，GitHub Pages 隨後更新。

### 一次性設定（約 5 分鐘）
1. 開 <https://www.notion.so/profile/integrations> → **New integration** → 類型選 Internal → 建立後複製 **Internal Integration Secret**。
2. 在 Notion 開「韓國旅遊行程」頁面 → 右上角 `⋯` → **Connections**（連線）→ 加入剛建立的 integration。底下四個表格會一起授權。
3. 到這個 repo：**Settings → Secrets and variables → Actions → New repository secret**，Name 填 `NOTION_TOKEN`，Value 貼上剛才的 Secret。
4. 到 **Actions** 分頁 → **Sync Notion** → **Run workflow**，約 1 分鐘後 `index.html` 就會是 Notion 最新內容。

之後只要改 Notion。想馬上更新就到 Actions 手動按 Run workflow，不然最多等 30 分鐘。

### 在 Notion 怎麼填
- **每日行程**：`Day`、`日期`、`景點/活動` 一定要填，沒有 `Day` 的列會當成「備案景點」。排序用 `順序`。
- **當日主題**：每天只要在其中一列填，會顯示在當天標題。
- **地圖按鈕**：填 `韓文店名/地名`（韓文最準）。沒填就沒有地圖按鈕，標了「必去」會顯示「地點待填」。
- **預估花費** 用固定格式，網站才算得出數字，多段用「｜」分開：
  - `約 11,000 韓元／人` → 餐飲（有交通方式標籤時算交通）
  - `車資約 5,000 韓元／人` → 交通
  - `購物預算 30,000 韓元／人` → 購物
  - `釜山 Pass 原價 12,000 韓元` → 計入 Pass 值回票價
  - `醫美費用另計，待填` → 只顯示文字，不計算
- **住宿**：`B/C/H/K 每人(韓元)` 填這間住宿每個人要分攤的韓元，網站用它算每人總花費。
- **航班**：機場欄位開頭放代碼，例如 `TPE 臺灣桃園國際機場 T1`；時間填當地時間。
- **待辦**：網站上的打勾只存在每個人自己的手機，不會寫回 Notion。

匯率（1 台幣＝40 韓元）和 Pass 價格（85,000 韓元）寫在 `index.html` 最前面的 `RATE`、`PASS`。

### 本機測試
```
NOTION_TOKEN=secret_xxx node scripts/sync-notion.mjs
```
資料不完整（例如沒有航班或行程）時，腳本會停下來，不會把網站洗成空白。

## 記帳與分帳（`ledger.html`）
記帳是獨立的一頁，跟行程頁的「預估花費」完全分開：行程頁只放出發前的預估，`ledger.html` 只放旅途中實際花掉的錢。兩頁的選單互相有連結。

B、C、H、K 共用同一本帳：誰先付錢就記一筆，可以記韓元或台幣（1 台幣＝40 韓元），平分或自訂金額，自動算出每個人應收／應付與最少的轉帳次數。

共用帳本已經設定好：資料庫網址和帳本代碼都寫在 `ledger.html`（`DEFAULT_DB`、`DEFAULT_TRIP`），打開記帳頁就會自動連線，每個人只要點自己的字母（B／C／H／K）。以前用別的代碼記過帳的手機，打開時會自動把舊資料搬進共用帳本。

Firebase 端只需要做一次：Realtime Database 的**規則**分頁貼上 `database.rules.json` 的內容並**發布**。沒發布的話會顯示「同步失敗」。

注意：
- 代碼寫在公開的網頁裡，知道這個網站的人都能讀寫這本帳。網址只傳給同行的人。
- 旅行結束後，到 Firebase 把規則改回全部 `false`，或刪掉資料庫。
- 「進階設定」裡的「切回本機模式」只會把帳記在那支手機；按「儲存並連線」可連回共用帳本。
- 記帳頁的匯率（`RATE`）寫在 `ledger.html` 裡，要改匯率時兩頁都要改。

## Naver Map 連結
景點用韓文名稱搜尋：`https://map.naver.com/p/search/<韓文名稱>`。
手機有裝 Naver Map 時通常會跳到 App。
