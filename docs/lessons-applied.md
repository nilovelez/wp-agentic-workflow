# Lessons applied

Lessons from `lessons-learned.md` that were reviewed. Most are in the skill
now: each one ends with where (→). Kept as the record of how the workflow
was built, dead ends included, for the article and the talk about starting
WordPress development with Claude. Newest project first.

Lessons that were reviewed and left out of the skill are at the end, with
the reason.

## A pull request to the WordPress.org Meta repository (November 2026)

Adding Photo Directory activity to WordPress.org profiles, in a partial
clone of `WordPress/wordpress.org` (`--filter=blob:none --sparse --depth 1`;
the repository is very large). The contribution goes through a pull request
from a fork, linked to a Meta Trac ticket.

- **Projects with their own tooling keep it.** The repository has its own
  wp-env environments, PHPUnit suites and PHPCS setup; the skill's templates
  (blueprint, `composer.json`) don't apply. Its `composer run lint` reports
  every existing error in a file, so for a change to older files use the
  project's `composer run phpcs-changed`, which checks only the changed lines
  (new files need `git add -N` to be seen).
  → `SKILL.md` (a project's own tooling, generalized from wp-env), `quality.md` (check only the changed lines in a project that isn't yours). The `git add -N` detail is left out: it belongs to that tool.

## Themes in the skill (November 2026)

- **`studio create --no-start` without a blueprint doesn't install
  WordPress.** With Studio CLI 2.2.0 the site folder had no `wp-config.php`,
  so `studio wp ... activate` failed with "'wp-config.php' not found". With
  any blueprint, the site was installed. `studio-site.mjs` now requires one,
  from the repo or with `--blueprint`. Also, the blueprint's `activateTheme`
  step runs before the theme is linked but still leaves it as the active
  theme: the later `theme activate` only warns that it is already active.
  → `studio-site.mjs` (requires a blueprint, `--blueprint`), `studio.md`

## WP-CLI on Playground instead of Studio (November 2026)

`studio wp --studio-no-path` stopped working in Studio CLI 2.x, which left
no way to run WP-CLI without a site. Looking for a replacement showed that
Playground can do most of what Studio was used for. Tested on macOS with
Playground CLI 3.1.65, WP-CLI 2.12.0 and Classic Honeypot for CF7.

- **The Playground CLI has a `php` command.** It builds a WordPress site
  like `server` does (blueprint, mounts, SQLite), runs `php <arguments>`
  inside it and exits, with no web server. Mount WP-CLI's `.phar` and pass it
  as the script, after `--` (without it, the CLI rejects the arguments as
  unknown commands): `php --blueprint=... --mount-dir <dir> /tools --
  /tools/wp-cli.phar --path=/wordpress plugin list`. Neither the official
  `wp-playground` skill nor the CLI's README documents it.
  → `scripts/playground-wp.mjs`, `playground.md`
- **Plugin Check runs that way too.** A blueprint that only installs
  `plugin-check`, plus the extracted release zip mounted, gave the same "No
  errors found" as on Studio, in about 19 seconds. On the repo folder it
  flagged the development files, so it was really checking.
  → `playground-wp.mjs --plugin-check`, `quality.md`
- **Why WP-CLI can't reach a plain `server` site:** with the usual options
  the whole site lives in the memory of that process. It is not about
  WebAssembly: when the site's files are on disk, another process can mount
  them and run WP-CLI, even while the server is running. An `option update`
  from WP-CLI showed on the running site straight away, in about 4 seconds.
  → `playground.md` (WP-CLI)
- **A site on disk must be mounted "before install".** `start` keeps its site
  on disk by mounting it with `--mount-before-install` at `/wordpress` and
  `--wordpress-install-mode=install-from-existing-files-if-needed` (read in
  the CLI's code). With a plain `--mount-dir`, WP-CLI fails with "Error
  connecting to the SQLite database". The first run on an empty folder needs
  `download-and-install`; `install-from-existing-files-if-needed` fails there
  with the same error.
  → `playground.md` (Keep a site between runs), `playground-wp.mjs`
- **`start` keeps its sites in the home folder**
  (`~/.wordpress-playground/sites/<hash>`). `server` with
  `--mount-dir-before-install <folder> /wordpress` keeps a persistent site in
  any folder, outside the repo.
  → `playground.md` (Keep a site between runs)
- **Constants from the blueprint don't reach WP-CLI** when they are defined
  the default way: they live in Playground's `consts.json`, not in
  `wp-config.php`, so the stored site had `WP_DEBUG` false.
  → `playground.md`, `templates/blueprint.json`
- **With `"method": "rewrite-wp-config"` the constants do reach WP-CLI.**
  `wp eval 'var_dump( WP_DEBUG );'` showed them true, but `wp config get
  WP_DEBUG` said it wasn't defined in `wp-config.php`, though the file had
  it. Check constants with `eval` on Playground.
  → `playground.md` (WP-CLI)
- **WP-CLI writing while the server works didn't corrupt anything.** With
  the corrected blueprint, 25 posts created by WP-CLI in five rounds while
  four loops made about 290 requests to the running site: no errors in the
  server log, `PRAGMA integrity_check` "ok" on a copy of the database, and
  journal mode `delete`.
  → `playground.md` (WP-CLI)
- **Homebrew's `wp` is the `.phar` itself**, with a `#!` line: it can be
  mounted into Playground as is. `wp --info --format=json` gives the `.phar`
  path (`wp_cli_phar_path`) on any platform.
  → `check-env.mjs`, `environment.md`

## Intentionally Blank: the plugin workflow on a classic theme (November 2026)

First run of the skill on a theme repo, on macOS. The skill's tooling and
templates assume a plugin; everything except Plugin Check carried over with
small changes.

- **The blueprint's `preferredVersions` beats `--php` and `--wp`.** Starting
  the Playground CLI with `--php 8.2 --wp 6.1` and the repo blueprint (PHP
  8.3, WordPress latest) ran PHP 8.3, silently. Checked with the
  `X-Powered-By` header. To test the minimum and latest versions, write
  throwaway copies of the blueprint with other `preferredVersions` in scratch.
- **An old `phpcs.xml` was the WPCS sample ruleset.** It used
  `minimum_supported_wp_version`, which WPCS 3 renamed to
  `minimum_wp_version`, and no `composer.json` installed WPCS at all. Moved
  it to `phpcs.xml.dist` (as the template expects), kept its text domain,
  prefix, minimum WordPress (4.6) and PHP (7.4) values.
  → `quality.md` (offer to update an old ruleset). Reproduced with WPCS
  3.4.1: the old property stops PHPCS with `Property
  "minimum_supported_wp_version" does not exist`, and nothing is checked.
  → `playground.md` (blueprint rules)
- **WordPress 6.1 on PHP 8.2 fills the debug log with core deprecations**
  (`Requests`, `formatting.php`, `pluggable.php`). Filter the log by the
  theme or plugin path before judging it.
  → `testing.md` (Read the debug log)
- **Testing the release zip, not the repo:** extract the `git archive` zip
  and mount the extracted folder in Playground. The site then runs exactly
  what WordPress.org will get.
  → `playground.md` (Run it)
- **`studio wp --studio-no-path` doesn't work (Studio CLI 2.1.1 and 2.2.0,
  macOS).** From the repo root, `studio wp --studio-no-path i18n make-pot
  ...` and even `studio wp --studio-no-path --version` answer "The specified
  directory is not added to Studio". With the Studio site created, `studio wp
  --path <site> i18n make-pot <repo> <out.pot> --exclude=vendor` works, so
  repo-only WP-CLI tasks need the Studio site too.
  → `environment.md`: WP-CLI is required now
- **The first `studio start` on macOS, launched by the agent, failed at the
  hosts file.** The administrator prompt appeared on screen, but it rejected
  the developer's credentials ("user or password incorrect") and Studio
  reported "User did not grant permission". The developer then ran `studio
  start` by hand in their own terminal, entered the administrator account and
  it worked. On macOS, ask the developer to run the first start themselves.
  → `studio.md` (Start it)
- **Updating Studio from its app doesn't update the Studio CLI.** The app
  showed 2.2.0 while `studio --version` still said 2.1.1; the CLI had to be
  updated separately (`curl -fsSL https://wordpress.studio/install.sh |
  bash`, as the CLI's own update notice says). Check `studio --version` after
  updating the app.
  → `studio.md` (Start it)
- **Blueprints that define constants corrupt the SQLite database with
  several Playground workers (CLI 3.1.64, the latest at the time, macOS).**
  Two Playground sites ended up with `database disk image is malformed`
  errors from the second they booted, and one lost its database entirely.
  How it happens:
  1. Playground passes constants to WordPress through a shared file,
     `/internal/shared/consts.json`: `defineConstant()` reads it, adds the
     key and writes it back, with no lock, and PHP reads it with
     `json_decode()` on every request. One of the constants is
     `SQLITE_JOURNAL_MODE: DELETE`, Playground's fix for
     [#3883](https://github.com/WordPress/wordpress-playground/issues/3883)
     (PR #3909, CLI 3.1.44), because SQLite's WAL mode doesn't work across
     Playground workers.
  2. With several workers (the default is min(6, CPUs − 1)) and two blueprint
     steps that each define a constant, such as `login` (it defines
     `PLAYGROUND_AUTO_LOGIN_AS_USER`) followed by `defineWpConfigConsts` with
     its default method, `consts.json` ends up as invalid JSON: the second
     write misses the first step's constant and is shorter, but the file
     keeps its old length, so the end of the previous content stays after
     the closing brace (`…}S_USER":"admin"}`). With one worker the file is
     fine.
  3. PHP can't decode the broken file and defines none of the constants.
     Without `SQLITE_JOURNAL_MODE`, the SQLite integration plugin (3.1.3)
     defaults to WAL, and the #3883 corruption is back. A later
     `defineConstant()` also fails to parse the file, starts from an empty
     object and drops every constant but its own, which is what one broken
     site showed: only the blueprint's constants were left. The lost
     `PLAYGROUND_AUTO_LOGIN_AS_USER` explains Playground's auto-login failing
     on some sites.

  A blueprint with only `defineWpConfigConsts` did not reproduce it; `login`
  plus `defineWpConfigConsts` did, twice out of two. Minimal reproduction:

  ```json
  { "steps": [ { "step": "login" }, { "step": "defineWpConfigConsts", "consts": { "MY_TEST_CONSTANT": true } } ] }
  ```

  Tests, checking `consts.json` and the database's `journal_mode` (on a
  copy) after boot and after 8 parallel logged-in sessions:

  | Blueprint | Workers | `consts.json` | Journal mode |
  |---|---|---|---|
  | `defineWpConfigConsts` only | 6 | valid | `delete` |
  | `login` + `defineWpConfigConsts` | 1 | valid | `delete` |
  | `login` + `defineWpConfigConsts` | 6 | invalid JSON | `delete` at boot, `wal` after the requests |
  | The theme's full blueprint (`login`, `defineWpConfigConsts`, `activateTheme`) | 6 | only the blueprint's constants | `wal`, "malformed" errors at boot |
  | The same with `"method": "rewrite-wp-config"` | 6 | valid | `delete`, no errors |

  `--workers=1` avoids it but serves one request at a time. What works is
  `"method": "rewrite-wp-config"` on every `defineWpConfigConsts` step: the
  constants go to `wp-config.php` as plain `define()` calls, the step doesn't
  touch `consts.json`, and there are no "already defined" notices. The
  `login` step still writes to `consts.json`, but alone it is a single
  write. Proposed for the skill: add that method to
  `templates/blueprint.json` and explain why in `references/playground.md`,
  next to the blueprint rules; any other step that calls `defineConstant()`
  is a risk too. To be reported upstream.

  Dead ends on the way: absent `-wal`/`-shm` files next to the database were
  first taken as the cause. They prove nothing: with exclusive locking SQLite
  uses no `-shm`, and the `-wal` is deleted when the last connection closes.
  Then `defineWpConfigConsts` alone was blamed, until the minimal
  reproduction without `login` came out clean.
  → `templates/blueprint.json`, `playground.md`; reported as WordPress/wordpress-playground#4615
  Fixed in Playground CLI 3.1.66 (#4621 and #4675), retested in November 2026 by the Intentionally Blank session and the issue closed: with the default method, 0 of 12 starts broke `consts.json` (9 of 12 on 3.1.65). `playground.md` now gives `rewrite-wp-config` for its own reason (constants WP-CLI can see) and #4615 as history for older versions.
- **Log in through the site's own URL.** A Playground started with
  `--site-url http://<address>:<port>` sets its cookies for that host. Going
  to `http://127.0.0.1:<port>/wp-login.php` posts the form, but the session
  doesn't stick and every admin page goes back to the login (Playground's
  auto-login fails the same way in headless Chrome). Use the same URL that
  was passed to `--site-url`.
  → `testing.md` (One site, one address), `playground.md` (From another machine). Reproduced with curl: the login redirects to the `--site-url` address, where the cookies set for `127.0.0.1` are not sent.
- **When a tool is missing or fails, stop and ask.** Here `--studio-no-path`
  failed and, instead of asking, the agent tried to download `wp-cli.phar`
  (blocked by the permission system, by design) and then wrote its own
  string-comparison script. The developer wants the environment fixed the
  intended way (here, the Studio site), not improvised around.
  → `SKILL.md` (step 1), `environment.md` (When something is missing or fails)
- **`check-env.mjs` fails on a theme.** It looks for a PHP file with a
  `Plugin Name:` header and reports NOT READY. Every tool was fine; the only
  failure was the missing plugin header. A theme check would look for
  `style.css` with a `Theme Name:` header (and folder = Text Domain).
  → `scripts/project.mjs`: the scripts recognize a theme by `style.css` (check-env, playground-wp, studio-site)
- **Blueprint for a theme:** mount the repo at
  `/wordpress/wp-content/themes/<slug>` and use `activateTheme` with
  `themeFolderName` instead of `activatePlugin`. The landing page makes more
  sense as `/` than `/wp-admin/plugins.php`. Worked first time on macOS.
  → `templates/blueprint-theme.json`, `SKILL.md` (Themes)
- **`.gitattributes` for a theme:** don't export-ignore `screenshot.png`
  (the theme needs it); `/.github` and `/guppy` go out of the zip too.
  → `templates/gitattributes` (`screenshot.png` note, `/.github`). `/guppy` is the developer's own and stays out of the template.
- **Don't export-ignore `assets/` in a theme.** In a theme, `assets/` is a
  regular theme folder (CSS, JS, fonts, images), and themes have no SVN
  assets folder. Intentionally Blank ships `assets/css/` in its zip;
  applying the template would drop it. The rule in `release.md` ("`assets/`
  is reserved for the WordPress.org images") is plugin-only.
  → `templates/gitattributes` (the `assets` lines marked as plugin-only), `release.md`, `SKILL.md` (Themes). Checked: Twenty Twenty-Three, Twenty Twenty-Four and Twenty Twenty-Five all ship an `assets/` folder.
- **Plugin Check doesn't apply.** The theme equivalent is the Theme Check
  plugin (`theme-check`); the skill doesn't cover it yet. (This particular
  theme is flagged as a special case in the WordPress.org theme directory and
  skips Theme Check, but any other theme would need it.)
  → `quality.md` (Theme Check), `playground-wp.mjs --theme-check`. Validated in November 2026: 7 REQUIRED items on Intentionally Blank, only INFO on Twenty Twenty-Five.
- **Studio site for a theme: the same steps as `studio-site.mjs`, with
  `themes/` instead of `plugins/`.** The script stops on a theme (it needs a
  `Plugin Name:` header), so the steps were run by hand on macOS with Studio
  CLI 2.2.0, and they worked:
  1. `studio create --path ~/Studio/<slug> --name "<Theme Name>" --php 8.3
     --file-access all-files --domain <slug>.local --admin-password password
     --no-start --skip-browser --skip-log-details --blueprint ./blueprint.json`
     from the repo root. The blueprint's `activateTheme` step does nothing
     during creation (the theme isn't linked yet) and Studio skips it without
     an error: the site ends up on the default theme (`twentytwentyfive`),
     just as `activatePlugin` is skipped for a plugin.
  2. `ln -s <repo path> ~/Studio/<slug>/wp-content/themes/<slug>`.
  3. `studio wp --path ~/Studio/<slug> theme activate <slug>`, then check with
     `studio wp --path ~/Studio/<slug> option get stylesheet`.
  For the script: detect a theme by `style.css` with a `Theme Name:` header
  at the repo root, take the name from it, link into `wp-content/themes/` and
  run `theme activate` instead of `plugin activate`. Deleting the site needs
  the same care as for a plugin: remove the link under `themes/` first.
  `theme list` shows "version higher than expected" while the repo's version
  isn't deployed on WordPress.org yet; that is expected.
  → `studio-site.mjs`, `studio.md`. Correction, with Studio CLI 2.2.0: the blueprint's `activateTheme` step does leave the theme active; the later `theme activate` only warns.
- **Guard the translated strings with WP-CLI.** For a theme or plugin
  already translated on translate.wordpress.org, generate a POT of the last
  release (`git archive <tag>` into scratch, then `i18n make-pot`) and of the
  working tree, and diff their sorted `msgid` lines before each commit. Any
  changed string drops its translations in every language. In this theme the
  `style.css` headers (Theme Name, Description, Author, URIs) are translated
  strings too.
  → `SKILL.md` (Translated strings of a published plugin), `release.md` (Check the strings before a release): a working rule while editing, and the POT comparison once per release rather than before each commit. `wp i18n make-pot` includes a theme's `style.css` headers.

## WordPress.tv: a theme in another repository, linked into Studio (November 2026)

The theme moved into a fork of the WordPress.org Meta repository, outside the
Studio site, and the site's `wp-content/themes/wptv-27` became a symlink to it.

- **Studio limits PHP to the site folder by default.** Sites run with
  `file-access: site-directory`: `open_basedir` covers only the site folder
  (plus Studio's own paths), and some risky functions are disabled.
  `studio config set --file-access all-files` lifts it. WP-CLI through
  `studio wp` isn't restricted, so it can see a theme the web server can't.
  → `studio.md` (Links and PHP's file access)
- **Symlinks out of the site folder work, if the site starts with them.** On
  start, Studio scans the site root and `wp-content` for symlinks and adds
  their targets to `open_basedir`. While running, it watches `wp-content` two
  levels deep and restarts PHP about 750 ms after a new symlink appears. Read
  in the Studio CLI source (`php-server-child.mjs`), not documented.
  → `studio.md` (Links and PHP's file access)
- **Swap a theme symlink only with the site stopped.** Replacing the folder
  with a symlink on a running site, then loading pages straight away, hit the
  window before the restart: WordPress couldn't read the theme and switched
  the site to the default theme (`stylesheet` became `twentytwentyfive`). The
  front end showed the default theme while `wp theme list` had shown the right
  one moments before. Stop, swap, start, then check `wp option get stylesheet`
  before loading pages.
  → `studio.md` (Links and PHP's file access)
- **Diagnose from the web server, not WP-CLI.** A throwaway PHP file in the
  site root, printing `get_option( 'stylesheet' )`, the theme's `realpath()`
  and `ini_get( 'open_basedir' )`, showed the real state in one request.
  → `studio.md` (Links and PHP's file access)
- **Don't reorganize folders to work around a failure.** Moving the repository
  into the site folder "fixed" it, but it wasn't the owner's layout and the
  cause was the timing above. Stop at the first unexpected result, find the
  cause, and let the owner decide.
  → `SKILL.md` (step 1), `environment.md` (When something is missing or fails)

## Moving to macOS (November 2026)

The development environment moved from a Windows 11 PC to a Mac mini (M1).
It was the first time the skill ran on macOS.

- **Most of the setup is Homebrew.** Node.js, PHP, Composer and Subversion
  came from one `brew install node php composer subversion`; only Studio
  needs its installer and the developer at the computer. Git came with the
  Xcode Command Line Tools.
  → `environment.md` (install commands)
- **The environment scripts work unchanged on macOS.** `check-env.mjs`,
  `check-php.php` and `site-address.mjs` gave the right results the first
  time, including the Tailscale IP from Homebrew's `tailscale` CLI.
  → `SKILL.md` (validated on macOS)
- **Homebrew's PHP comes with `memory_limit = 128M`.** `check-php.php`
  flagged it and printed the `php.ini` line to change (512M).
  → `check-php.php` reports it
- **Studio CLI 2.1.1 is installed in `~/.local/bin`.** The skill's Studio
  notes were written against CLI 1.24; 2.x keeps the options the skill uses
  (`create --blueprint`, `--path`, `--start`, `--skip-browser`) but is not
  tested with it yet.
  → Superseded: tested since, see the next lessons
- **`studio-site.mjs` works on macOS with Studio CLI 2.1.1.** Recreating
  Quevedo's site with `--sites-dir` applied the blueprint, made the symbolic
  link to the repo and activated the plugin in one run; `studio wp` then
  installed the Spanish locale and Plugin Check with the site stopped.
  → `SKILL.md` (validated on macOS)
- **Plugin Check on the linked repo reports the development files.** Run
  against the repo folder, it flags `vendor/`, hidden files, `.github` and
  extra Markdown files as errors and warnings. Useful as a smoke test of the
  site, but the result that counts is Plugin Check on the extracted release
  zip.
  → `quality.md` (Plugin Check)
- **A sparse SVN checkout is enough to compare with the release.** After the
  move, `diff -rq --exclude=.svn` between `trunk/` and `git archive v<version>`
  confirmed the working copy before any commit. The cached WordPress.org
  credentials stay on the old computer.
  → `release.md` (Upload to SVN)

## WordPress.tv 27 (October 2026)

An external review (coding standards, security, feature parity) of a block
theme that other agents are developing at the same time.

- **The scripts assume a plugin.** `check-env.mjs` fails its last check
  because it looks for a root file with a `Plugin Name:` header, and
  `studio-site.mjs` stops for the same reason. Everything else applies to a
  theme with small changes: link the repo into `wp-content/themes/<slug>`
  instead of `plugins/`, activate it with `theme activate`, mount it under
  `/wordpress/wp-content/themes/<slug>` in Playground, and drop the
  `activatePlugin` step from the blueprint. The Studio site was created by
  hand with those changes.
  → `scripts/project.mjs`, `playground-wp.mjs`, `studio-site.mjs`, `playground.md`, `studio.md`

## Camptix Badge Generator, now CampTix Badge Designer (October 2026)

A plugin that turns CampTix CSV exports into printable PDF badges.

- **Search for the name before picking the slug, beyond WordPress.org.** The
  plugin was named Camptix Badge Generator, `camptix-badge-generator`, and
  seven milestones later the agent found a plugin with exactly that name and
  folder in `WordPress/wordcamp.org`, the code WordCamp sites run, which is
  where this plugin was meant to go. CampTix and its add-ons left the plugin
  directory for that repo, so a directory search would not have shown it.
  Renaming the slug, text domain and prefix across 35 files took a scripted
  search and replace, a rebuild and a test, but the GitHub repo, the local
  folder, the Studio site and the Guppy entry all had to follow. Before
  setting the slug, search GitHub and the ecosystem the plugin is for, not
  just the directory.
  → `SKILL.md` (step 2)
- **Seeding on the first request races in Playground.** The CLI serves with
  six workers and the first page load fires several requests, so a "seed if
  not done" check ran twice and duplicated every post. `add_option()` as a
  lock (it fails if the row exists) lets only one request seed.
  → `playground.md` (blueprint rules)
- **A bare `phpcs:enable` re-enables everything.** After a
  `phpcs:disable` for one sniff, a later `// phpcs:enable` with no sniff
  name turned back on rules disabled at the top of the file. Name the sniff
  in both.
  → `quality.md`
- **Data seeded during a blueprint skips the plugin's own code.** The
  sandbox must-use plugin creates a sample design on `init`, which first
  runs while Playground is still installing, before the plugin under test is
  activated. The design was saved without passing through the plugin's
  sanitizer, so it lacked a field the plugin always adds (the background
  type), and PDF generation failed with "The source image could not be
  decoded". Seeded data has to be complete as the plugin would store it,
  and checked through the plugin's UI, not only through its REST output.
  → `playground.md` (blueprint rules)
- **`--mount` does not take Windows paths.** The Playground CLI splits
  `--mount host:vfs` on the colon, so `C:\...` fails with "Invalid mount
  format". `--mount-dir <host> <vfs>`, which takes them as two arguments,
  works and can be repeated.
  → `playground.md` (Run it)
- **Simulate the dist build locally before pushing.** `git archive HEAD`
  (which honours `export-ignore`) plus `build/`, mounted as the plugin in a
  second Playground on another port, tested the public demo blueprint
  without pushing anything; only the GitHub fetches were left to check
  after the push.
  → `playground.md` (Run it: mount the extracted release)
- **Make the JavaScript translatable from the first milestone.** The editor
  was written with plain English strings and the i18n was left in the
  backlog; doing it later meant going through every component, turning
  module-level constants and string concatenations into `sprintf()` calls.
  The `@wordpress/scripts` ESLint rules help: `sprintf` must get a literal
  format (a choice between two sentences is two `sprintf` calls, not a
  ternary inside one), every placeholder needs a translators comment, and
  `@wordpress/i18n` must be in `dependencies`. `wp_set_script_translations()`
  registers the translations before the script runs, so `__()` at module
  level works. To test without a translation file, register a fake one
  with `wp.i18n.setLocaleData()` from `evaluateOnNewDocument()`.
  → `SKILL.md` (WordPress standards)
- **On Tailscale, use the Tailscale IP, not the LAN IP.** The agent started
  Playground with `--site-url http://<LAN IP>:9400`, as the skill says. The
  developer reaches the development computer through Tailscale, so the site
  has to be started with the Tailscale address (`tailscale ip -4`, a
  `100.x.y.z` address), and the same address goes in the hosts line for a
  Studio domain. The skill should detect Tailscale (a `Tailscale` network
  interface, or `tailscale ip -4` answering) and prefer that address.
  → `scripts/site-address.mjs`, `SKILL.md`
- **A test site reached by IP over HTTP is not a secure context.** The
  plugin hashes emails for Gravatar with `crypto.subtle`, which browsers only
  expose on HTTPS or localhost. Playground at `http://100.x.y.z:9400` has no
  `crypto.subtle`, while real sites do, so the bug would only show on test
  sites (or only in production, the other way round). Any browser API behind
  a secure context (`crypto.subtle`, clipboard, service workers) needs a
  fallback or a localhost test too.
  → `playground.md`, `testing.md`
- **Test in a headless browser before handing over.** A throwaway
  `puppeteer-core` script in the scratchpad, driving the installed Chrome
  against the Playground site (log in, click, read the results table, save
  the PDF), found two runtime errors that the build did not show, and let
  the agent hand over measured numbers instead of guesses.
  → `testing.md` (In a headless browser)
- **"There is no API" was wrong: read the site's REST index first.** The
  backlog said WordPress.org had no public way to get a profile's avatar
  from a username. Its `/wp-json/` index lists `wporg/v1/users`, which takes
  up to 100 usernames per request, returns their Gravatar URLs and allows
  cross-origin requests. Before ruling out a WordPress site as a data source,
  fetch `/wp-json/` and look at its namespaces.
  → `testing.md` (Check assumptions at the source)
- **Check old assumptions about upstream code in the code.** The developer
  remembered that CampTix put the buyer's WordPress.org username on every
  ticket of an order. The current `require-login.php` gives each attendee
  their own username after they confirm. Reading it (with `gh api`) took a
  minute and changed the decision.
  → `testing.md` (Check assumptions at the source)
- **Read Playground's PHP log from the host.** The site's files live inside
  Playground, so `WP_DEBUG_LOG` was pointed at a path inside the mounted
  plugin folder (`sandbox/debug.log`, ignored by Git). Warnings also reached
  the page even with `WP_DEBUG_DISPLAY` off, and broke a CSV download.
  → `playground.md` (the `rewrite-wp-config` rule). Reproduced in November
  2026 with this plugin's blueprint (`login`, then `defineWpConfigConsts`
  with the default method): in 7 of 12 starts the constants were lost
  (WordPress/wordpress-playground#4615), `WP_DEBUG` ended up `false`,
  Playground left `display_errors` on and the warning showed on the page.
  With `rewrite-wp-config`, 6 of 6 starts were clean. Reading the log is
  covered in `testing.md` (Read the debug log).

## Cute WP Badges (October 2026)

A plugin that will only live on GitHub, never in the WordPress.org directory,
and that started as a static HTML page before becoming a plugin.

- **Keep `assets/` for the directory, always.** The project had put its
  runtime files (SVG icons, a local copy of Dashicons) in `assets/` while it
  was still a static page. When it became a plugin, the agent kept them there
  and dropped the `export-ignore`, reasoning that a plugin not published on
  WordPress.org has no directory assets. Wrong: a GitHub-only plugin may go
  to the directory later. The runtime files moved to `resources/`, and
  `assets/` stays reserved and excluded from the zip from day one.
  → `release.md`
- **Headless Chrome `--dump-dom` is unreliable for async code.** To test a
  JavaScript module in a real browser, the agent loaded a test page with
  `chrome --headless=new --dump-dom`. With asynchronous work (fetch, image
  decoding, `canvas.toBlob`) it dumped the page at different points on each
  run, with or without `--virtual-time-budget` or `--timeout`, which looked
  like a hang in the code under test. What works: start Chrome with
  `--remote-debugging-port`, connect to the page's WebSocket from Node (Node
  22+ has `WebSocket` built in) and poll `Runtime.evaluate` until the page
  reports it is done. ES modules need the page served over HTTP, not
  `file://`.
  → `testing.md`
- **Keep only the icons in use in the zip.** The plugin keeps the whole
  Dashicons set as SVG files in the repo but ships only the ones it uses:
  `/resources/icons/dashicons/*.svg export-ignore`, then one
  `-export-ignore` line per icon in use. `git archive` honors the override.
  A script regenerates that block, and the `.gitattributes` must be committed
  before `git archive`, which reads it from the commit.
  → `release.md` (`-export-ignore`)
- **Prefer the Tailscale IP for test sites.** Before starting a site, check
  this machine's IPs; if it has a Tailscale one, use it in `--site-url`.
  → `scripts/site-address.mjs`

## The Bash tool and shell quirks (October 2026)

Found while working on a plain PHP project, but it applies to any project
where the agent runs commands through Claude Code. Every point is Windows
only, except the correction about macOS.

- **The Bash tool halves backslashes.** Claude Code's Bash tool loses half
  the backslashes before the shell sees the command: `echo 'a\\b'` prints
  `a\b`, even in single quotes, and a quoted heredoc (`<<'EOF'`) does the
  same. It was found on Windows, in Git Bash, and it looked like a Git Bash
  problem. It wasn't: bash 5.3 has no rc files, no `BASH_ENV`, and `posix`
  and `xpg_echo` are off, the same text run from a `.sh` file keeps its
  backslashes, and reinstalling Git (2.55 to 2.56) changed nothing. Reported
  to Anthropic.
  → `environment.md` (Windows shells)
- **Correction: on macOS it was zsh's `echo`, not the tool.** After the move
  to a Mac, `echo 'a\\b'` printed `a\b` again and the problem was taken as
  the same one. It isn't: the Bash tool runs zsh there, and zsh's `echo`
  interprets backslash sequences by itself. In the same tool, `printf '%s\n'
  'c\\d'` prints `c\\d` and a quoted heredoc keeps both backslashes, so the
  text reaches the shell intact. Test this kind of thing with `printf '%s'`,
  never with `echo`, whose behavior changes from shell to shell.
  → `environment.md` (macOS shell)
- **What to do instead.** Create files with the Write and Edit tools, never
  with `echo` or heredocs. For a helper script, write it to a file and run it
  with its path. The PowerShell tool passes the same text intact. A tell-tale
  sign of the bug is the agent running a command, seeing it fail or write a
  broken file, and repeating it in PowerShell.
  → `environment.md` (Windows shells)
- **PowerShell adds a trailing CRLF.** `Set-Content` and `Out-File` end the
  file with CRLF even on text that was LF. For exact bytes use
  `[IO.File]::WriteAllText` with `New-Object Text.UTF8Encoding($false)`.
  → `environment.md` (Windows shells)
- **Line endings.** In the Git for Windows installer, "Checkout as-is,
  commit Unix-style line endings" (`core.autocrlf=input`) keeps checked-out
  files untouched and stops CRLF from entering commits. A `.gitattributes`
  with `* text=auto eol=lf` in the repo is more robust because it doesn't
  depend on how Git was installed.
  → `templates/gitattributes`, `environment.md`

## Quevedo (October 2026)

An existing plugin, published for years, analyzed and tested with Playground
for the first time.

- **Setting the permalink option is not enough.** `setSiteOptions` with
  `permalink_structure` saved the option but not the rewrite rules, so every
  pretty URL silently served the home page with a 200. The first round of
  redirect tests looked fine and proved nothing. Set the structure in a
  `runPHP` step with `$wp_rewrite->set_permalink_structure()` and
  `flush_rewrite_rules()`, and check one pretty URL before trusting the rest.
  → `playground.md` (blueprint rules)
- **Port 9400 may be taken.** Another session's Playground was already on
  9400. The new one silently picked a random port while `--site-url` still
  pointed at 9400, so links went to the other site. Check the port first and
  pass `--port` together with `--site-url`.
  → `playground.md` (Run it)
- **Stopping the background task leaves Playground running.** On Windows,
  stopping the shell that ran `npx` doesn't stop its `node` children, and the
  port stays in use. Find them by command line (`--mount-dir ... plugins/<slug>`)
  and stop them.
  → `playground.md` (Stop it)
- **WordPress core changes under old plugins.** Since WordPress 6.4, new sites
  redirect attachment pages to the file before the plugin's own attachment
  redirect runs. Since 6.1, lists need `core/list-item`, so a block allowlist
  written with only `core/list` leaves lists with a single item. Test old
  features against the current WordPress, not the one they were written for.
  → `testing.md` (After WordPress or a dependency changes)
- **Studio updates itself and restarts its sites.** Studio auto-updated
  (1.23 to 1.24) while a site was running and restarted it. The plugin
  junction and the activated plugin survived; check the site responds after
  an update before trusting test results.
  → `studio.md` (Start it)
- **Plugin Check found almost nothing after WPCS.** With the full WordPress
  ruleset clean, Plugin Check only flagged `load_plugin_textdomain()`. A
  plugin with language packs on translate.wordpress.org doesn't need it, nor
  its own `languages/` folder; checking the translations API
  (`api.wordpress.org/translations/plugins/1.0/?slug=<slug>`) settled it.
  → `quality.md`, `release.md` (Translations)
- **The skill doesn't cover updates through SVN yet.** `release.md` stops at
  the first submission. Publishing an update needs a command-line `svn`
  (TortoiseSVN alone doesn't install `svn.exe`), a working copy outside the
  repo, `trunk/` replaced with the `git archive` of the release tag, a
  `tags/<version>` copy in the same commit, and the developer's own SVN
  password for the commit. Write it down once Quevedo 1.5 is published.
  → `release.md` (Upload to SVN)
- **The first SVN update, done by Claude step by step.** Quevedo 1.5 went out
  with Claude running every step, the commit included, and the developer
  confirming each one before it ran. A sparse checkout (`--depth immediates`,
  then `trunk/` and `assets/` at full depth and `tags/` empty) avoids
  downloading every old tag and still allows `svn cp trunk tags/<version>`.
  Check that the tag doesn't exist remotely (`svn ls .../tags/`) and compare
  the root `assets/` with the repo's by hash before touching it.
  → `release.md` (Upload to SVN)
- **SVN credentials may or may not be cached.** The `svn.exe` from
  TortoiseSVN's command-line tools shares its credential store, so a password
  once saved by TortoiseSVN let the commit run without asking for it. That
  can't be assumed: check with `svn auth plugins.svn.wordpress.org` before the
  commit, and if nothing is cached, the developer enters their SVN password
  (or makes the commit). Never ask for it in the chat.
  → `release.md` (Upload to SVN)
- **The same PowerShell pipe trap, again.** Listing the release with
  `git archive v1.5 | tar -t` failed with a malformed header, just as on the
  first project. Use `git archive --format=zip -o <file>` from the start.
  → `release.md`, `environment.md`
- **The plugin API lags the commit.** Right after the commit the API still
  reported 1.4; it switched to 1.5 a few minutes later. Wait for it in a
  background loop before downloading the zip and comparing it with the
  `git archive` of the tag.
  → `release.md` (Upload to SVN)
- **Old trunks carry development files.** Quevedo's SVN `trunk/` had
  `README.md`, `phpcs.xml` and the WordPress.org `assets/` folder, all of
  them shipped to users. Replacing `trunk/` with the release archive, instead
  of copying files over it, cleans that up.
  → `release.md` (Upload to SVN)
- **Read the debug log through the mount.** The log lives in Playground's
  virtual file system. A throwaway PHP file in the mounted plugin folder that
  prints `wp-content/debug.log`, deleted right after, is the quickest way to
  read it.
  → `testing.md` (Read the debug log)
- **Moving the repo breaks the Studio junction silently.** The repo had been
  cloned in the wrong folder and was moved later. The plugin folder in the
  Studio site was still a junction to the old path, now empty. Clone into the
  final folder from the start; after a move, recreate the junction
  (`(Get-Item <link>).Delete()`, then `New-Item -ItemType Junction`) and move
  Claude's per-project memory, which is keyed by the repo path.
  → `studio.md` (Moving the repo)

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
  → `studio.md`, `scripts/studio-site.mjs`
- **Git Bash and Windows tools.** `studio` is a `.bat` file: Git Bash finds it
  on the PATH but won't run it by name (`studio.bat` works). And Git Bash
  rewrites `/wordpress/...` arguments into `C:/Program Files/Git/wordpress/...`,
  which breaks Playground mounts; `MSYS_NO_PATHCONV=1` turns that off. The
  first project ran these commands from PowerShell, so neither showed up.
  → `environment.md` (Windows shells)
- **Composer and WPCS.** `composer config` fails when there is no
  `composer.json` yet, and WPCS needs the
  `dealerdirect/phpcodesniffer-composer-installer` plugin allowed before
  installing, or PHPCS doesn't find the `WordPress` standard. A
  `composer.json` template with `allow-plugins` set avoids both.
  → `templates/composer.json`, `quality.md`
- **A fresh PATH needs a fresh shell.** After installing Composer, the
  already-running Claude Code session still had the old PATH. Call the tool by
  its full path or restart the session.
  → `environment.md`
- **Deleting a Studio site with a linked plugin.** `studio delete` moves the
  site to the trash, and the plugin folder is a link to the repo. Remove the
  link first (`(Get-Item <link>).Delete()` removes only a junction); tested
  with the repo intact afterwards.
  → `studio.md` (Delete it)
- **One source for asset images.** The icon, banners and placeholders all
  come from HTML pages rendered with the installed Chrome, which replaced a
  Windows-only PowerShell placeholder script.
  → `templates/assets-src/`, `release.md`
- **What the developer must do goes last.** In the desktop app, text written
  between tool calls was shown to the developer as a one-line summary, so the
  Composer install steps never reached them while Claude kept working. When
  the developer has to act, give the steps in the final message and wait.
  → `SKILL.md` (step 1), `environment.md`
- **Install or explain: ask.** When a tool is missing, the developer decides
  whether Claude installs it or gives instructions. Installers with a GUI need
  the developer at the computer anyway.
  → `environment.md` (When something is missing)

## Classic Honeypot for CF7 (October 2026)

The first project: a fork of a classic plugin, taken from development to
WordPress.org submission on Windows 11.

### Maintenance release (1.0.2)

Checking the plugin against new WordPress and Contact Form 7 releases, then
releasing on GitHub and WordPress.org, with the developer away.

- **Diff the dependency, don't trust its changelog.** Contact Form 7's
  changelog only links to release posts, and contactform7.com refuses
  automated fetches. What worked: copy the installed plugin folder from the
  Studio site, update it with `studio wp plugin update`, and run
  `git diff --no-index --stat` on the two folders. Then grep the plugin for
  every API of the dependency it uses and read only the diffs that could touch
  them.
  → `testing.md`
- **Test with HTTP requests, not a browser.** Read the hidden fields from the
  form page and post to Contact Form 7's REST endpoint
  (`/wp-json/contact-form-7/v1/contact-forms/<id>/feedback`): one call per
  case (human, honeypot filled, too fast, future start, missing start) and the
  `status` field says `mail_sent` or `spam`. For admin pages, log in with
  `curl -c/-b` and a cookie jar: PowerShell's `WebRequestSession` drops the
  `/wp-admin` auth cookie when WordPress sends several `Set-Cookie` headers,
  and every admin page redirects to the login.
  → `testing.md` (With HTTP requests)
- **Run Plugin Check on the extracted zip.** On the repo folder it flags
  `.claude`, `.github`, `CLAUDE.md` and untracked folders (here, a local copy
  of the original plugin in `code-reference/`), which never reach the zip.
  `studio wp plugin check <path>` accepts a folder outside the site.
  → `quality.md`

### Development environment

- **Two machines.** Claude and the dev environment ran on one machine on the
  LAN, and the developer worked from another one (remote control). Where a
  server listens and which URL WordPress thinks it has are different problems:
  Playground needs `--site-url http://<LAN IP>:9400`, and Studio custom domains
  need a hosts line on the other machine.
  → `SKILL.md` (Always say where the test site is), `playground.md`, `studio.md`
- **Remote control vs UAC.** Studio writes its custom domains to the hosts
  file, which needs a UAC click at the physical PC. The remote user can't see
  the prompt.
  → `studio.md` (Start it)
- **Windows paths.** Playground's `--mount` breaks on drive letters; use
  `--mount-dir`.
  → `playground.md` (Run it)
- **Background tasks.** A Playground server started by Claude in the
  background dies after 30 minutes unless given the maximum timeout.
  → `playground.md` (Run it)
- **Blueprints don't transfer to Studio as-is.** The blueprint activated a
  plugin that the Studio site didn't have yet (it is linked afterwards), so
  its steps had to be redone with WP-CLI.
  → Superseded by "Wrong assumption: blueprints don't work on Studio" (Writing the skill)
- **Wrong assumption: Studio's WP-CLI is only for Studio sites.** It also runs
  repo-only tasks with `--studio-no-path`, which removed the need for a
  separate WP-CLI install.
  → Superseded: `--studio-no-path` stopped working in Studio CLI 2.x, and WP-CLI is installed now (`environment.md`)
- **Folder name = slug.** Working around a repo folder named differently from
  the plugin slug needed fragile mount paths on Windows. Renaming the folder
  was simpler, and it became a rule of the skill.
  → `environment.md`, `check-env.mjs`
- **MCP Adapter over STDIO.** It works through `studio wp mcp-adapter serve`:
  no application password, no network. But out of the box it only exposes
  3 read-only core abilities, so WP-CLI is still far more useful until plugins
  register abilities.
  → `mcp-adapter.md`
- **Verifying an MCP server.** A fresh headless `claude -p` session is a cheap
  way to check that it loads.
  → `mcp-adapter.md`

### Working on the plugin

- **Changelogs are not enough to audit fixes.** To decide which later fixes to
  port, the changelog was too vague: read the code. Most fixes in later
  versions fixed features added in those versions, so they didn't apply to
  the fork.
  → `testing.md` (Check assumptions at the source)

### Release

- **Plugin Check on a linked site scans the whole repo.** It only takes a slug,
  so it even flagged `.claude/`. Use `--exclude-directories` and
  `--exclude-files`, and check the real package built with `git archive`.
  → Superseded: Plugin Check runs on the extracted release (`quality.md`)
- **PowerShell pipes corrupt binary output.** `git archive | tar` fails; write
  to a file with `-o`.
  → `environment.md`, `release.md`
- **Headless Chrome for assets.** `playwright-core` driving the installed
  Chrome gives clean 1280x800 screenshots and renders an HTML banner at both
  sizes. Keep the banner source in a folder excluded from the release zip.
  → `templates/assets-src/`, `release.md`
- **Explain to reviewers up front.** Keep reviewer-facing explanations in the
  code (`phpcs:ignore` with a reason) and in the submission's "Additional
  Information" field.
  → `release.md` (Before submitting)
- **Two emails at once: read them in order.** A new AI-assisted pre-review
  ("Let's improve your plugin", review ID starting with `AUTOPREREVIEW`) and
  the approval ("Your review has been successfully completed") arrived minutes
  apart. Reading only the first one, we started planning a rename and a reply.
  The approval wins: the slug is fixed and no reply is needed.
  → `release.md` (After submitting)
- **The AI pre-review flags more than Plugin Check.** With Plugin Check clean,
  it still flagged unsanitized CSS from a filter passed to
  `wp_add_inline_style()`, and raised generic warnings about Guideline 11
  (just for having `admin_notices`) and about the name. Judge each one: the
  notices and the name stayed, the CSS was hardened in a point release,
  since it would come up again in later reviews.
  → `release.md` (After submitting)
- **Prove a security fix in Playground.** A test mu-plugin that returns
  `</style><script>` from the filter showed the payload reaching the page
  before the fix (recent WordPress already escapes `</style`, older ones don't
  guarantee it) and gone after it.
  → `testing.md` (Prove a security fix)
- **curl against Playground needs cookies.** Playground's auto-login
  redirects to the same URL until the browser keeps its cookie, so plain
  `curl -L` hangs in a loop. Use a cookie jar (`-c jar -b jar`).
  → `testing.md` (With HTTP requests)
- **The skill didn't load for a small fix.** Asked to harden one line after
  the review, Claude worked without loading `wp-agentic-workflow`, looked for
  a global `phpcs` on the PATH, found none and reported "PHPCS is not
  installed" instead of running `check-env.mjs` and setting up WPCS with
  Composer from the templates. The repo predated the skill, so step 2 had
  never been done there. Any change to plugin code, however small, is
  "continuing work on a plugin": load the skill first. A tool that is
  missing means "set it up", never "skip the check".
  → `SKILL.md` (description), `quality.md`
- **The skill had no SVN step.** It ended at submission, so the first upload
  was worked out on the spot: checkout in a separate folder with the slug as
  name, `trunk/` from the `git archive` zip, `svn copy` to the tag, assets
  with `svn:mime-type`, and the commit left to the developer, who made it
  with TortoiseSVN. Added to `release.md`.
  → `release.md` (Upload to SVN)
- **Check the published plugin, not just the commit.** The plugin API and the
  `downloads.wordpress.org` zip confirm the version, and a `diff -r` showed
  the download identical to the `git archive` zip. WordPress.org now delays
  plugin updates by six hours before sites see them.
  → `release.md` (Upload to SVN)

## Reviewed, not in the skill

### The skill doesn't use wp-env.

- **wp-env's Playground runtime can't replace Docker.** wp-env 11 has an
  experimental `--runtime=playground` that starts WordPress without Docker,
  but it doesn't support `wp-env run`. The environment's setup script and its
  PHPUnit command both use `run`, so they fail.
  *(WordPress.tv: the Meta repository's environment (November 2026))*
- **Colima is enough for Docker on a Mac.** `brew install colima docker`, then
  `colima start`: free, command line only, no Docker Desktop.
  *(WordPress.tv: the Meta repository's environment (November 2026))*
- **Homebrew's Docker CLI comes without Compose.** wp-env needs
  `docker compose`: install `docker-compose` and add
  `"cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"]` to
  `~/.docker/config.json`.
  *(WordPress.tv: the Meta repository's environment (November 2026))*
- **Colima only shares the home folder with its VM.** With the repositories on
  another disk (`/Volumes/Datos`), the containers saw their bind mounts empty:
  the mu-plugins failed to load and Jetpack was "not found", with no word
  about mounts. Start it with `--mount "$HOME:w" --mount /Volumes/Datos:w`.
  Passing any `--mount` replaces the default, so `$HOME` has to be listed too.
  *(WordPress.tv: the Meta repository's environment (November 2026))*
- **wp-env's test environment collides with the development one.** Both use
  port 8888. Run the tests with `WP_ENV_PORT` and `WP_ENV_MYSQL_PORT` set to
  other ports and their own `WP_ENV_HOME`.
  *(WordPress.tv: the Meta repository's environment (November 2026))*
- **`WP_ENV_HOME` keeps wp-env's data out of the home folder.** Point it at
  scratch; it must also be under a folder Colima shares.
  *(WordPress.tv: the Meta repository's environment (November 2026))*

### Specific to that project or tool.

- **A sandbox of the host platform beats mocking it.** To test against
  CampTix, the blueprint installs the real plugin from one folder of the
  `WordPress/wordcamp.org` repo (`git:directory`, pinned to a commit), and a
  must-use plugin stands in for the three WordCamp.org functions it calls
  and creates invented data. Comparing CampTix's own CSV export with the
  plugin's live reading then proved both paths give identical results.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **Invented posts need past dates.** Purchase dates generated forward from
  a start date ran past "now", and WordPress saved those posts as
  `future` (Scheduled) instead of `publish`.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **Save the post again after adding its meta, like the host plugin does.**
  CampTix builds the attendee title and search content on `save_post`, so
  posts inserted first and given meta afterwards showed "(no title)" until
  `wp_update_post()` ran once more, as CampTix itself does at checkout.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **Multisite-only code shows up on a single site.** WordCamp.org is a
  network: CampTix's export uses `WP_Site` and a T-shirt cron job uses
  `get_sites()`, which only exist on multisite. The class can be loaded and
  the site primed in the `sites` cache group; the network-wide add-on was
  turned off.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **A `Notice` with buttons inside needs a `spokenMessage`.** Without a
  string `spokenMessage`, `@wordpress/components`' `Notice` runs
  `renderToString()` on its children during render, to announce them to
  screen readers. The hooks of every `Button` inside then count as hooks of
  the `Notice`, so when the number of buttons changes while the notice is on
  screen React throws ("change in the order of Hooks called by Notice") and
  the whole editor goes blank. The headless test never saw it: there the
  list of cut names appeared complete at once; on the developer's computer
  it changed a moment later, probably when the web font finished loading.
  Pasting the browser console was what found it.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **Ask about the print format early.** Folded badges (one sheet, the face
  twice, folded in half) were missed until the plugin was public, though it
  is one of the two usual ways WordCamp badges are printed. With pdf-lib it
  was cheap because the page drawing was already one function: clip in page
  space, then a `cm` operator to turn the copy 180°, then draw. A spec
  question list for print tools should include single or folded, one or two
  sides, and what the print shop wants.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **A notice for small screens works best in plain CSS.** PHP prints it next
  to the editor's container and a media query shows one or the other, so it
  appears before the script loads and the editor keeps its state when the
  window is resized.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **Script modules in wp-admin need WordPress 6.6.** In 6.5 they only load
  on the front end. Set `Requires at least: 6.6` and `minimum_wp_version` 6.6.
  *(Cute WP Badges (October 2026))*
- **`gh release create --target` needs the full SHA.** A short SHA fails with
  `Release.target_commitish is invalid`.
  *(Classic Honeypot for CF7 (October 2026))*
- **CF7 forms created in a blueprint: embed them by ID.** In a test blueprint,
  `[contact-form-7 id="<hash>"]` showed "Contact form not found"; the numeric
  `$form->id()` worked.
  *(Classic Honeypot for CF7 (October 2026))*

### About the developer's GitHub account, not the WordPress workflow.

- **The agent's GitHub account may not be able to rename the repo.** `gh`
  was logged in as a collaborator without admin rights, so the developer has
  to rename it in Settings. Check `permissions.admin` before promising it.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **The agent's GitHub account may not be an admin of the repo.** Turning
  on GitHub Pages (`POST /repos/{owner}/{repo}/pages`) needs admin rights;
  with push rights the API answers 404, not 403. The developer has to switch
  Pages to "GitHub Actions" in the repo settings once.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*

### A personal preference of the developer: it belongs in their user-level `CLAUDE.md`.

- **Playwright: install `playwright-core` globally and link it.** The
  developer wants it global (`npm install -g playwright-core`), shared by
  every session, not installed per scratch folder. A global package can't be
  imported from an ES module script (`ERR_MODULE_NOT_FOUND`: Node doesn't
  search the global folder for `import`), so run `npm link playwright-core`
  in the scratch folder of the scripts: it creates a link, no new download.
  *(Intentionally Blank: the plugin workflow on a classic theme (November 2026))*
- **Drafts the developer will publish go on screen, not in the repo.** The
  agent wrote the GitHub issue draft to `docs/upstream/` (uncommitted); the
  developer wanted it in the chat to copy. Same for PR comments and blog
  posts.
  *(Camptix Badge Generator, now CampTix Badge Designer (October 2026))*
- **Don't push unasked.** "Merge it so I can see the code" was read as
  "merge and push". It was not.
  *(Cute WP Badges (October 2026))*
- **Ask for exactly what to remove.** When asked to tone down one thing in the
  readme, Claude over-corrected and removed too much.
  *(Classic Honeypot for CF7 (October 2026))*

### General git, not the WordPress workflow.

- **`git grep` on a commit in a partial clone downloads every blob.** Like
  `git log -S`, `git grep <pattern> HEAD -- <path>` has to read the files
  that aren't checked out, so it fetches them one by one; it ran for over 10
  minutes and had to be stopped. To find files, use `git ls-tree -r
  --name-only HEAD | grep`, which reads only the tree, then add the folders
  to the sparse checkout with `git sparse-checkout add` and search them on
  disk. Adding a single file needs `--skip-checks`.
  *(A pull request to the WordPress.org Meta repository (November 2026))*
- **Clone the fork, or set up the remotes before starting.** The repository
  was cloned from `WordPress/wordpress.org`, so `origin` pointed to the
  upstream repository. The fix, before any commit: rename it to `upstream`
  (the partial clone settings move with it, so missing blobs keep coming from
  there), add the fork as `origin`, and block pushes to upstream with `git
  remote set-url --push upstream DISABLED`. A fork whose default branch is at
  the same commit as upstream accepts pushes from a shallow clone.
  *(A pull request to the WordPress.org Meta repository (November 2026))*

### Setup of the developer's own computers.

- **Studio's default sites folder can be changed in the app, but
  `studio-site.mjs` doesn't read it.** It creates sites in `~/Studio/<slug>`
  unless given `--sites-dir`. The developer set the app back to the default
  to stay consistent.
  *(Moving to macOS (November 2026))*
- **Moving computers is a checklist.** The repo is on GitHub, but Claude's
  project memory (`~/.claude/projects/<path-based name>/memory/`) and the
  user-level `~/.claude/CLAUDE.md` are not: copy them by hand, and fix
  anything platform-specific (Windows shell notes, `D:\` paths). Skills are
  reinstalled with `npx skills add`.
  *(Moving to macOS (November 2026))*
- **Git over HTTPS couldn't reach the macOS keychain from Claude Code.** The push
  failed with `failed to get: -25308` (the keychain refuses access without
  user interaction), and `gh` reported its token as invalid for the same
  reason. `gh auth login --insecure-storage` keeps the token in
  `~/.config/gh/hosts.yml` instead, and `gh auth setup-git` makes Git use it.
  *(Moving to macOS (November 2026))*
- **Check the git identity and the active `gh` account before committing.**
  The computer's global git identity and the logged-in `gh` account were not
  the developer's. In WordPress.org repositories this matters beyond the
  author line: Props Bot credits the commit authors and the people in the
  pull request. Set the identity in the repository only (`git config
  user.name` and `user.email`), and switch `gh` with `gh auth login` or `gh
  auth switch`; when git's credential helper for github.com is `gh auth
  git-credential`, the push uses the active `gh` account.
  *(A pull request to the WordPress.org Meta repository (November 2026))*

### Part of the story, not a rule.

- **Just using the plugin finds bugs.** Contact Form 7 6.2 renamed its menu
  slug (`wpcf7` to `wpcf7-dashboard`), so the plugin's settings page had become
  invisible. The developer had used the plugin for years without knowing it had
  settings.
  *(Classic Honeypot for CF7 (October 2026))*
- **First submission.** The automated scan passed on the first try once Plugin
  Check was clean. The manual review queue had about 243 plugins.
  *(Classic Honeypot for CF7 (October 2026))*

### A one-off misunderstanding in a session, not a rule.

- **Don't start test servers unasked.** The agent started a local web server
  to share a static preview page; the developer could open the file directly
  through remote desktop and did not want it. Only start a site when asked.
  *(Cute WP Badges (October 2026))*
  The agent served a static HTML mockup through a web server instead of
  saying where the file was. As a rule ("only start a site when asked") it
  would clash with testing on a running site before handing work over; the
  agent's own test sites are already stopped after the check (`testing.md`).
