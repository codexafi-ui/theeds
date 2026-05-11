# Threads/X SNSアフィリエイト自動化 手順書

この文書は、今回 `koimemo_life` / `totonoeru_love` アカウント向けに行った自動化を、1から再現するための手順書です。

秘密情報は絶対にこの文書やGitHubに直接書かないでください。

## 1. 作ったアカウント

### X

```text
https://x.com/koimemo_life
```

### Threads

```text
https://www.threads.com/@totonoeru_love
```

### Instagram

```text
https://www.instagram.com/totonoeru_love/
```

ThreadsはInstagramアカウントに紐づくため、先にInstagramを作り、その後Threadsを作成しました。

## 2. アカウントの方向性

テーマ:

```text
恋愛・婚活で不安になりやすい人向けの自分磨き・気持ち整理アカウント
```

基本方針:

```text
本投稿はリンクなしで価値提供
リンク誘導は自分への返信・プロフィール・固定投稿に分ける
noteや記事内にPR表記つきでアフィリエイトリンクを置く
```

プロフィール文:

```text
恋愛・婚活で不安になりやすい人へ。
追いかける前に、自分の気持ち・清潔感・習慣を整えるメモを発信。
返信不安 / 婚活疲れ / 自分磨き
※一部PRを含むリンクがあります
```

## 3. 作成したアイコン

ローカル:

```text
C:\Users\major\Documents\Codex\2026-05-09\sns-sns\assets\profile-icon-koimemo.png
```

GitHub:

```text
assets/profile-icon-koimemo.png
```

作成スクリプト:

```text
create_profile_icon.ps1
```

再生成:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\create_profile_icon.ps1
```

## 4. 楽天アフィリエイト自動取得

楽天商品検索APIを使い、楽天アフィリエイトURL付きの商品リストを取得する仕組みを作りました。

主なファイル:

```text
fetch_rakuten_affiliate_links.ps1
rakuten_keywords_auto.tsv
rakuten_affiliate_links.tsv
rakuten_human_posts.tsv
```

必要な情報:

```text
楽天アプリID
楽天アクセスキー
楽天アフィリエイトID
Referer URL
```

実行例:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\fetch_rakuten_affiliate_links.ps1 `
  -ApplicationId "楽天アプリID" `
  -AccessKey "楽天アクセスキー" `
  -AffiliateId "楽天アフィリエイトID" `
  -Referer "https://note.com/"
```

注意:

```text
A8やもしもはログイン管理画面からの自動スクレイピングは避ける
楽天は公式APIで取得する
```

## 5. 投稿生成の考え方

商品リンクを直接投稿すると業者感が強くなるため、以下の設計にしました。

```text
SNS本投稿:
リンクなし・悩み解決・共感・気づき

自分への返信:
プロフィールや固定投稿への軽い誘導

note/記事:
PR表記つきで商品・サービスリンク
```

自動生成ファイル:

```text
generate_daily_affiliate_ops.mjs
generate_week_ops.mjs
github_precheck_today.mjs
publish_social_queue.mjs
```

テーマ定義:

```text
content_themes.tsv
```

日次生成:

```powershell
node generate_daily_affiliate_ops.mjs 2026-05-10
```

週次生成:

```powershell
node generate_week_ops.mjs --start 2026-05-10 --days 7
```

## 6. 投稿時間の設計

完全ランダムではなく、ターゲットが見やすい夜帯の中でばらけさせました。

Threads:

```text
1本目: 20:00〜21:40
2本目: 21:45〜23:30
```

GitHub Actionsは1時間ごとに見回り、予定時刻から420分以内の投稿だけ実行します。投稿済みのものは `published_state/YYYY-MM-DD.json` に記録して二重投稿を防ぎます。

```text
GitHub Actions:
1時間ごとに起動

06_posting_schedule.csv:
日ごとの投稿予定時刻

publish_social_queue.mjs:
予定時刻から35分以内なら投稿
```

## 7. Meta for Developers / Threads API設定

### 7.1 Meta for Developers登録

1. [Meta for Developers](https://developers.facebook.com/) にアクセス
2. Facebookアカウントでログイン
3. 開発者登録
4. アプリを作成

アプリ名:

```text
Koimemo Threads Scheduler
```

ユースケース:

```text
Threads APIにアクセス
```

ビジネスポートフォリオ:

```text
現時点ではリンクしない
```

### 7.2 必要な権限

```text
threads_basic
threads_content_publish
```

両方を追加し、`テスト準備完了` にしました。

### 7.3 コールバックURL

Metaの設定画面で、リダイレクトURLはチップ化が必要でした。

最終的に使ったURL:

```text
https://example.com/callback
```

入力後、Enterで確定して保存。

### 7.4 OAuth認証URL

ブラウザで以下の形のURLを開きます。

```text
https://threads.net/oauth/authorize?client_id=THREADS_APP_ID&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&scope=threads_basic%2Cthreads_content_publish&response_type=code
```

許可後、ブラウザURLが以下の形になります。

```text
https://example.com/callback?code=...
```

このURL全体をコピーし、補助スクリプトに貼ります。

## 8. Threadsトークン取得

補助スクリプト:

```text
threads_oauth_helper.ps1
```

実行:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\threads_oauth_helper.ps1
```

入力するもの:

```text
callback URL全体
Threads app secret
```

成功すると以下が表示されます。

```powershell
$env:THREADS_ACCESS_TOKEN="..."
$env:THREADS_USER_ID="..."
```

ローカル予約実行用に保存:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\set_threads_env.ps1
```

## 9. ローカル投稿・予約

ドライラン:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\dryrun_threads.ps1
```

即投稿:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\publish_threads.ps1
```

Windowsタスクスケジューラで予約:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\schedule_threads_posts.ps1
```

注意:

```text
WindowsタスクスケジューラはPCが起動していないと予定通り動かない
```

そのため、最終的にGitHub Actions化しました。

## 10. GitHub Actions化

対象リポジトリ:

```text
https://github.com/codexafi-ui/theeds
```

追加した主なファイル:

```text
.github/workflows/threads-auto-publish.yml
package.json
generate_daily_affiliate_ops.mjs
generate_week_ops.mjs
github_precheck_today.mjs
publish_social_queue.mjs
content_themes.tsv
weekly_schedule.md
daily_ops/
```

push済みコミット:

```text
Prepare Threads affiliate automation
Allow manual Threads publish immediately
Require single post for manual publish
Prepare weekly Threads posting schedule
```

## 11. GitHub Secrets設定

GitHubリポジトリで:

```text
Settings
-> Secrets and variables
-> Actions
-> New repository secret
```

追加したSecret:

```text
THREADS_ACCESS_TOKEN
THREADS_USER_ID
```

注意:

```text
値はチャットやGitHubファイルに貼らない
Secretsにだけ保存する
```

## 12. GitHub Actionsの動き

ワークフロー:

```text
Threads Auto Publish
```

ファイル:

```text
.github/workflows/threads-auto-publish.yml
```

動作:

```text
30分ごとに起動
↓
当日分の投稿キューを生成/確認
↓
投稿前チェック
↓
予定時刻から420分以内のThreads投稿だけ実行
```

手動実行:

```text
Actions
-> Threads Auto Publish
-> Run workflow
```

dry_run:

```text
true: 投稿せずテスト
false: 実投稿
```

手動で `dry_run=false` にする場合は、`post` で1本だけ選ぶ仕様にしました。

```text
Threads Post 1
Threads Post 2
```

未選択ならエラーで止まります。

## 13. 今週分の投稿予約

生成済み期間:

```text
2026-05-10 〜 2026-05-16
```

スケジュール:

```text
2026-05-10: 21:03 / 23:25
2026-05-11: 20:38 / 22:35
2026-05-12: 20:13 / 21:46
2026-05-13: 21:30 / 22:42
2026-05-14: 21:05 / 21:53
2026-05-15: 20:40 / 22:49
2026-05-16: 20:15 / 22:00
```

確認ファイル:

```text
weekly_schedule.md
```

## 14. 投稿前チェック

GitHub Actions上では、現時点でローカル判定を行います。

チェック内容:

```text
URLが本投稿に入っていないか
PR・商品・リンクなど商業色が強すぎないか
絶対、必ず、痩せる、儲かる、復縁できる等の断定がないか
事件・災害・訃報などのセンシティブ語がないか
```

注意:

```text
GitHub Actions版はリアルタイムニュース検索までは未実装
```

必要なら今後、検索APIやニュースAPIを追加します。

## 15. 週次分析

分析用プロンプト:

```text
weekly_analysis_prompt.md
```

分析スクリプト:

```text
analyze_social_csv.mjs
```

使い方:

```powershell
node analyze_social_csv.mjs your_analytics.csv weekly_analysis_report.md
```

月曜の投稿生成では、`weekly_analysis_report.md` を前提として読み込むルールを入れています。

ただし初週は分析レポートが存在しないため、GitHub Actionsでは `BOOTSTRAP_WITHOUT_WEEKLY_ANALYSIS=1` を設定し、リンクなし投稿は止めないようにしました。

## 16. 注意点

### Threadsトークン期限切れ

`THREADS_ACCESS_TOKEN` は期限切れする可能性があります。

エラー例:

```text
Invalid OAuth access token
The access token expired
Error validating access token
```

対処:

```text
1. threads_oauth_helper.ps1 でトークンを取り直す
2. exchange_threads_long_lived_token.ps1 で長期トークンに交換する
3. GitHub Secrets の THREADS_ACCESS_TOKEN を長期トークンに更新
```

短期トークンのままだと短時間で期限切れします。長期トークンは公式の `GET https://graph.threads.net/access_token` で `grant_type=th_exchange_token` を使って交換します。

### 二重投稿

手動実行で `dry_run=false` を使う時は、必ず `post` を1つ選びます。

```text
Threads Post 1
Threads Post 2
```

### Bot判定対策

やっていること:

```text
投稿時刻を夜帯の中で日ごとにばらす
本投稿にリンクを入れない
返信で軽く誘導
同一時刻固定投稿を避ける
```

やっていないこと:

```text
人間らしいマウス操作の模倣
自動いいね
自動フォロー
大量リプライ
スクレイピング
```

## 17. 次回同じことをやる最短手順

```text
1. Instagram/Threads/Xアカウントを作る
2. Meta for DevelopersでThreads APIアプリを作る
3. threads_basic / threads_content_publish を追加
4. OAuthでThreadsトークンを取得
5. GitHubに自動化コードをpush
6. GitHub Secretsに THREADS_ACCESS_TOKEN / THREADS_USER_ID を入れる
7. generate_week_ops.mjs で週次投稿を生成
8. GitHub Actionsでdry_run=true
9. 問題なければActionsを有効化して自動運用
```
