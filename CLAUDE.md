# wp-agentic-workflow

This repository builds `wp-agentic-workflow`, a public, GPL-licensed skill for Claude Code that sets up and runs a WordPress plugin (or theme) development environment. Open any local WordPress repo, say "we're working on a WordPress plugin", and the skill checks the tools, sets up the sites and follows the same workflow every time.

Everything here was first validated on a real project: [Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7), from development to WordPress.org submission (October 2026).

## Where things are

- `docs/handoff.md`: everything validated so far (workflows, commands, Windows gotchas, MCP, release, assets, open items). It is the source of truth until the skill is written.
- `docs/lessons-learned.md`: lessons learned, including dead ends and wrong assumptions. Public; it also feeds an article and a talk about starting WordPress development with Claude. Add new lessons as they happen.
- `drafts/`: helper scripts and example files taken from Classic Honeypot for CF7. They still have project-specific values; turn them into generic `scripts/` and templates of the skill.
- `skills/wp-agentic-workflow/`: the skill itself (not written yet). Use the same layout as [WordPress/agent-skills](https://github.com/WordPress/agent-skills) (`SKILL.md`, `references/`, `scripts/`) so it installs the same way: `npx skills add nilovelez/entorno-desarrollo-wp -g -a claude-code`.

## Principles of the skill

- Opinionated and generic, not configurable: follow the officially recommended WordPress practices of the moment (currently Playground, Blueprints, WP-CLI, PHPCS/WPCS, Plugin Check). Don't use or suggest wp-env.
- Build on the official skills (WordPress/agent-skills: wp-playground, blueprint, wp-plugin-development, wp-wpcli-and-ops, wp-plugin-directory-guidelines, studio-cli...). This skill only adds the glue and the opinions. Don't duplicate what they already cover; read them, since they may be newer than your knowledge.
- WordPress standards are presented as non-negotiable, not as preferences: source strings, code, comments and docs in US English (en_US, WordPress's source locale); plain, readable code ("don't try to be smart"); WPCS; a clean Plugin Check.
- Missing dependencies are part of the job: detect them, say what is missing and how to install it.
- Public and shared: write for other developers, not just for Nilo.
- Personal working habits (milestones, branching style, chat language, project status files) stay out of the skill. They live in the user-level `~/.claude/CLAUDE.md`.

## Conventions of this repo

- Everything in the repo in US English, except `guppy/`.
- License: GPLv2 or later (`LICENSE`).
