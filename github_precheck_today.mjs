import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dateIndex = args.indexOf("--date");
const date = dateIndex >= 0 ? args[dateIndex + 1] : new Date().toISOString().slice(0, 10);
const root = process.cwd();
const dayDir = path.join(root, "daily_ops", date);
const queueFile = path.join(dayDir, "07_auto_publish_queue.csv");
const decisionsFile = path.join(dayDir, "09_pre_publish_decisions.csv");

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
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const table = parseCsv(text);
  const headers = table.shift() ?? [];
  return table.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvLine(values) {
  return values.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
}

function localDecision(row) {
  const text = String(row.text ?? "");
  const risk = String(row.riskReasons ?? "");

  if (row.status !== "auto_ready_after_precheck") {
    return ["hold_for_review", "not auto-ready"];
  }
  if (risk) {
    return ["hold_for_review", `risk reasons: ${risk}`];
  }
  if (/https?:\/\//.test(text)) {
    return ["hold_for_review", "contains URL"];
  }
  if (/PR|アフィリエイト|商品|サービス|リンク/.test(text)) {
    return ["hold_for_review", "commercial guidance in main post"];
  }
  if (/絶対|必ず|確実|100%|痩せる|儲かる|復縁できる|保証/.test(text)) {
    return ["hold_for_review", "strong claim"];
  }
  if (/地震|災害|事故|事件|訃報|台風|津波|火災|殺人|死亡/.test(text)) {
    return ["hold_for_review", "sensitive incident terms"];
  }
  return ["clear_to_post", "local automated precheck passed"];
}

if (!fs.existsSync(queueFile)) {
  throw new Error(`Queue file not found: ${queueFile}`);
}

const queue = readCsv(queueFile);
const lines = [csvLine(["date", "platform", "post", "decision", "reason", "checkedAt", "sourceMemo"])];

for (const row of queue) {
  const [decision, reason] = localDecision(row);
  lines.push(csvLine([
    row.date,
    row.platform,
    row.post,
    decision,
    reason,
    new Date().toISOString(),
    "GitHub Actions local precheck. Add search/news API later for external trend verification.",
  ]));
}

fs.writeFileSync(decisionsFile, "\uFEFF" + lines.join("\r\n"), "utf8");
console.log(`Wrote ${decisionsFile}`);
