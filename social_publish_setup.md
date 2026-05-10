# Social Auto Publishing Setup

This project supports auto-publishing only through official APIs.

Do not use browser automation, mouse movement imitation, automated likes, automated follows, or repeated duplicate posts.

## X

Official endpoint:

```text
POST https://api.x.com/2/tweets
```

Required token:

```text
X_ACCESS_TOKEN
```

The token must be a user-context OAuth token with posting permission, such as `tweet.write`. App-only Bearer Tokens cannot publish posts.

## Threads

Official flow:

```text
POST https://graph.threads.net/v1.0/{threads-user-id}/threads
POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish
```

Required values:

```text
THREADS_ACCESS_TOKEN
THREADS_USER_ID
```

## Safety Gate

The publisher reads:

```text
daily_ops/YYYY-MM-DD/07_auto_publish_queue.csv
daily_ops/YYYY-MM-DD/09_pre_publish_decisions.csv
```

Only rows with:

```text
status = auto_ready_after_precheck
decision = clear_to_post
```

are eligible for posting.

Rows with URLs, PR-heavy wording, product-heavy wording, or missing pre-publish decisions are not posted.

## Dry Run

```powershell
node .\publish_social_queue.mjs --date 2026-05-10 --dry-run
```

## Publish

```powershell
node .\publish_social_queue.mjs --date 2026-05-10
```

## Environment Variables

PowerShell example:

```powershell
$env:X_BEARER_TOKEN="your_x_user_context_token"
$env:X_ACCESS_TOKEN="your_x_user_context_token"
$env:THREADS_ACCESS_TOKEN="your_threads_access_token"
$env:THREADS_USER_ID="your_threads_user_id"
```
