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

async function deployCommands() {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const token = process.env.DISCORD_TOKEN;

    if (!token) {
      console.warn('警告: DISCORD_TOKEN が設定されていないため、コマンド登録をスキップします。');
      return;
    }
    if (!clientId) {
      console.warn('警告: DISCORD_CLIENT_ID が設定されていないため、コマンド登録をスキップします。');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(token);
    console.log('グローバルスラッシュコマンドを自動登録しています...');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log('グローバルコマンドの自動登録が完了しました。反映まで時間がかかる場合があります。');
  } catch (error) {
    console.error('自動コマンド登録中にエラーが発生しました:', error);
  }
}

module.exports = deployCommands;

// 直接実行された場合 (npm run deploy など)
if (require.main === module) {
  deployCommands();
}
