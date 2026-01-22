# 使用較新的 Node.js 18 Bookworm 版本 (通常下載源更穩定)
FROM node:18-bookworm

# 安裝系統套件：Python3 (給 yt-dlp 用)、FFmpeg (音訊轉碼)
# 加入 --fix-missing 並優化下載
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends python3 python3-pip ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 只複製 package.json
COPY package.json ./

# 安裝專案依賴
RUN npm install

# 複製所有程式碼
COPY . .

# 啟動指令
CMD npm run deploy && npm run dev