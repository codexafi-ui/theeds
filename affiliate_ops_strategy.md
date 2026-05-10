# SNS Affiliate Automation Plan

## Goal

Build a semi-automated operation that earns through affiliate links without making the account look like a product feed.

The account should grow by publishing useful relationship, dating, marriage, reconciliation, and self-improvement content. Affiliate links are placed mainly in note/blog summary pages and only occasionally in SNS posts.

## Active Accounts

- X: https://x.com/koimemo_life
- Threads: https://www.threads.com/@totonoeru_love
- Instagram: https://www.instagram.com/totonoeru_love/

## Revenue Flow

```text
X / Threads posts
-> Link-free main post
-> Optional reply with note/profile guidance
-> Profile and pinned post
-> note/blog problem-solving article
-> A8 high-ticket offer or Rakuten support products
-> click / signup / purchase
```

## Product Roles

- A8.net: main revenue. Use for phone fortune telling, marriage services, dating apps, consultation, and high-ticket offers.
- Rakuten Affiliate: support revenue. Use for fragrance, skincare, home workout, protein, low-carb food, and self-improvement items.
- Moshimo: support revenue. Use later for Amazon/Rakuten/Yahoo comparison links.

## Daily Content Ratio

- 70% trust-building posts
- 20% note/blog traffic posts
- 10% product or affiliate posts

## Daily Output

- X: 3 posts
- Threads: 2 posts
- note/blog: 1 draft block or article idea
- product review queue: 3 product candidates

## Link Policy

Main posts should be complete and link-free. Do not make the main post feel like a teaser.

Use links in one of these places:

- Reply under the main post
- Profile link
- Pinned post
- note/blog article

Preferred SNS flow:

```text
Main post: complete, useful, no external link
Reply to self: soft guidance to profile/note
Profile/pinned post: stable link hub
note/blog: affiliate links with PR disclosure
```

Reply guidance should be soft:

```text
関連するチェックリストはプロフィールのまとめに置いています。
※PRを含むリンクがあります
```

Avoid putting affiliate URLs directly into high-frequency X or Threads posts.

## Weekly Analysis Feedback Loop

Sunday analysis is not optional. The Monday queue must read the latest weekly analysis report before generating posts.

Required input:

```text
weekly_analysis_report.md
```

If the report is missing on Monday, Monday posts should be treated as lower confidence and held for review or generated only as drafts.

Monday generation should use:

- Top hooks from last week
- Weak hooks to avoid
- Best-performing post type
- Link vs no-link exposure comparison
- Recommended posting themes

## Pre-Publish Trend And Incident Check

Before posting, run a trend/news/sensitivity check within a few hours of the scheduled time.

Check:

- Major disasters
- Serious crimes or accidents
- Public mourning or emergency alerts
- Platform-wide trends that make the post sound insensitive
- Market shocks when content mentions money, investing, or earning
- Health or diet news when content mentions weight, food, or body claims

If uncertain, do not post. Move the item to review.

Pre-publish result values:

- `clear_to_post`
- `needs_rewrite`
- `hold_for_review`
- `do_not_post_today`

## Human Review Rules

Do not post automatically without checking:

- Product page still exists
- Price is not misleading
- Product matches the account theme
- PR disclosure is included when linking
- No claims such as "definitely", "guaranteed", "you will lose weight", or "you can reconcile"
- Main post has no external URL
- Reply guidance is optional and not attached to every post

## Posting Time Policy

Do not post at the exact same minute every day. Use a loose window and manual/official scheduling.

Recommended windows:

- Morning: 7:40-9:10
- Lunch: 12:05-13:20
- Night: 20:10-22:40

Do not use browser automation to imitate human mouse movement or evade platform detection. Use native scheduling tools or manual posting.

## Weekly Routine

- Monday: generate weekly post queue
- Tuesday-Friday: post daily content pack
- Saturday: write or update one note article
- Sunday: review clicks, saves, profile visits, and affiliate results
