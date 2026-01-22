# 使用 Node.js 20
FROM node:20-alpine

# 安裝 Python3, FFmpeg, Git, Make, g++
RUN apk add --no-cache python3 py3-pip ffmpeg git make g++

# 透過 pip 安裝 yt-dlp
RUN pip3 install --break-system-packages yt-dlp

# 設定工作目錄
WORKDIR /app

# 複製 package.json
COPY package.json ./

# 跳過 youtube-dl-exec 自動下載
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

# 安裝專案依賴
RUN npm install

# 複製所有程式碼
COPY . .

# 啟動指令：只執行啟動，不執行 deploy 以加快速度
CMD npm run dev