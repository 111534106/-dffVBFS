# 使用 Node.js 20
FROM node:20-alpine

# 安裝 Python3, FFmpeg, Git, Make, g++
# yt-dlp 需要 Python3
RUN apk add --no-cache python3 py3-pip ffmpeg git make g++

# 透過 pip 安裝 yt-dlp (避開 GitHub API Rate Limit)
RUN pip3 install --break-system-packages yt-dlp

# 設定工作目錄
WORKDIR /app

# 複製 package.json
COPY package.json ./

# 跳過 youtube-dl-exec 自動下載 (因為我們會手動連結)
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

# 安裝專案依賴
RUN npm install

# --- 關鍵修正：手動連結 yt-dlp ---
# 1. 建立 youtube-dl-exec 預期的 bin 目錄
# 2. 找到 pip 安裝的 yt-dlp 位置 (通常在 /usr/bin/yt-dlp 或 /usr/local/bin/yt-dlp)
# 3. 建立軟連結
RUN mkdir -p node_modules/youtube-dl-exec/bin && \
    ln -s $(which yt-dlp) node_modules/youtube-dl-exec/bin/yt-dlp && \
    chmod +x node_modules/youtube-dl-exec/bin/yt-dlp

# 複製所有程式碼
COPY . .

# 啟動指令
CMD npm run dev
