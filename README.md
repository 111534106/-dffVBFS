# Discord 自用音樂機器人架設指南

這是一個專為個人使用設計的 Discord 音樂機器人，支援 YouTube 連結播放。本指南將引導您從零開始完成設定與啟動。

## 📋 目錄
1. [前置準備](#1-前置準備)
2. [申請 Discord Bot](#2-申請-discord-bot)
3. [專案設定](#3-專案設定)
4. [啟動機器人](#4-啟動機器人)
5. [使用說明](#5-使用說明)

---

## 1. 前置準備
在開始之前，請確保您的電腦已安裝以下軟體：
- **Node.js** (建議版本 16.9.0 以上): [下載連結](https://nodejs.org/)
- **Git** (選用，方便管理代碼): [下載連結](https://git-scm.com/)

---

## 2. 申請 Discord Bot

1.  前往 [Discord Developer Portal](https://discord.com/developers/applications) 並登入您的帳號。
2.  點擊右上角的 **"New Application"**。
3.  輸入機器人名稱（例如：`MyMusicBot`），勾選同意條款後點擊 **Create**。

### 取得必要的資訊 (稍後會用到)
在剛建立的應用程式頁面中：

**取得 Client ID:**
1.  點擊左側選單的 **"OAuth2"** -> **"General"**。
2.  複製 **"Client ID"**，先記在筆記本上。

**取得 Token:**
1.  點擊左側選單的 **"Bot"**。
2.  點擊 **"Reset Token"**，複製顯示的 Token 字串（**請勿外洩此 Token**）。
3.  **重要設定：** 在同一個頁面往下滑，找到 **"Message Content Intent"**，將其開關切換為 **ON**。
4.  點擊下方的 **"Save Changes"**。

### 邀請機器人到您的伺服器
1.  點擊左側選單的 **"OAuth2"** -> **"URL Generator"**。
2.  在 **Scopes** 區塊勾選：
    - `bot`
    - `applications.commands`
3.  在 **Bot Permissions** 區塊勾選：
    - `Connect` (連線)
    - `Speak` (發言/播放聲音)
    - 或者直接勾選 `Administrator` (管理員權限，最省事)。
4.  複製最下方的 **Generated URL**，貼到瀏覽器，選擇您的伺服器並授權。

---

## 3. 專案設定

### 填寫設定檔
1.  回到您的專案資料夾。
2.  找到名為 `.env` 的檔案（如果沒有，請建立一個）。
3.  使用記事本或程式碼編輯器開啟它，並填入剛才取得的資訊：

```env
DISCORD_TOKEN=您的_BOT_TOKEN_貼在這裡
CLIENT_ID=您的_CLIENT_ID_貼在這裡
GUILD_ID=您的_Discord伺服器_ID_貼在這裡
```
> **如何取得伺服器 ID (Guild ID)?**
> 在 Discord 中開啟「使用者設定」->「進階」-> 開啟「開發者模式」。然後對著您的伺服器圖示按右鍵，選擇「複製伺服器 ID」。

---

## 4. 啟動機器人

請在專案資料夾中開啟終端機 (PowerShell 或 CMD)，依序執行以下指令：

### 步驟一：安裝依賴 (如果您是第一次執行)
```bash
npm install
```

### 步驟二：註冊指令
告訴 Discord 您的機器人有哪些功能（只需執行一次，或有新增指令時執行）。
```bash
npm run deploy
```
*成功時會顯示：`成功註冊伺服器專用指令！`*

### 步驟三：啟動
```bash
npm run dev
```
*成功時會顯示：`機器人已上線: XXX#1234`*

---

## 5. 使用說明

1.  **進入語音頻道**：請先讓自己加入一個語音頻道。
2.  **播放音樂**：
    在文字頻道輸入：
    ```
    /123播放 query: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    ```
    *(機器人會加入您的頻道並開始播放)*
3.  **停止/離開**：
    輸入：
    ```
    /stop
    ```

### 常見問題
*   **機器人沒反應？** 檢查終端機是否有錯誤訊息，或確認 Token 是否正確。
*   **沒聲音？** 檢查機器人是否有該語音頻道的權限，或 Discord 音量是否被靜音。
*   **指令沒出現？** 試著重新啟動 Discord (Ctrl+R)，或確認 `GUILD_ID` 是否正確並重新執行 `npm run deploy`。

---
**享受您的私人 DJ 吧！** 🎵
