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
import ytSearch from 'yt-search';
import youtubedl from 'youtube-dl-exec';

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
            // 如果播放器出錯，試著播下一首或重試
            this.handleIdle();
        });
    }

    public async addSong(query: string) {
        let songUrl: string;
        let title: string;
        let duration: string;

        // 共用的 yt-dlp 選項
        const ytdlOptions = {
            noWarnings: true,
            preferFreeFormats: true,
            noCheckCertificates: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            referer: 'https://www.youtube.com/',
            cookies: 'cookies.txt' // 使用 Cookies
        };

        if (query.startsWith('http')) {
            songUrl = query;
            try {
                 const output = await youtubedl(songUrl, {
                     ...ytdlOptions,
                     dumpSingleJson: true,
                     skipDownload: true
                 } as any);
                 // @ts-ignore
                 title = output.title;
                 // @ts-ignore
                 duration = output.duration_string || '??:??';
            } catch (e) {
                console.error('解析失敗', e);
                title = '未知歌曲';
                duration = '??:??';
            }
        } else {
            const result = await ytSearch(query);
            if (!result || !result.videos.length) {
                throw new Error('找不到相關影片');
            }
            const video = result.videos[0];
            songUrl = video.url;
            title = video.title;
            duration = video.timestamp;
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
    }

    private async playNext() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            return;
        }

        const song = this.queue[0];
        console.log(`準備播放: ${song.title}`);
        
        try {
            const process = youtubedl.exec(song.url, {
                output: '-',
                format: 'bestaudio',
                limitRate: '1M',
                noPlaylist: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                referer: 'https://www.youtube.com/',
                cookies: 'cookies.txt'
            } as any, { stdio: ['ignore', 'pipe', 'ignore'] });

            if (!process.stdout) throw new Error('無法啟動 yt-dlp 串流');

            const resource = createAudioResource(process.stdout, {
                inputType: StreamType.Arbitrary
            });
            
            this.player.play(resource);
            this.isPlaying = true;
            console.log(`正在播放: ${song.title}`);

            process.on('error', (err: any) => console.error('yt-dlp 進程錯誤:', err));

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

        // 監聽連線狀態實現自動重連
        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                // 嘗試在 5 秒內重連
                await Promise.race([
                    entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // 如果進入信號交換或連接中，代表正在嘗試自動重連
            } catch (e) {
                // 如果失敗，代表真正斷開了，嘗試完全重新建立連線
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
            this.connection.removeAllListeners(); // 移除重連監聽避免報錯
            this.connection.destroy();
            this.connection = null;
        }
        this.isPlaying = false;
    }
}