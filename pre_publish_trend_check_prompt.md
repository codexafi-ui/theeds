# Pre-Publish Trend And Sensitivity Check Prompt

Use this prompt within a few hours before posting.

## Prompt

これからSNS投稿を公開してよいか、時事・トレンド・炎上リスクの観点で確認してください。

対象投稿:

```text
{{POST_TEXT}}
```

投稿予定:

```text
{{PLATFORM}} / {{SCHEDULED_TIME}}
```

確認すること:

1. 直近の主要ニュース、災害、事件、事故、訃報、社会的炎上と投稿内容が衝突しないか。
2. X/Threadsのトレンド文脈と比べて、不謹慎・軽率・古い情報に見えないか。
3. お金、投資、ダイエット、健康、恋愛、復縁に関して、誇大表現や断定がないか。
4. 外部リンクやPR誘導が本投稿に入っていないか。
5. 投稿を今日出すべきか、延期すべきか。

出力形式:

```text
判定: clear_to_post / needs_rewrite / hold_for_review / do_not_post_today
理由:
修正文:
返信誘導を付ける場合の文:
```

ルール:

- 災害・事件・訃報と恋愛/美容/お金投稿がぶつかる場合は `hold_for_review`。
- 不確かな場合は投稿しない。
- 本投稿にURLは入れない。
- リンク誘導は返信かプロフィールに分ける。
