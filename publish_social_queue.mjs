import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dateIndex = args.indexOf("--date");
const date = dateIndex >= 0 ? args[dateIndex + 1] : new Date().toISOString().slice(0, 10);
const platformIndex = args.indexOf("--platform");
const onlyPlatform = platformIndex >= 0 ? args[platformIndex + 1] : "";
const postIndex = args.indexOf("--post");
const onlyPost = postIndex >= 0 ? args[postIndex + 1] : "";
const dueMinutesIndex = args.indexOf("--due-minutes");
const dueMinutes = dueMinutesIndex >= 0 ? Number(args[dueMinutesIndex + 1]) : null;
const root = process.cwd();
const dayDir = path.join(root, "daily_ops", date);
const queueFile = path.join(dayDir, "07_auto_publish_queue.csv");
const decisionsFile = path.join(dayDir, "09_pre_publish_decisions.csv");
const scheduleFile = path.join(dayDir, "06_posting_schedule.csv");
const logFile = path.join(dayDir, "10_publish_log.csv");

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
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const table = parseCsv(text);
  const headers = table.shift() ?? [];
  return table.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function csvLine(values) {
  return values.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",");
}

function hasUrl(text) {
  return /https?:\/\//.test(text);
}

function strongRisk(text) {
  return /絶対|必ず|確実|100%|痩せる|儲かる|復縁できる|保証/.test(text);
}

function normalizeText(text) {
  return String(text ?? "").replace(/\r\n/g, "\n").trim();
}

function decisionMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.platform}|${row.post}`;
    map.set(key, row);
  }
  return map;
}

function scheduleMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.platform}|${row.post}`;
    map.set(key, row);
  }
  return map;
}

function alreadyPostedMap(rows) {
  const map = new Set();
  for (const row of rows) {
    if (row.status === "posted" || row.status === "dry_run") {
      map.add(`${row.platform}|${row.post}`);
    }
  }
  return map;
}

function isDue(row, scheduleByPost) {
  if (dueMinutes === null || Number.isNaN(dueMinutes)) return true;
  const schedule = scheduleByPost.get(`${row.platform}|${row.post}`);
  if (!schedule?.time) return false;
  const scheduledAt = new Date(`${date}T${schedule.time}:00+09:00`);
  const now = new Date();
  const diffMinutes = (now.getTime() - scheduledAt.getTime()) / 60000;
  return diffMinutes >= 0 && diffMinutes <= dueMinutes;
}

async function postToX(text) {
  const token = process.env.X_ACCESS_TOKEN || process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("X_ACCESS_TOKEN is not set.");
  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`X API error ${response.status}: ${body}`);
  const json = JSON.parse(body);
  return json.data?.id ?? "";
}

async function postToThreads(text) {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID || "me";
  if (!accessToken) throw new Error("THREADS_ACCESS_TOKEN is not set.");

  const create = new URL(`https://graph.threads.net/v1.0/${userId}/threads`);
  create.searchParams.set("media_type", "TEXT");
  create.searchParams.set("text", text);
  create.searchParams.set("access_token", accessToken);

  const createResponse = await fetch(create, { method: "POST" });
  const createBody = await createResponse.text();
  if (!createResponse.ok) throw new Error(`Threads create error ${createResponse.status}: ${createBody}`);
  const container = JSON.parse(createBody);
  const creationId = container.id;
  if (!creationId) throw new Error(`Threads did not return creation id: ${createBody}`);

  const publish = new URL(`https://graph.threads.net/v1.0/${userId}/threads_publish`);
  publish.searchParams.set("creation_id", creationId);
  publish.searchParams.set("access_token", accessToken);

  const publishResponse = await fetch(publish, { method: "POST" });
  const publishBody = await publishResponse.text();
  if (!publishResponse.ok) throw new Error(`Threads publish error ${publishResponse.status}: ${publishBody}`);
  const json = JSON.parse(publishBody);
  return json.id ?? creationId;
}

function eligibleRows(queue, decisions) {
  const decisionsByPost = decisionMap(decisions);
  const scheduleByPost = scheduleMap(readCsv(scheduleFile));
  const posted = alreadyPostedMap(readCsv(logFile));
  return queue.filter((row) => {
    const text = normalizeText(row.text);
    const decision = decisionsByPost.get(`${row.platform}|${row.post}`);
    if (onlyPlatform && row.platform.toLowerCase() !== onlyPlatform.toLowerCase()) return false;
    if (onlyPost && row.post.toLowerCase() !== onlyPost.toLowerCase()) return false;
    if (posted.has(`${row.platform}|${row.post}`)) return false;
    if (!isDue(row, scheduleByPost)) return false;
    return (
      row.status === "auto_ready_after_precheck" &&
      decision?.decision === "clear_to_post" &&
      !hasUrl(text) &&
      !strongRisk(text) &&
      (row.platform === "X" || row.platform === "Threads")
    );
  });
}

function appendLog(rows) {
  const exists = fs.existsSync(logFile);
  const lines = [];
  if (!exists) lines.push(csvLine(["date", "platform", "post", "status", "remoteId", "message", "publishedAt"]));
  for (const row of rows) {
    lines.push(csvLine([date, row.platform, row.post, row.status, row.remoteId, row.message, new Date().toISOString()]));
  }
  fs.appendFileSync(logFile, lines.join("\r\n") + "\r\n", "utf8");
}

if (!fs.existsSync(queueFile)) {
  throw new Error(`Queue file not found: ${queueFile}`);
}

const queue = readCsv(queueFile);
const decisions = readCsv(decisionsFile);
if (!decisions.length) {
  console.log("No pre-publish decisions found. Nothing will be posted.");
  console.log(`Create ${decisionsFile} with decision=clear_to_post rows first.`);
  process.exit(0);
}

const eligible = eligibleRows(queue, decisions);
console.log(`Eligible posts: ${eligible.length}`);

const logs = [];
for (const row of eligible) {
  const text = normalizeText(row.text);
  try {
    if (dryRun) {
      console.log(`[DRY RUN] ${row.platform} ${row.post}\n${text}\n`);
      logs.push({ ...row, status: "dry_run", remoteId: "", message: "not posted" });
      continue;
    }

    const remoteId = row.platform === "X" ? await postToX(text) : await postToThreads(text);
    console.log(`Posted ${row.platform} ${row.post}: ${remoteId}`);
    logs.push({ ...row, status: "posted", remoteId, message: "ok" });
  } catch (error) {
    console.error(`Failed ${row.platform} ${row.post}: ${error.message}`);
    logs.push({ ...row, status: "failed", remoteId: "", message: error.message });
  }
}

appendLog(logs);
