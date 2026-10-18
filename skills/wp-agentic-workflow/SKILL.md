---
name: wp-agentic-workflow
description: "Use for any work on a WordPress plugin repository, however small: starting or continuing development (\"we're working on a WordPress plugin\"), a one-line fix, addressing a WordPress.org review, or preparing a new version. Load it before changing plugin code. It checks and installs the development tools, sets up test sites (disposable with Playground, persistent with Studio), enforces WordPress coding standards (WPCS, Plugin Check), and takes the plugin to a WordPress.org release (zip, assets, submission). Opinionated glue on top of the official WordPress agent skills."
compatibility: "WordPress plugins (themes not covered yet). Node.js 20.18+, WordPress Studio CLI, PHP 7.4+ and Composer. Validated on Windows 11; macOS and Linux untested."
---

# WordPress plugin workflow

One way of developing a WordPress plugin, the same on every project, from the first line of code to WordPress.org. It follows what WordPress officially recommends at the moment (Playground, Blueprints, Studio, WP-CLI, the WordPress Coding Standards, Plugin Check) and builds on the official skills from [WordPress/agent-skills](https://github.com/WordPress/agent-skills); this skill only adds the glue between them and a few opinions. Don't use or suggest wp-env.

`<skill>` below is the folder of this skill.

## WordPress standards

These are WordPress standards, not preferences. Apply them to every change and point out when existing code doesn't follow them:

- **US English** (en_US, the source locale of WordPress) for code, comments, user-facing strings, the readme and commit messages, whatever language you talk to the developer in.
- **Readable, simple code.** A plain loop or `if` over clever closures and one-liners. Don't try to be smart.
- **WordPress Coding Standards** (PHPCS with WPCS) clean, and **Plugin Check** clean before any release.
- **The repo holds the plugin** plus its configuration and development files; development files stay out of the release zip.

For how to write the plugin itself (structure, hooks, security, Settings API), follow the official `wp-plugin-development` skill.

## Procedure

### 1. Check the environment

Run `node <skill>/scripts/check-env.mjs` from the repo root and read `references/environment.md`.

- If the folder name doesn't match the plugin slug, stop and give rename instructions.
- If a tool is missing, say what is missing and what for, and ask whether the developer wants instructions or wants you to install it. When the developer has to do something, give the steps in your final message and wait.

### 2. Set up the repo (once)

If they don't exist yet, add from `templates/`:

- `blueprint.json`: the test site's dependencies and content (`references/playground.md`).
- `composer.json` and `phpcs.xml.dist`: WPCS (`references/quality.md`).
- `.gitattributes` and `.gitignore`: development files out of the zip (`references/release.md`).

Adapt them to the plugin (slug, text domain, prefix, dependencies). Don't overwrite existing files: merge.

### 3. Test sites

Two kinds, both with login `admin` / `password`:

- **Playground**, disposable, for day-to-day development: `references/playground.md`.
- **Studio**, persistent, with the plugin linked from the repo: for data that must survive, WP-CLI, Plugin Check, screenshots and the MCP Adapter. `references/studio.md` and, optionally, `references/mcp-adapter.md`.

**Always say where the test site is.** The developer is often at another computer, not the one running Claude Code. Every time a site is up, give its URL and, for a Studio domain, the hosts line for other computers with this computer's current LAN IP (check it each time):

> The test site is at http://my-plugin.local/ (admin / password). From another computer on this network, add `192.168.1.20 my-plugin.local` to its hosts file.

### 4. Quality

Before every commit that touches PHP: `composer lint`. Before any release: Plugin Check on the Studio site. Details in `references/quality.md`.

### 5. Release

Zip with `git archive`, readme checks, WordPress.org assets and submission: `references/release.md`. Review the directory rules with the official `wp-plugin-directory-guidelines` skill.

## Official skills this builds on

Install them with `npx skills add WordPress/agent-skills -g -a claude-code`. Read them when the task goes into their area; they may be newer than this skill.

- `wp-playground` and `blueprint`: Playground CLI and Blueprint syntax.
- `studio-cli`: Studio sites and `studio wp`.
- `wp-plugin-development`: plugin code.
- `wp-wpcli-and-ops`: WP-CLI.
- `wp-plugin-directory-guidelines`: WordPress.org rules.
- `wp-abilities-api`: abilities for the MCP Adapter.

## Not covered yet

- Themes: only plugins have been tested.
- macOS and Linux: the commands follow each tool's documentation but have only been tested on Windows 11. Studio is not available on Linux.
