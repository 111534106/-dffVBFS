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
                // 讀取 Netscape 格式的 cookies.txt
                const content = fs.readFileSync(cookiePath, 'utf8');
                const lines = content.split('\n');
                
                const cookies: string[] = [];
                
                for (const line of lines) {
                    // 跳過註解和空行
                    if (line.startsWith('#') || !line.trim()) continue;
                    
                    const parts = line.split('\t');
                    // Netscape 格式通常有 7 個欄位，第 6 是 name，第 7 是 value
                    if (parts.length >= 7) {
                        const name = parts[5];
                        const value = parts[6].trim(); // 去除可能的換行符
                        cookies.push(`${name}=${value}`);
                    }
                }
                
                if (cookies.length > 0) {
                    const cookieString = cookies.join('; ');
                    play.setToken({
                        youtube: {
                            cookie: cookieString
                        }
                    });
                    console.log(`✅ play-dl Cookies 設定成功 (載入 ${cookies.length} 個 Cookie)`);
                } else {
                    console.warn('⚠️ cookies.txt 讀取成功但未解析出有效 Cookie');
                }

            } catch (error) {
                console.error('Cookies 設定失敗', error);
            }
        } else {
            console.log('⚠️ 未找到 cookies.txt，將以訪客模式執行');
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