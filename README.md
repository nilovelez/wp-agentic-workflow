# wp-agentic-workflow

An opinionated skill for [Claude Code](https://claude.com/claude-code) to develop WordPress plugins: it checks the tools, sets up local sites and follows the same workflow on every project, from the first line of code to the WordPress.org submission.

**Status: first version.** The workflow was validated on one real plugin, [Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7), from development to WordPress.org submission. Plugins only, tested on Windows 11; macOS and Linux are untested and themes are not covered yet.

## Install

The skill builds on the official [WordPress agent skills](https://github.com/WordPress/agent-skills). Install both, globally, for Claude Code:

```bash
npx skills add WordPress/agent-skills -g -a claude-code
npx skills add nilovelez/wp-agentic-workflow -g -a claude-code
```

Then open a WordPress plugin repo in Claude Code and say "we're working on a WordPress plugin".

## Approach

- **Official tools and practices.** [WordPress Playground](https://wordpress.org/playground/) and Blueprints for disposable sites, [WordPress Studio](https://developer.wordpress.com/studio/) for a persistent test site, WP-CLI, the WordPress Coding Standards and Plugin Check. It follows what WordPress recommends at the moment, and changes when that changes.
- **Built on the official skills.** It relies on [WordPress/agent-skills](https://github.com/WordPress/agent-skills) and only adds the glue between them and a few opinions.
- **Opinionated, not configurable.** One way of working, the same on every project.

## What's here

- [`skills/wp-agentic-workflow/`](skills/wp-agentic-workflow/): the skill: `SKILL.md`, `references/`, `scripts/` and `templates/`.
- [`docs/lessons-learned.md`](docs/lessons-learned.md): lessons learned along the way, including dead ends.
- [`docs/handoff.md`](docs/handoff.md): what was first validated on Classic Honeypot for CF7, before the skill existed.

## License

[GPLv2 or later](LICENSE).
