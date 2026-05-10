import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const startIndex = args.indexOf("--start");
const daysIndex = args.indexOf("--days");
const startDate = startIndex >= 0 ? args[startIndex + 1] : new Date().toISOString().slice(0, 10);
const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : 7;

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map((h) => h.replace(/^"|"$/g, ""));
  return lines.map((line) => {
    const values = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];
      if (quoted && ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (!quoted && ch === ",") {
        values.push(cell);
        cell = "";
      } else {
        cell += ch;
      }
    }
    values.push(cell);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

const summary = ["# Weekly Posting Schedule", ""];

for (let index = 0; index < days; index += 1) {
  const date = addDays(startDate, index);
  const result = spawnSync(process.execPath, ["generate_daily_affiliate_ops.mjs", date], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  if (result.status !== 0) process.exit(result.status ?? 1);

  const schedulePath = path.join(process.cwd(), "daily_ops", date, "06_posting_schedule.csv");
  const rows = parseCsv(fs.readFileSync(schedulePath, "utf8").replace(/^\uFEFF/, ""));
  summary.push(`## ${date}`, "");
  for (const row of rows.filter((item) => item.platform === "Threads")) {
    summary.push(`- ${row.time} ${row.platform}: ${row.post}`);
  }
  summary.push("");
}

const output = path.join(process.cwd(), "weekly_schedule.md");
fs.writeFileSync(output, summary.join("\n"), "utf8");
console.log(`Wrote ${output}`);
