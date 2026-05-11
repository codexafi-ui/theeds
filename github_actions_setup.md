# GitHub Actions Setup

## What This Does

GitHub Actions can run the Threads publishing workflow without your PC being on.

The workflow:

1. Generates the daily operation pack.
2. Creates `09_pre_publish_decisions.csv` with a local safety check.
3. Publishes eligible Threads posts using the official Threads API.

For the first week, `BOOTSTRAP_WITHOUT_WEEKLY_ANALYSIS=1` is enabled in GitHub Actions so missing Sunday analytics does not block link-free posts.

## Files

- `.github/workflows/threads-auto-publish.yml`
- `github_precheck_today.mjs`
- `publish_social_queue.mjs`
- `generate_daily_affiliate_ops.mjs`

## Required GitHub Secrets

Add these to your GitHub repo:

```text
THREADS_ACCESS_TOKEN
THREADS_USER_ID
```

Do not commit tokens into files.

## Create Repository

From this folder:

```powershell
git init
git add .
git commit -m "Prepare SNS affiliate automation"
```

Then create a private GitHub repository and push:

```powershell
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Add Secrets

GitHub repo page:

```text
Settings
-> Secrets and variables
-> Actions
-> New repository secret
```

Add:

```text
THREADS_ACCESS_TOKEN
THREADS_USER_ID
```

## Test Manually

Go to:

```text
Actions
-> Threads Auto Publish
-> Run workflow
```

Use:

```text
dry_run = true
```

If the dry run succeeds, run again with:

```text
dry_run = false
```

## Schedule

The workflow runs as an hourly watcher:

```text
Once per hour
```

Actual post times are not fixed. They are generated daily in:

```text
daily_ops/YYYY-MM-DD/06_posting_schedule.csv
```

The publisher only posts items whose randomized schedule time is due within the last 420 minutes. It writes published posts to `published_state/YYYY-MM-DD.json` and commits that state back to the repository, so delayed runs can recover without posting the same item twice.

## Important

The included precheck is local only. It checks URLs, PR wording, strong claims, and sensitive terms. It does not currently search live news/trends from GitHub Actions. Add a news/search API later if you want full external trend checking in the cloud.
