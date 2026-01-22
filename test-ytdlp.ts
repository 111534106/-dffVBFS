const youtubedl = require('youtube-dl-exec');

(async () => {
    try {
        console.log('正在測試 yt-dlp...');
        const output = await youtubedl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:googlebot'
            ]
        });
        console.log('成功獲取標題:', output.title);
        console.log('成功獲取格式數量:', output.formats.length);
    } catch (error) {
        console.error('yt-dlp 測試失敗:', error);
    }
})();
