---
name: wp-agentic-workflow
description: "Use for any work on a WordPress plugin repository, however small: starting or continuing development (\"we're working on a WordPress plugin\"), a one-line fix, addressing a WordPress.org review, or preparing a new version. Load it before changing plugin code. It checks and installs the development tools, sets up test sites and runs WP-CLI on them (Playground, and Studio for a site that stays running), enforces WordPress coding standards (WPCS, Plugin Check), and takes the plugin to a WordPress.org release (zip, assets, submission). Opinionated glue on top of the official WordPress agent skills."
compatibility: "WordPress plugins (themes not covered yet). Node.js 20.18+, PHP 7.4+, Composer and WP-CLI; WordPress Studio recommended. Validated on Windows 11 and macOS; Linux untested."
---

# WordPress plugin workflow

One way of developing a WordPress plugin, the same on every project, from the first line of code to WordPress.org. It follows what WordPress officially recommends at the moment (Playground, Blueprints, Studio, WP-CLI, the WordPress Coding Standards, Plugin Check) and builds on the official skills from [WordPress/agent-skills](https://github.com/WordPress/agent-skills); this skill only adds the glue between them and a few opinions. Don't use or suggest wp-env.

`<skill>` below is the folder of this skill.

## WordPress standards

These are WordPress standards, not preferences. Apply them to every change and point out when existing code doesn't follow them:

- **US English** (en_US, the source locale of WordPress) for code, comments, user-facing strings, the readme and commit messages, whatever language you talk to the developer in.
- **Translatable from the first line**, in PHP and in JavaScript (`@wordpress/i18n`, `wp_set_script_translations()`). Retrofitting i18n later means going through every component.
- **Readable, simple code.** A plain loop or `if` over clever closures and one-liners. Don't try to be smart.
- **WordPress Coding Standards** (PHPCS with WPCS) clean, and **Plugin Check** clean before any release.
- **The repo holds the plugin** plus its configuration and development files; development files stay out of the release zip.

For how to write the plugin itself (structure, hooks, security, Settings API), follow the official `wp-plugin-development` skill.

## Translated strings of a published plugin

This applies to plugins and themes published on WordPress.org, as the project's `CLAUDE.md` says (see "Published or not" in `references/release.md`).

- **What matters is what users get in their language.** Every translatable string of the last published version (on screen, in emails, in error messages, in the plugin header) already has translations in many languages, made by volunteers on translate.wordpress.org. If it changes, it shows untranslated in all of them until they translate it again.
- **So the text of those strings is not changed without the developer's approval**, not even a typo, a comma or a capital letter. If a change is needed, propose it and explain the cost before making it.
- **Replacing a string is changing it**, even if it is written as a new one. Leaving the old one commented out or in an unused variable keeps nothing: users see the new text untranslated, and the old one stays as clutter that translators keep maintaining. When a change is approved, remove the old string.
- **Strings added since the last published version** are not translated yet: they can change freely until the next version is released.
- **The text domain and the context of `_x()`** are part of the string: changing them breaks it too.

In a plugin that is not published, strings change freely.

## Procedure

### 1. Check the environment

Run `node <skill>/scripts/check-env.mjs` from the repo root and read `references/environment.md`.

- If the folder name doesn't match the plugin slug, stop and give rename instructions.
- If a tool is missing, say what is missing and what for, and ask whether the developer wants instructions or wants you to install it. When the developer has to do something, give the steps in your final message and wait.
- If a tool fails or a step gives an unexpected result, stop, say what failed and ask. Don't work around it with other tools, scripts of your own or changes to the developer's folders.

### 2. Set up the repo (once)

Find out whether the plugin is published on WordPress.org: for a new plugin it isn't; for an existing one, ask the developer, and for its URL if it is. A slug that exists on WordPress.org proves nothing, since it may belong to another plugin. Write it in the project's `CLAUDE.md` with the text in "Published or not" in `references/release.md`, so that every session knows whether to protect the translated strings. In a pull request to someone else's repo, ask but don't edit their `CLAUDE.md`.

For a new plugin, settle the slug first: it is the folder, the text domain and the prefix, and renaming it later touches every file. Search for the name on WordPress.org, on GitHub and in the ecosystem the plugin is for (another plugin's repo, a platform's own code), not only in the plugin directory.

If they don't exist yet, add from `templates/`:

- `blueprint.json`: the test site's dependencies and content (`references/playground.md`).
- `composer.json` and `phpcs.xml.dist`: WPCS (`references/quality.md`).
- `.gitattributes` and `.gitignore`: development files out of the zip (`references/release.md`).

Adapt them to the plugin (slug, text domain, prefix, dependencies). Don't overwrite existing files: merge.

### 3. Test sites

Three tools, from lightest to heaviest. Sites log in with `admin` / `password`.

- **WP-CLI alone**, with no site, for tasks that only read the repo (`wp i18n make-pot`): `references/environment.md`.
- **Playground**, for almost everything: a disposable site for day-to-day development and testing, a persistent site kept outside the repo when data has to survive, and WP-CLI on either one, Plugin Check included, without a web server (`scripts/playground-wp.mjs`). `references/playground.md`.
- **Studio**, recommended but optional, only for a site that has to stay running with a fixed domain (to show, to leave open, for the MCP Adapter). Starting it needs the developer at the computer. `references/studio.md` and, optionally, `references/mcp-adapter.md`.

**Always say where the developer's test site is.** The developer is often at another computer, not the one running Claude Code. Every time a site starts for the developer, get this computer's address with `node <skill>/scripts/site-address.mjs` (the Tailscale IP if Tailscale is running, otherwise the LAN IP). Give the site's URL and, for a Studio domain, the hosts line for other computers. Sites you start only for your own tests run on `127.0.0.1` and are not given to anyone (see "One site, one address" in `references/testing.md`).

> The test site is at http://my-plugin.local/ (admin / password). From another computer, add `100.101.102.103 my-plugin.local` to its hosts file.

### 4. Test

Test changes on a running site before handing them over, with HTTP requests or a headless browser, and report measured results: `references/testing.md`. It also covers proving security fixes, reading the debug log and checking the plugin against new WordPress and dependency releases.

### 5. Quality

Before every commit that touches PHP: `composer lint`. Before any release: Plugin Check on the extracted release zip (`node <skill>/scripts/playground-wp.mjs --plugin-check`). Details in `references/quality.md`.

### 6. Release

Zip with `git archive`, readme checks, WordPress.org assets, submission and each version's upload to SVN: `references/release.md`. Review the directory rules with the official `wp-plugin-directory-guidelines` skill.

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
- Linux: the commands follow each tool's documentation but have only been tested on Windows 11 and macOS. Studio is not available on Linux; Playground covers every test site there.
- `scripts/playground-wp.mjs` was written on macOS and is not yet tested on Windows.
