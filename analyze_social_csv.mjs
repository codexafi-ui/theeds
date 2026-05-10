import fs from "node:fs";
import path from "node:path";

const inputFile = process.argv[2];
const outputFile = process.argv[3] ?? "weekly_analysis_report.md";

if (!inputFile) {
  console.error("Usage: node analyze_social_csv.mjs <analytics.csv> [output.md]");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted && ch === '"' && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.length)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((v) => v.length)) rows.push(row);
  return rows;
}

function normalize(name) {
  return name.toLowerCase().replace(/[\s_-]/g, "");
}

function findColumn(headers, candidates) {
  const normalized = headers.map(normalize);
  for (const candidate of candidates.map(normalize)) {
    const index = normalized.findIndex((header) => header.includes(candidate));
    if (index >= 0) return headers[index];
  }
  return null;
}

function number(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function rate(numerator, denominator) {
  if (!denominator) return 0;
  return numerator / denominator;
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function hook(text) {
  const firstLine = String(text ?? "").split(/\r?\n/).find(Boolean) ?? "";
  const firstSentence = firstLine.split(/[。！？!?]/)[0] || firstLine;
  return firstSentence.slice(0, 35);
}

function classify(text) {
  const value = String(text ?? "");
  if (/やってはいけない|NG|逆効果|避け/.test(value)) return "NG行動";
  if (/チェック|まず|3つ|5つ|リスト/.test(value)) return "チェックリスト";
  if (/思う|気がする|本当は|大事/.test(value)) return "気づき";
  if (/私|自分|経験|やってみ/.test(value)) return "体験談";
  if (/プロフィール|まとめ|リンク|note|PR/.test(value)) return "導線投稿";
  return "共感";
}

const text = fs.readFileSync(inputFile, "utf8").replace(/^\uFEFF/, "");
const table = parseCsv(text);
const headers = table.shift();
const columns = {
  text: findColumn(headers, ["post_text", "text", "本文", "投稿"]),
  impressions: findColumn(headers, ["impressions", "impression", "表示", "インプレッション"]),
  likes: findColumn(headers, ["likes", "like", "いいね"]),
  replies: findColumn(headers, ["replies", "reply", "返信", "コメント"]),
  reposts: findColumn(headers, ["reposts", "repost", "retweets", "リポスト"]),
  profileClicks: findColumn(headers, ["profile_clicks", "profileclick", "プロフィール"]),
  urlClicks: findColumn(headers, ["url_clicks", "link_clicks", "urlclick", "リンククリック"]),
  follows: findColumn(headers, ["follows", "follow", "フォロー"]),
  saves: findColumn(headers, ["saves", "save", "保存"]),
};

if (!columns.text || !columns.impressions) {
  throw new Error("CSV must include post text and impressions columns.");
}

const items = table.map((values) => {
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  const impressions = number(row[columns.impressions]);
  const likes = number(row[columns.likes]);
  const replies = number(row[columns.replies]);
  const reposts = number(row[columns.reposts]);
  const profileClicks = number(row[columns.profileClicks]);
  const urlClicks = number(row[columns.urlClicks]);
  const follows = number(row[columns.follows]);
  const saves = number(row[columns.saves]);
  const text = row[columns.text];
  return {
    text,
    hook: hook(text),
    type: classify(text),
    hasLink: /https?:\/\//.test(text),
    impressions,
    engagementRate: rate(likes + replies + reposts + saves, impressions),
    profileClickRate: rate(profileClicks, impressions),
    urlClickRate: rate(urlClicks, impressions),
    followRate: rate(follows, impressions),
  };
});

const top = [...items].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 10);
const low = [...items].filter((i) => i.impressions > 0).sort((a, b) => a.engagementRate - b.engagementRate).slice(0, 10);
const byType = Object.groupBy(items, (item) => item.type);

const lines = [];
lines.push(`# Weekly SNS Analysis`);
lines.push("");
lines.push(`Rows: ${items.length}`);
lines.push("");
lines.push(`## Top Hooks`);
for (const item of top) {
  lines.push(`- ${item.hook} | ${item.type} | ER ${percent(item.engagementRate)} | Profile ${percent(item.profileClickRate)} | URL ${percent(item.urlClickRate)}`);
}
lines.push("");
lines.push(`## Weak Hooks`);
for (const item of low) {
  lines.push(`- ${item.hook} | ${item.type} | ER ${percent(item.engagementRate)} | Impressions ${item.impressions}`);
}
lines.push("");
lines.push(`## Type Summary`);
for (const [type, group] of Object.entries(byType)) {
  const avg = group.reduce((sum, item) => sum + item.engagementRate, 0) / group.length;
  lines.push(`- ${type}: ${group.length} posts, avg ER ${percent(avg)}`);
}
lines.push("");
lines.push(`## Link Exposure Check`);
for (const hasLink of [false, true]) {
  const group = items.filter((item) => item.hasLink === hasLink);
  if (!group.length) continue;
  const avgImp = group.reduce((sum, item) => sum + item.impressions, 0) / group.length;
  lines.push(`- ${hasLink ? "With link" : "No link"}: ${group.length} posts, avg impressions ${Math.round(avgImp)}`);
}
lines.push("");
lines.push(`## Next Week Direction`);
lines.push("- Main posts should stay link-free and complete.");
lines.push("- Put note/profile guidance in replies only when the main post earns reactions.");
lines.push("- Reuse the top hook patterns, but rewrite the body with a new example.");

fs.writeFileSync(outputFile, lines.join("\n"), "utf8");
console.log(`Wrote ${path.resolve(outputFile)}`);
