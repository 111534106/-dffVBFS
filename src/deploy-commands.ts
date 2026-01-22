import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    new SlashCommandBuilder()
        .setName('播放')
        .setDescription('播放音樂 (支援 YouTube 網址或關鍵字)')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('歌曲名稱或網址')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('跳過')
        .setDescription('跳過目前歌曲'),
    new SlashCommandBuilder()
        .setName('停止')
        .setDescription('停止播放並離開語音頻道'),
    new SlashCommandBuilder()
        .setName('暫停')
        .setDescription('暫停播放'),
    new SlashCommandBuilder()
        .setName('繼續')
        .setDescription('繼續播放'),
    new SlashCommandBuilder()
        .setName('清單')
        .setDescription('查看目前的播放清單'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('正在重新註冊中文化 Slash Commands...');

        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
                { body: commands },
            );
            console.log('成功更新伺服器專用中文化指令！');
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands },
            );
            console.log('成功更新全域中文化指令！');
        }
    } catch (error) {
        console.error(error);
    }
})();
