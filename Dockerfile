# 使用 Node.js 20
FROM node:20-alpine

# 安裝 Python3, FFmpeg (yt-dlp 執行時需要 Python)
RUN apk add --no-cache python3 ffmpeg

# 設定工作目錄
WORKDIR /app

# 複製 package.json
COPY package.json ./

# 安裝專案依賴 (這會自動下載 yt-dlp binary 到 node_modules)
RUN npm install

# 複製所有程式碼
COPY . .

# 啟動指令
CMD npm run dev
