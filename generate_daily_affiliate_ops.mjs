import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dateArg = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const outputDir = path.join(root, "daily_ops", dateArg);

function readText(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "");
  }
  return buffer.toString("utf8").replace(/^\uFEFF/, "");
}

function parseTsv(filePath) {
  const text = readText(filePath);
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split("\t");
  return lines.map((line) => {
    const values = line.split("\t");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function writeFile(name, content) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, name), "\uFEFF" + content, "utf8");
}

function dayIndex(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return Math.floor(date.getTime() / 86400000);
}

function pick(array, index) {
  return array[index % array.length];
}

function productBucket(theme) {
  if (theme.theme === "self_improvement") return ["fragrance", "skincare", "habit", "diet_food"];
  if (theme.theme === "marriage_fatigue") return ["skincare", "fragrance"];
  if (theme.theme === "reply_anxiety") return ["fragrance", "skincare"];
  if (theme.theme === "reconciliation") return ["fragrance", "habit", "skincare"];
  return ["habit", "skincare", "fragrance"];
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randomTime(rand, startHour, startMinute, endHour, endMinute) {
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const minute = start + Math.floor(rand() * (end - start + 1));
  const hh = String(Math.floor(minute / 60)).padStart(2, "0");
  const mm = String(minute % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function schedule(dateString, index) {
  const rand = seededRandom(index);
  return [
    { platform: "X", slot: "morning", time: randomTime(rand, 7, 40, 9, 10), file: "01_x_posts.md", post: "X Post 1" },
    { platform: "X", slot: "lunch", time: randomTime(rand, 12, 5, 13, 20), file: "01_x_posts.md", post: "X Post 2" },
    { platform: "Threads", slot: "evening", time: randomTime(rand, 18, 30, 20, 20), file: "02_threads_posts.md", post: "Threads Post 1" },
    { platform: "X", slot: "night", time: randomTime(rand, 20, 10, 22, 40), file: "01_x_posts.md", post: "X Post 3" },
    { platform: "Threads", slot: "night", time: randomTime(rand, 20, 30, 23, 0), file: "02_threads_posts.md", post: "Threads Post 2" },
  ].map((item) => ({ ...item, date: dateString }));
}

function readOptional(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return readText(filePath);
}

function latestWeeklyAnalysis(rootDir) {
  const direct = path.join(rootDir, "weekly_analysis_report.md");
  if (fs.existsSync(direct)) return { file: direct, text: readOptional(direct) };

  const dir = path.join(rootDir, "weekly_analysis_reports");
  if (!fs.existsSync(dir)) return { file: "", text: "" };
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files.length) return { file: "", text: "" };
  return { file: files[0], text: readOptional(files[0]) };
}

function isMonday(dateString) {
  return new Date(`${dateString}T00:00:00+09:00`).getDay() === 1;
}

function compactAnalysis(text) {
  if (!text) return "No weekly analysis report found.";
  const lines = text.split(/\r?\n/).filter(Boolean);
  const important = lines.filter((line) =>
    /^#|Top Hooks|Weak Hooks|Type Summary|Next Week|^- /.test(line),
  );
  return important.slice(0, 45).join("\n");
}

function selectProducts(products, theme, index) {
  const buckets = productBucket(theme);
  const filtered = products.filter((item) => buckets.includes(item.bucket));
  const source = filtered.length ? filtered : products;
  return [0, 1, 2].map((offset) => pick(source, index + offset)).filter(Boolean);
}

function postSet(theme, products) {
  const xPosts = [
    `${theme.target_emotion}時ほど、答えを相手からもらおうとして苦しくなる。\n\nでも本当に先に見たいのは、相手の本音より「自分が何を怖がっているか」だったりする。\n\n焦って動く前に、気持ちを一回言葉にするだけで判断はかなり変わる。`,
    `${theme.post_angle}。\n\n恋愛でしんどい時は、正しい行動を探す前に「今の自分は冷静に選べる状態か」を見るほうが大事。\n\n不安なまま動くと、だいたい後で自分がつらくなる。`,
    `今日のメモ。\n\n${theme.target_emotion}人は、商品やサービスを探す前にまず「何に困っているのか」を分けたほうがいい。\n\n気持ちの整理なのか、出会いを増やしたいのか、印象を整えたいのか。\n\nここがズレると、買っても登録しても不安はあまり減らない。`,
  ];

  const threadsPosts = [
    `${theme.target_emotion}時って、SNSで答えを探し続けるほど余計に不安になることがある。\n\nそういう時は「今すぐ動く」より「明日の自分でも同じ判断をするか」で見たほうがいい。`,
    `恋愛も婚活も、自分を責めている時に選ぶものはだいたい苦しい。\n\n整えるって、相手を振り向かせるためというより、自分が雑に扱われないための土台なんだと思う。`,
  ];

  return { xPosts, threadsPosts };
}

function replyGuidance(theme) {
  return [
    `関連する整理メモはプロフィールのまとめに置いています。\n※PRを含むリンクがあります`,
    `このテーマは固定投稿のまとめにも置いています。必要な人だけ見てください。\n※一部PRを含みます`,
    `${theme.target_emotion}人向けのチェックリストをプロフィール側にまとめています。\n※PRリンクを含む場合があります`,
  ];
}

function noteDraft(theme, products) {
  const productBlocks = products
    .map((item) => [
      `- ${item.itemName.slice(0, 44)}...`,
      `  - 価格目安: ${item.price || "-"}円`,
      `  - 口コミ: ${item.reviewAverage || "-"} / ${item.reviewCount || "-"}件`,
      `  - リンク: ${item.affiliateUrl}`,
    ].join("\n"))
    .join("\n\n");

  return `# ${theme.note_article}

※この記事にはPR・アフィリエイトリンクを含みます。

## まず整理すること

${theme.target_emotion}時は、すぐに答えを出そうとすると判断が荒くなりやすいです。

最初に見るのは次の3つです。

- 今すぐ動く必要が本当にあるか
- 相手の反応をコントロールしようとしていないか
- 自分の生活や見た目や気分が崩れていないか

## やらない方がいいこと

- 不安のまま追いかける
- 占いや商品だけで解決しようとする
- 「これをすれば絶対うまくいく」と考える

## 整えるための候補

${productBlocks}

## まとめ

商品やサービスは、気持ちを整える補助として使うくらいがちょうどいいです。
最初に必要なのは、相手を動かすことではなく、自分が冷静に選べる状態に戻ることです。
`;
}

function csvLine(values) {
  return values.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
}

function riskReasons(text) {
  const reasons = [];
  if (/https?:\/\//.test(text)) reasons.push("contains_url");
  if (/絶対|必ず|確実|100%|痩せる|儲かる|復縁できる|保証/.test(text)) reasons.push("strong_claim");
  if (/投資|資産運用|NISA|FX|仮想通貨|暗号資産/.test(text)) reasons.push("finance_topic");
  if (/病気|治る|医療|薬|副作用/.test(text)) reasons.push("medical_topic");
  if (/PR|アフィリエイト|商品|サービス|リンク/.test(text)) reasons.push("commercial_or_guidance");
  return reasons;
}

function buildAutoQueue(dateString, posts, replies, postingSchedule, weeklyAnalysisMissing) {
  const rows = [];
  const flatPosts = [
    ...posts.xPosts.map((text, index) => ({ platform: "X", post: `X Post ${index + 1}`, text })),
    ...posts.threadsPosts.map((text, index) => ({ platform: "Threads", post: `Threads Post ${index + 1}`, text })),
  ];
  for (const item of flatPosts) {
    const scheduleItem = postingSchedule.find((entry) => entry.platform === item.platform && entry.post === item.post);
    const reasons = riskReasons(item.text);
    if (weeklyAnalysisMissing && isMonday(dateString)) reasons.push("missing_weekly_analysis");
    rows.push({
      date: dateString,
      platform: item.platform,
      time: scheduleItem?.time ?? "",
      post: item.post,
      status: reasons.length ? "hold_for_review" : "auto_ready_after_precheck",
      riskReasons: reasons.join("|"),
      prePublishCheck: "required",
      text: item.text,
    });
  }
  for (const [index, text] of replies.entries()) {
    const reasons = riskReasons(text);
    rows.push({
      date: dateString,
      platform: "X/Threads reply",
      time: "after_reaction",
      post: `Reply ${index + 1}`,
      status: "conditional_reply",
      riskReasons: reasons.join("|") || "reply_guidance",
      prePublishCheck: "required",
      text,
    });
  }
  return rows;
}

const themes = parseTsv(path.join(root, "content_themes.tsv"));
const products = fs.existsSync(path.join(root, "rakuten_human_posts.tsv"))
  ? parseTsv(path.join(root, "rakuten_human_posts.tsv"))
  : [];

const index = dayIndex(dateArg);
const theme = pick(themes, index);
const selectedProducts = selectProducts(products, theme, index);
const posts = postSet(theme, selectedProducts);
const replies = replyGuidance(theme);
const postingSchedule = schedule(dateArg, index);
const weeklyAnalysis = latestWeeklyAnalysis(root);
const mondayNeedsAnalysis = isMonday(dateArg) && !weeklyAnalysis.text;
const autoQueue = buildAutoQueue(dateArg, posts, replies, postingSchedule, !weeklyAnalysis.text);

writeFile("01_x_posts.md", posts.xPosts.map((post, i) => `## X Post ${i + 1}\n\n${post}\n`).join("\n"));
writeFile("02_threads_posts.md", posts.threadsPosts.map((post, i) => `## Threads Post ${i + 1}\n\n${post}\n`).join("\n"));
writeFile("05_reply_guidance.md", replies.map((post, i) => `## Reply ${i + 1}\n\n${post}\n`).join("\n"));
writeFile("06_posting_schedule.csv", [
  csvLine(["date", "platform", "slot", "time", "file", "post", "note"]),
  ...postingSchedule.map((item) => csvLine([item.date, item.platform, item.slot, item.time, item.file, item.post, "Use manual or official scheduling. Do not automate human-like behavior."])),
].join("\r\n"));
writeFile("07_auto_publish_queue.csv", [
  csvLine(["date", "platform", "time", "post", "status", "riskReasons", "prePublishCheck", "text"]),
  ...autoQueue.map((item) => csvLine([item.date, item.platform, item.time, item.post, item.status, item.riskReasons, item.prePublishCheck, item.text])),
].join("\r\n"));
writeFile("08_generation_context.md", `# Generation Context ${dateArg}

## Weekly Analysis

Source: ${weeklyAnalysis.file || "missing"}

${compactAnalysis(weeklyAnalysis.text)}

## Monday Rule

${mondayNeedsAnalysis ? "Monday generation requires weekly_analysis_report.md. Treat today's queue as draft/hold-for-review until analysis is available." : "Weekly analysis requirement satisfied or not Monday."}

## Pre-Publish Rule

Every post marked for publishing still needs a trend/news/sensitivity check within a few hours before scheduled time.
Use pre_publish_trend_check_prompt.md.
`);
writeFile("03_note_draft.md", noteDraft(theme, selectedProducts));
writeFile("04_product_review_queue.csv", [
  csvLine(["status", "keyword", "itemName", "price", "reviewAverage", "reviewCount", "affiliateUrl", "checkMemo"]),
  ...selectedProducts.map((item) => csvLine([
    "needs_review",
    item.keyword,
    item.itemName,
    item.price,
    item.reviewAverage,
    item.reviewCount,
    item.affiliateUrl,
    "Open product page and verify fit before posting",
  ])),
].join("\r\n"));

writeFile("00_daily_checklist.md", `# Daily Affiliate Ops ${dateArg}

## Theme

- ${theme.target_emotion}
- Angle: ${theme.post_angle}
- Note: ${theme.note_article}

## Checklist

- [ ] Read X posts and remove anything that feels generic
- [ ] Read Threads posts and make them more personal if needed
- [ ] Confirm every main post is link-free
- [ ] Auto-ready main posts can proceed without review
- [ ] Use reply guidance only after the main post gets reactions
- [ ] Open product pages and reject bad-fit products
- [ ] Add PR disclosure when using links
- [ ] Post 2-3 trust posts before posting any link
- [ ] Record profile clicks, note clicks, and affiliate clicks

## Posting Schedule

${postingSchedule.map((item) => `- ${item.time} ${item.platform}: ${item.post}`).join("\n")}

## Auto Mode

- Auto-ready queue: 07_auto_publish_queue.csv
- Auto-ready means ready after pre-publish trend/news check.
- Hold-for-review content should not be posted until checked.
- Weekly analysis context: 08_generation_context.md
`);

console.log(`Generated daily ops pack: ${outputDir}`);
