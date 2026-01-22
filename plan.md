# Discord 音樂機器人開發計畫 (Discord Music Bot)

這是一份構建自用 Discord 音樂機器人的開發指南，目標是輸入 YouTube 網址即可在語音頻道播放音樂。

## 1. 專案概述
- **目標**: 建立一個輕量級、私人使用的 Discord Bot。
- **核心功能**: 支援 YouTube 連結播放、暫停、停止與離開頻道。
- **運行環境**: Node.js (Windows 本地運行)。

## 2. 技術棧選型
為了確保開發效率與程式碼品質，我們將使用以下技術：

- **語言**: TypeScript (提供更好的類型檢查與代碼提示)。
- **核心庫**: `discord.js` (第 14 版，目前的主流標準)。
- **語音庫**: `@discordjs/voice` (Discord 官方語音庫)。
- **音訊處理**: `ffmpeg-static` (無需手動安裝 FFmpeg，透過 npm 管理)。
- **加密庫**: `libsodium-wrappers` (語音連線加密必需)。
- **YouTube 解析**: `play-dl` (目前替代 ytdl-core 較穩定且高效的選擇，支援 YouTube 搜尋與串流)。

## 3. 功能需求清單

### 基礎指令 (Slash Commands)
1.  `/play <url>`:
    - 機器人加入使用者所在的語音頻道。
    - 解析 YouTube 網址。
    - 下載並串流音訊。
    - 如果已有音樂在播放，則加入佇列（Queue）。
2.  `/stop`:
    - 停止播放並清空佇列。
    - 機器人離開語音頻道。
3.  `/skip`:
    - 跳過當前歌曲，播放下一首。
4.  `/queue`:
    - (選用) 顯示目前等待播放的歌曲清單。

## 4. 開發步驟詳細規劃

### 第一階段：環境初始化
1.  初始化 Node.js 專案 (`npm init`).
2.  安裝必要依賴 (`npm install ...`).
3.  配置 TypeScript環境 (`tsconfig.json`).
4.  建立專案結構 (`src/index.ts`, `src/commands/`, `src/bot/`).

### 第二階段：Discord Bot 基礎設置
1.  建立 `Bot` 類別或基礎 Client 設定。
2.  設置 `.env` 檔案以安全存儲 **BOT TOKEN** 和 **CLIENT ID**。
3.  實作 Slash Commands 的註冊機制 (Deploy commands)。
4.  實作 `interactionCreate` 事件監聽，讓機器人能回應指令。

### 第三階段：音樂核心邏輯開發
1.  **語音連線**: 使用 `joinVoiceChannel` 實作進入頻道。
2.  **播放器實作**: 使用 `createAudioPlayer` 和 `createAudioResource`。
3.  **串流處理**: 整合 `play-dl` 將 YouTube 網址轉換為音訊流。
4.  **佇列系統**: 實作一個簡單的 Queue 類別來管理待播清單。

### 第四階段：測試與優化
1.  本地啟動測試。
2.  錯誤處理 (例如：無效網址、使用者不在語音頻道、機器人無權限等)。
3.  優化使用者體驗 (正在播放的訊息提示)。

## 5. 使用者準備工作 (您需要做的)
在開始寫程式碼之前，您需要前往 [Discord Developer Portal](https://discord.com/developers/applications) 申請一個 Bot：
1.  建立 New Application。
2.  在 "Bot" 分頁中取得 **Token**。
3.  開啟 "Message Content Intent" (雖然 Slash Command 不一定需要，但建議開啟以備不時之需)。
4.  透過 OAuth2 URL Generator 將機器人邀請至您的伺服器。

---
**準備好後，我們可以從「第一階段：環境初始化」開始。**
