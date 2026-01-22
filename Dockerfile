# 使用 Alpine Linux，體積最小、下載最快
FROM node:18-alpine

# 安裝 Python3, FFmpeg, Git, Make, g++
# 這些是音樂機器人與編譯過程必須的
RUN apk add --no-cache python3 py3-pip ffmpeg git make g++

# 設定工作目錄
WORKDIR /app

# 複製 package.json
COPY package.json ./

# 安裝專案依賴
RUN npm install

# 複製所有程式碼
COPY . .

# 啟動指令
CMD npm run deploy && npm run dev
