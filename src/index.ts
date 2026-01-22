import { Client, GatewayIntentBits, Interaction } from 'discord.js';
import { MusicManager } from './bot/MusicManager';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

const musicManagers = new Map<string, MusicManager>();

client.once('ready', () => {
    console.log(`機器人已上線: ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, guildId, member } = interaction;

    if (!guildId || !member) return;

    let manager = musicManagers.get(guildId);
    if (!manager) {
        manager = new MusicManager(guildId);
        musicManagers.set(guildId, manager);
    }

    if (commandName === '播放') {
        const query = interaction.options.getString('query', true);
        const voiceChannel = (member as any).voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '你必須先加入語音頻道！', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            await manager.join(voiceChannel.id, voiceChannel.guild.voiceAdapterCreator);
            const title = await manager.addSong(query);
            await interaction.editReply(`✅ 已加入播放清單: **${title}**`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ 發生錯誤，找不到影片或無法播放。');
        }
    }

    if (commandName === '跳過') {
        manager.skip();
        await interaction.reply('⏭️ 已跳過當前歌曲。');
    }

    if (commandName === '暫停') {
        manager.pause();
        await interaction.reply('⏸️ 已暫停播放。');
    }

    if (commandName === '繼續') {
        manager.resume();
        await interaction.reply('▶️ 繼續播放。');
    }

    if (commandName === '清單') {
        const queue = manager.getQueue();
        if (queue.length === 0) {
            await interaction.reply('📭 目前清單是空的。');
        } else {
            const list = queue.map((song, index) => 
                `${index + 1}. **${song.title}** (${song.duration})`
            ).join('\n');
            await interaction.reply(`📜 **播放清單**:\n${list}`.slice(0, 2000));
        }
    }

    if (commandName === '停止') {
        manager.stop();
        await interaction.reply('已停止播放並離開語音頻道。');
    }
});

client.login(process.env.DISCORD_TOKEN);