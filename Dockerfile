# 使用 Alpine Linux
FROM node:18-alpine

# 安裝 Python3, FFmpeg, Git, Make, g++
RUN apk add --no-cache python3 py3-pip ffmpeg git make g++

# 透過 pip 安裝 yt-dlp (避開 GitHub API 限制)
# --break-system-packages 是因為新版 Python 的保護機制，在 Docker 裡可以強制打破
RUN pip3 install --break-system-packages yt-dlp

# 設定工作目錄
WORKDIR /app

# 複製 package.json
COPY package.json ./

# 重要：告訴 youtube-dl-exec 不要自己下載二進制檔
# 因為我們已經用 pip 安裝了，而且 GitHub API 現在限制住了 Render 的 IP
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

# 安裝專案依賴
RUN npm install

# 複製所有程式碼
COPY . .

# 啟動指令
CMD npm run deploy && npm run dev