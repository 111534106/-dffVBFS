# 使用 Node.js 18 作為基底
FROM node:18-bullseye

# 安裝系統套件：Python3 (給 yt-dlp 用)、FFmpeg (音訊轉碼)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 只複製 package.json (忽略 package-lock.json 以避免 Windows/Linux 衝突)
COPY package.json ./

# 安裝專案依賴 (重新計算依賴樹)
RUN npm install

# 複製所有程式碼
COPY . .

# 啟動指令：先部署指令到 Discord，再啟動機器人
CMD npm run deploy && npm run dev
