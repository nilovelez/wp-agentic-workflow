# Lessons learned

Lessons from building this workflow, including dead ends and wrong
assumptions. They feed the skill, and an article and a talk about starting
WordPress development with Claude. Add new ones as they happen, newest
project first.

## Quevedo (October 2026)

An existing plugin, published for years, analyzed and tested with Playground
for the first time.

- **Setting the permalink option is not enough.** `setSiteOptions` with
  `permalink_structure` saved the option but not the rewrite rules, so every
  pretty URL silently served the home page with a 200. The first round of
  redirect tests looked fine and proved nothing. Set the structure in a
  `runPHP` step with `$wp_rewrite->set_permalink_structure()` and
  `flush_rewrite_rules()`, and check one pretty URL before trusting the rest.
- **Port 9400 may be taken.** Another session's Playground was already on
  9400. The new one silently picked a random port while `--site-url` still
  pointed at 9400, so links went to the other site. Check the port first and
  pass `--port` together with `--site-url`.
- **Stopping the background task leaves Playground running.** On Windows,
  stopping the shell that ran `npx` doesn't stop its `node` children, and the
  port stays in use. Find them by command line (`--mount-dir ... plugins/<slug>`)
  and stop them.
- **WordPress core changes under old plugins.** Since WordPress 6.4, new sites
  redirect attachment pages to the file before the plugin's own attachment
  redirect runs. Since 6.1, lists need `core/list-item`, so a block allowlist
  written with only `core/list` leaves lists with a single item. Test old
  features against the current WordPress, not the one they were written for.
- **Studio updates itself and restarts its sites.** Studio auto-updated
  (1.23 to 1.24) while a site was running and restarted it. The plugin
  junction and the activated plugin survived; check the site responds after
  an update before trusting test results.
- **Plugin Check found almost nothing after WPCS.** With the full WordPress
  ruleset clean, Plugin Check only flagged `load_plugin_textdomain()`. A
  plugin with language packs on translate.wordpress.org doesn't need it, nor
  its own `languages/` folder; checking the translations API
  (`api.wordpress.org/translations/plugins/1.0/?slug=<slug>`) settled it.
- **Read the debug log through the mount.** The log lives in Playground's
  virtual file system. A throwaway PHP file in the mounted plugin folder that
  prints `wp-content/debug.log`, deleted right after, is the quickest way to
  read it.

## Writing the skill (October 2026)

Turning what was validated on Classic Honeypot for CF7 into a generic skill,
re-testing each piece on Windows 11.

- **Wrong assumption: blueprints don't work on Studio.** They do.
  `studio create --blueprint` applies the blueprint even with `--no-start`,
  `runPHP` steps that load `/wordpress/wp-load.php` included. Activating a
  plugin that isn't there yet (it is linked afterwards) is skipped without an
  error, so the planned "apply a blueprint to Studio" script wasn't needed:
  create with the blueprint, link, activate with `studio wp`. Test the
  assumption before building the workaround.
- **Git Bash and Windows tools.** `studio` is a `.bat` file: Git Bash finds it
  on the PATH but won't run it by name (`studio.bat` works). And Git Bash
  rewrites `/wordpress/...` arguments into `C:/Program Files/Git/wordpress/...`,
  which breaks Playground mounts; `MSYS_NO_PATHCONV=1` turns that off. The
  first project ran these commands from PowerShell, so neither showed up.
- **Composer and WPCS.** `composer config` fails when there is no
  `composer.json` yet, and WPCS needs the
  `dealerdirect/phpcodesniffer-composer-installer` plugin allowed before
  installing, or PHPCS doesn't find the `WordPress` standard. A
  `composer.json` template with `allow-plugins` set avoids both.
- **A fresh PATH needs a fresh shell.** After installing Composer, the
  already-running Claude Code session still had the old PATH. Call the tool by
  its full path or restart the session.
- **Deleting a Studio site with a linked plugin.** `studio delete` moves the
  site to the trash, and the plugin folder is a link to the repo. Remove the
  link first (`(Get-Item <link>).Delete()` removes only a junction); tested
  with the repo intact afterwards.
- **One source for asset images.** The icon, banners and placeholders all
  come from HTML pages rendered with the installed Chrome, which replaced a
  Windows-only PowerShell placeholder script.
- **What the developer must do goes last.** In the desktop app, text written
  between tool calls was shown to the developer as a one-line summary, so the
  Composer install steps never reached them while Claude kept working. When
  the developer has to act, give the steps in the final message and wait.
- **Install or explain: ask.** When a tool is missing, the developer decides
  whether Claude installs it or gives instructions. Installers with a GUI need
  the developer at the computer anyway.

## Classic Honeypot for CF7 (October 2026)

The first project: a fork of a classic plugin, taken from development to
WordPress.org submission on Windows 11.

### Development environment

- **Two machines.** Claude and the dev environment ran on one machine on the
  LAN, and the developer worked from another one (remote control). Where a
  server listens and which URL WordPress thinks it has are different problems:
  Playground needs `--site-url http://<LAN IP>:9400`, and Studio custom domains
  need a hosts line on the other machine.
- **Remote control vs UAC.** Studio writes its custom domains to the hosts
  file, which needs a UAC click at the physical PC. The remote user can't see
  the prompt.
- **Windows paths.** Playground's `--mount` breaks on drive letters; use
  `--mount-dir`.
- **Background tasks.** A Playground server started by Claude in the
  background dies after 30 minutes unless given the maximum timeout.
- **Blueprints don't transfer to Studio as-is.** The blueprint activated a
  plugin that the Studio site didn't have yet (it is linked afterwards), so
  its steps had to be redone with WP-CLI.
- **Wrong assumption: Studio's WP-CLI is only for Studio sites.** It also runs
  repo-only tasks with `--studio-no-path`, which removed the need for a
  separate WP-CLI install.
- **Folder name = slug.** Working around a repo folder named differently from
  the plugin slug needed fragile mount paths on Windows. Renaming the folder
  was simpler, and it became a rule of the skill.
- **MCP Adapter over STDIO.** It works through `studio wp mcp-adapter serve`:
  no application password, no network. But out of the box it only exposes
  3 read-only core abilities, so WP-CLI is still far more useful until plugins
  register abilities.
- **Verifying an MCP server.** A fresh headless `claude -p` session is a cheap
  way to check that it loads.

### Working on the plugin

- **Just using the plugin finds bugs.** Contact Form 7 6.2 renamed its menu
  slug (`wpcf7` to `wpcf7-dashboard`), so the plugin's settings page had become
  invisible. The developer had used the plugin for years without knowing it had
  settings.
- **Changelogs are not enough to audit fixes.** To decide which later fixes to
  port, the changelog was too vague: read the code. Most fixes in later
  versions fixed features added in those versions, so they didn't apply to
  the fork.
- **Ask for exactly what to remove.** When asked to tone down one thing in the
  readme, Claude over-corrected and removed too much.

### Release

- **Plugin Check on a linked site scans the whole repo.** It only takes a slug,
  so it even flagged `.claude/`. Use `--exclude-directories` and
  `--exclude-files`, and check the real package built with `git archive`.
- **PowerShell pipes corrupt binary output.** `git archive | tar` fails; write
  to a file with `-o`.
- **Headless Chrome for assets.** `playwright-core` driving the installed
  Chrome gives clean 1280x800 screenshots and renders an HTML banner at both
  sizes. Keep the banner source in a folder excluded from the release zip.
- **Explain to reviewers up front.** Keep reviewer-facing explanations in the
  code (`phpcs:ignore` with a reason) and in the submission's "Additional
  Information" field.
- **First submission.** The automated scan passed on the first try once Plugin
  Check was clean. The manual review queue had about 243 plugins.
