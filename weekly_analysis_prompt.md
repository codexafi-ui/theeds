# Weekly SNS Analysis Prompt

Use this prompt once a week after exporting X/Threads analytics.

## Prompt

先週のSNS分析をしてください。

入力CSVには以下の列があります。列名が多少違う場合は意味が近い列を推測してください。

- post_text
- posted_at
- impressions
- likes
- replies
- reposts
- profile_clicks
- url_clicks
- follows
- saves

やってほしいこと:

1. 冒頭のフックを抽出してください。目安は投稿の最初の1文、または最初の35文字です。
2. 各投稿について以下を計算してください。
   - engagement_rate = (likes + replies + reposts + saves) / impressions
   - profile_click_rate = profile_clicks / impressions
   - url_click_rate = url_clicks / impressions
   - follow_rate = follows / impressions
3. 反応が良かったフックTOP10を出してください。
4. 反応が悪かったフックTOP10を出してください。
5. 良かった投稿を以下の型に分類してください。
   - 共感
   - NG行動
   - 気づき
   - チェックリスト
   - 体験談
   - 導線投稿
6. 来週増やすべき投稿型を3つ提案してください。
7. 来週のX投稿案を10本、Threads投稿案を7本作ってください。
8. 外部リンク入り投稿とリンクなし投稿で露出差があるか見てください。
9. リンク誘導は本投稿ではなく返信に置く前提で、返信文も3パターン作ってください。

注意:

- 誇大表現は禁止です。
- 「絶対復縁」「必ず痩せる」「これで稼げる」などの断定は禁止です。
- 商品リンクを主役にせず、悩み解決を主役にしてください。
