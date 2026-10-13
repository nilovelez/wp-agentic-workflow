# Handoff: what has been validated

Everything learned while building and releasing
[Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7)
(October 2026, Windows 11), written to start this repo without that project's
context. It is the source of truth until the skill is written.

## Goal and principles

- A public, GPL-licensed skill for Claude Code: open any local WordPress plugin
  (or theme) repo, say "we're working on a WordPress plugin", and the
  environment gets set up.
- Opinionated and generic, not configurable: follow the officially recommended
  WordPress practices of the moment (Playground, Blueprints, WP-CLI,
  PHPCS/WPCS, Plugin Check). Don't use or suggest wp-env.
- Build on the official skills, installed globally with
  `npx skills add WordPress/agent-skills -g -a claude-code` (wp-playground,
  blueprint, wp-plugin-development, wp-wpcli-and-ops,
  wp-plugin-directory-guidelines, studio-cli...). The skill only adds the glue
  and the opinions.
- Missing dependencies are part of the job: detect them, say what's missing and
  how to install it.
- Personal habits (milestones, project status files, chat language, branching
  style) stay out of the skill.

## WordPress standards the skill enforces

These are WordPress standards, not preferences:

- Code, comments, user-facing strings, readme and commit messages in US English
  (en_US, the source locale of WordPress).
- Readable, simple code: a plain loop or `if` over clever closures and
  one-liners.
- WordPress Coding Standards, and a clean Plugin Check before any release.
- The repo ends up holding only the plugin plus its config and development
  files; development files are kept out of the release zip.

## Preconditions the skill checks

- The local folder name must equal the plugin slug / Text Domain. If not, stop
  and give rename instructions (on Windows, working around it needs fragile
  drive-relative mount paths). Renaming the remote repo is recommended, not
  required.
- Node (Playground CLI, npm tooling), Studio CLI (`studio`), Git. PHP only for
  external tools (Composer, PHPCS); WP-CLI comes from `studio wp`. For tasks
  that only need the repo, not a site (for example `i18n make-pot`), use
  `studio wp --studio-no-path`.

## Workflow 1: disposable site with Playground

For day-to-day development.

- Commit a `blueprint.json` to the repo: installs dependencies (e.g. Contact
  Form 7 from wordpress.org), sets WP_DEBUG constants, activates the plugin and
  creates test content. Make PHP steps idempotent. The plugin itself is mounted,
  not installed by the blueprint. Example:
  `drafts/classic-honeypot-for-cf7/blueprint.json`.
- Command (repo root):
  `npx @wp-playground/cli server --blueprint ./blueprint.json --mount .:/wordpress/wp-content/plugins/<slug>`
- Windows: `--mount` rejects drive-letter paths; use
  `--mount-dir . /wordpress/wp-content/plugins/<slug>` (relative works).
- Login is `admin` / `password`.
- For access from other machines on the LAN: `--site-url http://<LAN IP>:9400`.
  Playground already listens on all interfaces; there is no bind/host flag.
- When Claude runs it as a background task, use the maximum timeout (the
  default kills it after 30 min; max is 2 h).
- Playground can't send email: in CF7 test forms, `skip_mail: on` in the
  additional settings.

## Workflow 2: persistent site with Studio

For a test site that stays, with the plugin linked from the repo.

- Create (no blueprint, not started, so the plugin can be linked first):
  `studio create --path <sites>/<slug> --name "<Name>" --php 8.3 --file-access all-files --domain <slug>.local --admin-password password --no-start --skip-browser --skip-log-details`
  - `--file-access all-files` is needed because the plugin is a link to a
    folder outside the site.
  - Always pass `--admin-password password`: Studio generates a random one
    otherwise, and both workflows should share the same login.
- Link the plugin: Windows junction (no admin rights needed)
  `New-Item -ItemType Junction -Path <site>\wp-content\plugins\<slug> -Target <repo>`;
  symlink elsewhere.
- `studio start --path <site> --skip-browser`. Adding the custom domain to the
  hosts file triggers a UAC prompt that someone must accept at the PC.
- Apply the blueprint's steps with WP-CLI (`studio wp --path <site> ...`): the
  blueprint can't be reused as-is because it activates the plugin before the
  link exists. Open item: a reusable script for this.
- LAN: Studio's proxy (80/443) listens on all interfaces (PHP itself only on
  ::1), so another machine only needs `<LAN IP> <slug>.local` in its hosts file.

### Always say where the test site is

The machine running Claude Code is often not the one the developer is sitting
at. Whenever a test site is up, give its URL and, for Studio custom domains,
the hosts line for other machines, e.g.: "The test site is at
http://<slug>.local/. From another machine on this network, add
`<LAN IP> <slug>.local` to its hosts file." The plain-HTTP "not secure" warning
is expected. The Windows firewall did not block either workflow.

## MCP Adapter

- Install `mcp-adapter` from wordpress.org on the Studio site.
- Connect over STDIO, no application password, no network:
  `claude mcp add --scope local wordpress-studio -- cmd /c studio wp --path <site> mcp-adapter serve --server=mcp-adapter-default-server --user=admin`
  (`cmd /c` because `studio` is a .bat on Windows; local scope because the path
  is machine-specific).
- Verify with a fresh headless session: `claude -p "..." --allowedTools mcp__wordpress-studio__...`.
- Out of the box it only exposes 3 read-only core abilities; WP-CLI remains far
  more useful unless plugins register abilities.

## Quality and release

- Plugin Check: `studio wp plugin install plugin-check --activate`, then
  `studio wp plugin check <slug> --include-experimental --exclude-directories=.git,.claude,<dev dirs> --exclude-files=<dev files>`.
  It only accepts a slug, so on a linked site it scans the whole repo. Verify
  the real package by checking the release zip.
- Release zip with Git only:
  `git archive --format=zip --prefix=<slug>/ -o <slug>-<version>.zip HEAD`.
  Dev files are excluded with `export-ignore` in `.gitattributes` (example:
  `drafts/classic-honeypot-for-cf7/gitattributes.example`). Only committed
  files are included. In PowerShell write to a file (`-o`): piping binary
  output corrupts it.
- WordPress.org assets in `assets/` (export-ignored; uploaded to the SVN
  `assets/` folder): `icon-128x128.png`, `icon-256x256.png`,
  `banner-772x250.png`, `banner-1544x500.png`, `screenshot-N.png` matching the
  readme's `== Screenshots ==`.
- Banner source in an export-ignored `assets-src/` (HTML + render script), not
  in `assets/`, which is uploaded whole. Example:
  `drafts/classic-honeypot-for-cf7/assets-src/`.
- Translations: no `languages/` folder or `Domain Path` header for
  wordpress.org plugins.
- Before submitting: Plugin Check clean, readme short description <= 150 chars,
  Stable tag = Version. Explain anything reviewers may question in the code
  (a `phpcs:ignore` with its reason) and in the submission's "Additional
  Information" field.
- After submitting, if reviewers ask for changes, reply to their email; never
  resubmit the plugin.

## Drafts

In `drafts/`, still with project-specific values:

- `check-php.php`: checks PHP version, php.ini, extensions for WP-CLI /
  Composer / PHPCS, and prints the php.ini lines to fix.
- `pg-wp.sh`: WP-CLI against a persisted Playground `start` site. Probably
  obsolete now that WP-CLI comes from Studio, and its plugin mount is
  unnecessary once folder = slug.
- `wporg-screenshots.mjs`: readme screenshots at 1280x800 with `playwright-core`
  driving the installed Chrome headless (logs in as admin/password). Needs
  `npm install playwright-core` in its folder.
- `wporg-placeholders.ps1`: placeholder icon and banner PNGs.
- `classic-honeypot-for-cf7/`: the blueprint, `.gitattributes` and banner
  sources of that plugin. The banner needs the plugin icon (`icon_orig.png`),
  which is not copied here.

## Open items

- Script to apply a blueprint's steps to a Studio site (or a Studio-friendly
  blueprint convention).
- Decide what the skill installs vs. only checks.
- Turn the drafts into the skill's `scripts/` and templates.
- Cross-platform: everything above was validated on Windows 11; macOS/Linux
  paths (symlinks, hosts, Chrome path) still to test.
- Themes: only plugins have been tested.
