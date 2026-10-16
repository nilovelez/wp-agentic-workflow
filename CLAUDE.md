# wp-agentic-workflow

This repository builds `wp-agentic-workflow`, a public, GPL-licensed skill for Claude Code that sets up and runs a WordPress plugin (or theme) development environment. Open any local WordPress repo, say "we're working on a WordPress plugin", and the skill checks the tools, sets up the sites and follows the same workflow every time.

Everything here was first validated on a real project: [Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7), from development to WordPress.org submission (October 2026).

## Where things are

- `skills/wp-agentic-workflow/`: the skill (`SKILL.md`, `references/`, `scripts/`, `templates/`), with the same layout as [WordPress/agent-skills](https://github.com/WordPress/agent-skills) so it installs the same way: `npx skills add nilovelez/wp-agentic-workflow -g -a claude-code`. It is the source of truth of the workflow.
- `docs/lessons-learned.md`: lessons learned, including dead ends and wrong assumptions. Public; it also feeds an article and a talk about starting WordPress development with Claude. Add new lessons as they happen.
- `docs/handoff.md`: what was first validated on Classic Honeypot for CF7, before the skill existed. Kept as a record; open items are at the end.

## Principles of the skill

- Opinionated and generic, not configurable: follow the officially recommended WordPress practices of the moment (currently Playground, Blueprints, WP-CLI, PHPCS/WPCS, Plugin Check). Don't use or suggest wp-env.
- Build on the official skills (WordPress/agent-skills: wp-playground, blueprint, wp-plugin-development, wp-wpcli-and-ops, wp-plugin-directory-guidelines, studio-cli...). This skill only adds the glue and the opinions. Don't duplicate what they already cover; read them, since they may be newer than your knowledge.
- WordPress standards are presented as non-negotiable, not as preferences: source strings, code, comments and docs in US English (en_US, WordPress's source locale); plain, readable code ("don't try to be smart"); WPCS; a clean Plugin Check.
- Missing dependencies are part of the job: detect them, say what is missing and how to install it.
- Public and shared: write for other developers, not just for Nilo.
- Personal working habits (milestones, branching style, chat language, project status files) stay out of the skill. They live in the user-level `~/.claude/CLAUDE.md`.

## Conventions of this repo

- Everything in the repo in US English, `guppy/` included.
- License: GPLv2 or later (`LICENSE`).

## Project status (Guppy)

This project publishes its status to Guppy, Nilo's project manager (https://github.com/manuelstone/guppy). Everything Guppy-related lives in `guppy/`, written in English:

- `guppy/STATUS.md`: extended status and work log, for agents working on this project. It is never synced anywhere.
- `guppy/STATUS.json`: public summary, following the status contract (https://github.com/manuelstone/guppy/blob/main/docs/status-contract.md). `.github/workflows/guppy-sync.yml` copies it to Guppy every time it changes on the default branch, and from there it goes to a public website. Never put private information, credentials or secrets in it.

At the end of any session that changes the project status:

1. Update the Status section of `guppy/STATUS.md` and add a brief entry at the top of its Log.
2. Update `guppy/STATUS.json`: `status`, `status_text`, and `last_update` with `last_update_unix`. Take both dates from a single timestamp: `ts=$(date +%s); date -d "@$ts" '+%Y-%m-%d %H:%M:%S %z'; echo "$ts"` (GNU date; the contract has the macOS and PowerShell versions). If the status did not change, do not touch the dates.
3. Commit both files with the rest of the session's changes and push to the default branch.

Statuses: `active` (being worked on), `blocked` (waiting for something outside the project), `inactive` (stopped by choice), `planned` (decided, not started), `archived` (closed).

`status_text`: one or two sentences, under 200 characters, plain text. Say where the project stands and what comes next; if blocked, start with what it is waiting for and from whom. Self-contained: no relative dates, name versions and third parties. Rewrite it in full each time; the history goes in the Log.

Do not use CHANGELOG.md for this: it is for users. Do not edit `guppy-sync.yml`. If the Guppy sync action fails, read its log in the Actions tab and tell Nilo.
