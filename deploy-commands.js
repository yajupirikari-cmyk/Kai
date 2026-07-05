require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('kura_ai')
    .setDescription('Kura AI に質問します')
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Kura AI への質問・プロンプト')
        .setRequired(true)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!clientId) {
      throw new Error('DISCORD_CLIENT_ID が .env に設定されていません。');
    }

    console.log('スラッシュコマンドを登録しています...');

    if (guildId) {
      // 特定サーバーへの即時反映(開発・テスト向け)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`ギルド(${guildId})にコマンドを登録しました。`);
    } else {
      // グローバル反映(全サーバー、反映まで最大1時間程度かかる場合あり)
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('グローバルコマンドを登録しました。反映まで時間がかかる場合があります。');
    }
  } catch (error) {
    console.error('コマンド登録中にエラーが発生しました:', error);
  }
})();
