# 使用 Node.js 18 作為基底
FROM node:18-bullseye

# 安裝系統套件：Python3 (給 yt-dlp 用)、FFmpeg (音訊轉碼)、build-essential (編譯工具)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 lock 檔
COPY package*.json ./

# 安裝專案依賴
RUN npm install

# 複製所有程式碼
COPY . .

# 編譯 TypeScript
RUN npm run deploy

# 設定啟動指令 (使用 pm2 或直接 node)
# 這裡直接用 ts-node 啟動 (正式環境建議編譯成 js 但 ts-node 比較方便)
CMD ["npm", "run", "dev"]
