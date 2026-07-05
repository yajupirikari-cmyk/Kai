# Kura AI Discord Bot

Kura AI の API を使い、Discord上で `/kura_ai` コマンドから質問できるBotです。

## セットアップ手順

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. Discord Bot の準備(まだ作成していない場合)
1. https://discord.com/developers/applications にアクセスし、「New Application」でアプリを作成
2. 左メニュー「Bot」→「Reset Token」でBotトークンを取得(これが `DISCORD_TOKEN`)
3. 左メニュー「General Information」の「Application ID」をコピー(これが `DISCORD_CLIENT_ID`)
4. 「Bot」設定内で "MESSAGE CONTENT INTENT" 等は今回不要(スラッシュコマンドのみ使用)
5. 「OAuth2」→「URL Generator」で `bot` と `applications.commands` にチェックを入れ、生成されたURLからBotをサーバーに招待

### 3. 環境変数の設定
`.env.example` を `.env` にコピーして中身を編集します。

```bash
cp .env.example .env
```

`.env` の中身:
```
DISCORD_TOKEN=あなたのBotトークン
DISCORD_CLIENT_ID=あなたのApplication ID
KURA_API_KEY=kura_xxxxxxxxxxxxxxxxxxxx
KURA_API_BASE_URL=https://kuraai.runable.site/
```

⚠️ **APIキーについて**: `KURA_API_KEY` には Kura AI の管理画面で発行した API キーを設定してください。`.env` ファイルは他人と共有したり、Gitにコミットしたりしないでください(`.gitignore` に追加推奨)。

### 4. スラッシュコマンドの登録
```bash
npm run deploy
```
実行するとグローバルコマンドとして登録されます。Discord側の仕様により、各サーバーに `/kura_ai` コマンドが表示されるまでに最大1時間程度かかる場合があります。

### 5. Bot の起動
```bash
npm start
```

### 6. 使い方
Discord上で以下のように入力します。
```
/kura_ai prompt: Kura AI のアーキテクチャについて教えてください。
```

## 実装している主な機能
- `/kura_ai` スラッシュコマンド(`prompt` オプション必須)
- Kura AI API (`POST /api/v1/ai`) 呼び出し、`x-api-key` ヘッダーによる認証
- Discordの2000文字制限に対応した長文自動分割送信
- API側のエラーコード(400 / 401 / 429 / 500)に応じたわかりやすいエラーメッセージ表示

## Render.com へのデプロイ手順

このプロジェクトには、Render.com に簡単にデプロイできるように `render.yaml` が用意されています。

### デプロイ方法
1. このプロジェクト（`files` フォルダの中身）を自身の **GitHub リポジトリ** にプッシュします。
2. Render.com ( https://render.com/ ) にログインします。
3. ダッシュボードから **「New +」** -> **「Blueprint」** を選択します。
4. 先ほどプッシュした GitHub リポジトリを連携・選択します。
5. Blueprint の名前（任意）を入力すると、自動的に `render.yaml` が読み込まれます。
6. 以下の環境変数（Environment Variables）の入力を求められるので、値を設定します。
   - `DISCORD_TOKEN`: あなたのDiscord Botトークン
   - `DISCORD_CLIENT_ID`: DiscordのApplication ID
   - `KURA_API_KEY`: Kura AIのAPIキー
   - `KURA_API_BASE_URL`: デフォルトで `https://kuraai.runable.site/` が設定されていますが、変更が必要な場合は上書きしてください。
7. **「Apply」** をクリックするとビルドおよびデプロイが開始され、完了すると Discord Bot が常時稼働します。

※ Renderの無料枠（Web Service）の仕様上、ポートを監視してリクエストを受け付ける必要があります。そのため、`index.js` には簡易的な HTTP サーバー（ヘルスチェック用）が追加されています。
