# wp-agentic-workflow

An opinionated skill for [Claude Code](https://claude.com/claude-code) to develop WordPress plugins: it checks the tools, sets up local sites and follows the same workflow on every project, from the first line of code to the WordPress.org submission.

**Status: work in progress.** The workflow has been validated on one real plugin, [Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7). The skill itself is not written yet.

## Approach

- **Official tools and practices.** [WordPress Playground](https://wordpress.org/playground/) and Blueprints for disposable sites, [WordPress Studio](https://developer.wordpress.com/studio/) for a persistent test site, WP-CLI, the WordPress Coding Standards and Plugin Check. It follows what WordPress recommends at the moment, and changes when that changes.
- **Built on the official skills.** It relies on [WordPress/agent-skills](https://github.com/WordPress/agent-skills) and only adds the glue between them and a few opinions.
- **Opinionated, not configurable.** One way of working, the same on every project.

## What's here

- [`docs/handoff.md`](docs/handoff.md): the validated workflow, with commands and Windows gotchas.
- [`docs/lessons-learned.md`](docs/lessons-learned.md): lessons learned along the way, including dead ends.
- [`drafts/`](drafts/): helper scripts and example files that will become part of the skill.

## License

[GPLv2 or later](LICENSE).
