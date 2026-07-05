require('dotenv').config();
const { Client, GatewayIntentBits, Events, MessageFlags } = require('discord.js');
const fetch = require('node-fetch');
const deployCommands = require('./deploy-commands');

// 起動時にスラッシュコマンドを自動で登録
deployCommands();

const {
  DISCORD_TOKEN,
  KURA_API_KEY,
  KURA_API_BASE_URL,
} = process.env;

if (!DISCORD_TOKEN) {
  console.error('エラー: DISCORD_TOKEN が .env に設定されていません。');
  process.exit(1);
}
if (!KURA_API_KEY) {
  console.error('エラー: KURA_API_KEY が .env に設定されていません。');
  process.exit(1);
}
if (!KURA_API_BASE_URL) {
  console.error('エラー: KURA_API_BASE_URL が .env に設定されていません。');
  process.exit(1);
}

const KURA_ENDPOINT = `${KURA_API_BASE_URL.replace(/\/$/, '')}/api/v1/ai`;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const DISCORD_MESSAGE_LIMIT = 2000;

/**
 * Discordの2000文字制限に合わせてテキストを分割する
 */
function splitMessage(text, limit = DISCORD_MESSAGE_LIMIT) {
  if (text.length <= limit) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > limit) {
    let sliceIndex = remaining.lastIndexOf('\n', limit);
    if (sliceIndex <= 0) sliceIndex = limit;
    chunks.push(remaining.slice(0, sliceIndex));
    remaining = remaining.slice(sliceIndex);
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Kura AI API を呼び出す
 */
async function callKuraAI(prompt) {
  const response = await fetch(KURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KURA_API_KEY,
    },
    body: JSON.stringify({ prompt }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // JSONとして解釈できないレスポンスの場合はそのまま下で処理
  }

  if (!response.ok) {
    const errorMessages = {
      400: '必須パラメータ (prompt) が不足しています。',
      401: 'API キーが指定されていないか無効です。管理者に確認してください。',
      429: 'レート制限(1分間20回)に達しました。しばらく待ってから再度お試しください。',
      500: 'すべてのAIプロバイダーで応答に失敗しました。しばらくしてから再度お試しください。',
    };
    const message = errorMessages[response.status] || `不明なエラーが発生しました (HTTP ${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  if (!data || data.status !== 'success' || typeof data.text !== 'string') {
    throw new Error('Kura AI から予期しない形式のレスポンスが返されました。');
  }

  return data.text;
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Kura AI Bot が起動しました: ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'kura_ai') return;

  const prompt = interaction.options.getString('prompt', true);

  await interaction.deferReply();

  try {
    const text = await callKuraAI(prompt);
    const chunks = splitMessage(text);

    // 最初のチャンクは editReply、以降は followUp で送信
    await interaction.editReply(chunks[0]);
    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp(chunks[i]);
    }
  } catch (error) {
    console.error('Kura AI 呼び出しエラー:', error);
    const message = error.message || '不明なエラーが発生しました。';
    await interaction.editReply(`⚠️ エラー: ${message}`);
  }
});

client.login(DISCORD_TOKEN);

// Render等のホスティングサービス用：ヘルスチェックを受け付ける簡易HTTPサーバー
const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Kura AI Bot is running!\n');
});

server.listen(PORT, () => {
  console.log(`Webサーバーがポート ${PORT} で起動しました（ヘルスチェック用）`);
});
