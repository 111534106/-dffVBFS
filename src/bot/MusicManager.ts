import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
    entersState,
    StreamType
} from '@discordjs/voice';
import play from 'play-dl';
import fs from 'fs';
import path from 'path';

export class MusicManager {
    public readonly guildId: string;
    public queue: { url: string; title: string; duration: string }[] = [];
    private connection: VoiceConnection | null = null;
    private player: AudioPlayer;
    private isPlaying: boolean = false;
    private lastChannelId: string | null = null;
    private lastAdapterCreator: any = null;

    constructor(guildId: string) {
        this.guildId = guildId;
        this.player = createAudioPlayer();

        this.player.on(AudioPlayerStatus.Idle, () => this.handleIdle());

        this.player.on('error', error => {
            console.error('播放器錯誤:', error);
            this.handleIdle();
        });

        // 初始化 Cookies
        this.initCookies();
    }

    private initCookies() {
        const cookiePath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiePath)) {
            try {
                // play-dl 支援讀取 cookie 內容
                // 如果是 Netscape 格式 (cookies.txt)，play-dl 其實沒有直接的 API 讀取檔案
                // 但我們可以讀取內容後傳遞。
                // 這裡我們嘗試最簡單的：如果有 cookies.txt，我們就不做特別設定，
                // 因為 play-dl 主要依賴自己的機制，或者我們需要將 cookies 轉為 JSON。
                // 
                // 為了簡單起見，我們先不手動 setToken，因為 cookies.txt 格式轉換比較麻煩。
                // 如果失敗，我們再考慮進階的 cookie 設定。
                console.log('偵測到 cookies.txt，但 play-dl 需要 JSON 格式或特定的 setToken。');
                console.log('目前先嘗試無 Cookie 或預設機制。');
                
                // 注意：若要讓 play-dl 用 cookie，通常需要將其轉為 JSON 格式
                // 這裡我們先試試看 play-dl 的預設抗擋能力。
            } catch (error) {
                console.error('Cookies 設定失敗', error);
            }
        }
    }

    public async addSong(query: string) {
        let songUrl: string;
        let title: string;
        let duration: string;

        try {
            // 判斷是否為 URL
            if (query.startsWith('http')) {
                // 驗證連結類型
                const type = await play.validate(query);
                if (type === 'yt_video') {
                    const info = await play.video_info(query);
                    songUrl = info.video_details.url;
                    title = info.video_details.title || '未知歌曲';
                    duration = info.video_details.durationRaw;
                } else if (type === 'yt_playlist') {
                    throw new Error('目前暫不支援播放清單，請輸入單曲連結');
                } else {
                    throw new Error('不支援的連結類型');
                }
            } else {
                // 關鍵字搜尋
                const results = await play.search(query, {
                    limit: 1,
                    source: { youtube: 'video' }
                });
                
                if (results.length === 0) {
                    throw new Error('找不到相關影片');
                }
                
                const video = results[0];
                songUrl = video.url;
                title = video.title || '未知歌曲';
                duration = video.durationRaw;
            }

            this.queue.push({ 
                url: songUrl, 
                title: title,
                duration: duration
            });
            
            if (!this.isPlaying) {
                await this.playNext();
            }
            return title;

        } catch (error) {
            console.error('搜尋/解析失敗:', error);
            throw error;
        }
    }

    private async playNext() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            return;
        }

        const song = this.queue[0];
        console.log(`準備播放: ${song.title}`);
        
        try {
            // play-dl 核心串流邏輯
            const stream = await play.stream(song.url, {
                discordPlayerCompatibility: true
            });

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });
            
            this.player.play(resource);
            this.isPlaying = true;
            console.log(`正在播放: ${song.title}`);

        } catch (error) {
            console.error('播放下一首失敗:', error);
            this.queue.shift();
            this.playNext();
        }
    }
    
    private handleIdle() {
        this.queue.shift();
        this.playNext();
    }

    public async join(channelId: string, adapterCreator: any) {
        this.lastChannelId = channelId;
        this.lastAdapterCreator = adapterCreator;

        this.connection = joinVoiceChannel({
            channelId,
            guildId: this.guildId,
            adapterCreator,
        });

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (e) {
                console.log('偵測到非預期斷線，正在嘗試重新建立連線...');
                this.connection?.destroy();
                this.join(this.lastChannelId!, this.lastAdapterCreator);
            }
        });

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
            this.connection.subscribe(this.player);
        } catch (error) {
            this.connection.destroy();
            this.connection = null;
            throw error;
        }
    }

    public pause() { this.player.pause(); }
    public resume() { this.player.unpause(); }
    public skip() { this.player.stop(); }
    public getQueue() { return this.queue; }

    public stop() {
        this.queue = [];
        this.player.stop();
        if (this.connection) {
            this.connection.removeAllListeners();
            this.connection.destroy();
            this.connection = null;
        }
        this.isPlaying = false;
    }
}