# Lessons learned

Lessons from building this workflow, including dead ends and wrong
assumptions. They feed the skill, and an article and a talk about starting
WordPress development with Claude. Add new ones as they happen, newest
project first.

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
- **Don't start test servers unasked.** The agent started a local web server
  to share a static preview page; the developer could open the file directly
  through remote desktop and did not want it. Only start a site when asked.
- **Don't push unasked.** "Merge it so I can see the code" was read as
  "merge and push". It was not.
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
- **Keep only the icons in use in the zip.** The plugin keeps the whole
  Dashicons set as SVG files in the repo but ships only the ones it uses:
  `/resources/icons/dashicons/*.svg export-ignore`, then one
  `-export-ignore` line per icon in use. `git archive` honors the override.
  A script regenerates that block, and the `.gitattributes` must be committed
  before `git archive`, which reads it from the commit.
- **Script modules in wp-admin need WordPress 6.6.** In 6.5 they only load
  on the front end. Set `Requires at least: 6.6` and `minimum_wp_version` 6.6.
- **Prefer the Tailscale IP for test sites.** Before starting a site, check
  this machine's IPs; if it has a Tailscale one, use it in `--site-url`.

## Shell on Windows (October 2026)

Found while working on a plain PHP project, but it applies to any project on
Windows where the agent runs commands through Claude Code.

- **The Bash tool halves backslashes.** On Windows, Claude Code's Bash tool
  (Git Bash) loses half the backslashes before bash sees the command:
  `echo 'a\\b'` prints `a\b`, even in single quotes, and a quoted heredoc
  (`<<'EOF'`) does the same. It looked like a Git Bash problem and wasn't:
  bash 5.3 has no rc files, no `BASH_ENV`, and `posix` and `xpg_echo` are
  off, the same text run from a `.sh` file keeps its backslashes, and
  reinstalling Git (2.55 to 2.56) changed nothing. The loss happens in how
  the tool hands the command to bash. Reported to Anthropic.
- **What to do instead.** Create files with the Write and Edit tools, never
  with `echo` or heredocs. For a helper script, write it to a file and run it
  with its path. The PowerShell tool passes the same text intact. A tell-tale
  sign of the bug is the agent running a command, seeing it fail or write a
  broken file, and repeating it in PowerShell.
- **PowerShell adds a trailing CRLF.** `Set-Content` and `Out-File` end the
  file with CRLF even on text that was LF. For exact bytes use
  `[IO.File]::WriteAllText` with `New-Object Text.UTF8Encoding($false)`.
- **Line endings.** In the Git for Windows installer, "Checkout as-is,
  commit Unix-style line endings" (`core.autocrlf=input`) keeps checked-out
  files untouched and stops CRLF from entering commits. A `.gitattributes`
  with `* text=auto eol=lf` in the repo is more robust because it doesn't
  depend on how Git was installed.

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
- **The skill doesn't cover updates through SVN yet.** `release.md` stops at
  the first submission. Publishing an update needs a command-line `svn`
  (TortoiseSVN alone doesn't install `svn.exe`), a working copy outside the
  repo, `trunk/` replaced with the `git archive` of the release tag, a
  `tags/<version>` copy in the same commit, and the developer's own SVN
  password for the commit. Write it down once Quevedo 1.5 is published.
- **The first SVN update, done by Claude step by step.** Quevedo 1.5 went out
  with Claude running every step, the commit included, and the developer
  confirming each one before it ran. A sparse checkout (`--depth immediates`,
  then `trunk/` and `assets/` at full depth and `tags/` empty) avoids
  downloading every old tag and still allows `svn cp trunk tags/<version>`.
  Check that the tag doesn't exist remotely (`svn ls .../tags/`) and compare
  the root `assets/` with the repo's by hash before touching it.
- **SVN credentials may or may not be cached.** The `svn.exe` from
  TortoiseSVN's command-line tools shares its credential store, so a password
  once saved by TortoiseSVN let the commit run without asking for it. That
  can't be assumed: check with `svn auth plugins.svn.wordpress.org` before the
  commit, and if nothing is cached, the developer enters their SVN password
  (or makes the commit). Never ask for it in the chat.
- **The same PowerShell pipe trap, again.** Listing the release with
  `git archive v1.5 | tar -t` failed with a malformed header, just as on the
  first project. Use `git archive --format=zip -o <file>` from the start.
- **The plugin API lags the commit.** Right after the commit the API still
  reported 1.4; it switched to 1.5 a few minutes later. Wait for it in a
  background loop before downloading the zip and comparing it with the
  `git archive` of the tag.
- **Old trunks carry development files.** Quevedo's SVN `trunk/` had
  `README.md`, `phpcs.xml` and the WordPress.org `assets/` folder, all of
  them shipped to users. Replacing `trunk/` with the release archive, instead
  of copying files over it, cleans that up.
- **Read the debug log through the mount.** The log lives in Playground's
  virtual file system. A throwaway PHP file in the mounted plugin folder that
  prints `wp-content/debug.log`, deleted right after, is the quickest way to
  read it.
- **Moving the repo breaks the Studio junction silently.** The repo had been
  cloned in the wrong folder and was moved later. The plugin folder in the
  Studio site was still a junction to the old path, now empty. Clone into the
  final folder from the start; after a move, recreate the junction
  (`(Get-Item <link>).Delete()`, then `New-Item -ItemType Junction`) and move
  Claude's per-project memory, which is keyed by the repo path.

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
- **`studio site start` needs someone at the desk.** It asks for UAC
  permission to edit the hosts file even when the entries are already there.
  Unattended, the prompt goes unanswered and the site stays offline, so the
  functional test moved to Playground, which needs no permissions. WP-CLI
  through `studio wp` works with the site stopped.
- **Test with HTTP requests, not a browser.** Read the hidden fields from the
  form page and post to Contact Form 7's REST endpoint
  (`/wp-json/contact-form-7/v1/contact-forms/<id>/feedback`): one call per
  case (human, honeypot filled, too fast, future start, missing start) and the
  `status` field says `mail_sent` or `spam`. For admin pages, log in with
  `curl -c/-b` and a cookie jar: PowerShell's `WebRequestSession` drops the
  `/wp-admin` auth cookie when WordPress sends several `Set-Cookie` headers,
  and every admin page redirects to the login.
- **Run Plugin Check on the extracted zip.** On the repo folder it flags
  `.claude`, `.github`, `CLAUDE.md` and untracked folders (here, a local copy
  of the original plugin in `code-reference/`), which never reach the zip.
  `studio wp plugin check <path>` accepts a folder outside the site.
- **`gh release create --target` needs the full SHA.** A short SHA fails with
  `Release.target_commitish is invalid`.

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
- **Two emails at once: read them in order.** A new AI-assisted pre-review
  ("Let's improve your plugin", review ID starting with `AUTOPREREVIEW`) and
  the approval ("Your review has been successfully completed") arrived minutes
  apart. Reading only the first one, we started planning a rename and a reply.
  The approval wins: the slug is fixed and no reply is needed.
- **The AI pre-review flags more than Plugin Check.** With Plugin Check clean,
  it still flagged unsanitized CSS from a filter passed to
  `wp_add_inline_style()`, and raised generic warnings about Guideline 11
  (just for having `admin_notices`) and about the name. Judge each one: the
  notices and the name stayed, the CSS was hardened in a point release,
  since it would come up again in later reviews.
- **Prove a security fix in Playground.** A test mu-plugin that returns
  `</style><script>` from the filter showed the payload reaching the page
  before the fix (recent WordPress already escapes `</style`, older ones don't
  guarantee it) and gone after it.
- **curl against Playground needs cookies.** Playground's auto-login
  redirects to the same URL until the browser keeps its cookie, so plain
  `curl -L` hangs in a loop. Use a cookie jar (`-c jar -b jar`).
- **The skill didn't load for a small fix.** Asked to harden one line after
  the review, Claude worked without loading `wp-agentic-workflow`, looked for
  a global `phpcs` on the PATH, found none and reported "PHPCS is not
  installed" instead of running `check-env.mjs` and setting up WPCS with
  Composer from the templates. The repo predated the skill, so step 2 had
  never been done there. Any change to plugin code, however small, is
  "continuing work on a plugin": load the skill first. A tool that is
  missing means "set it up", never "skip the check".
- **CF7 forms created in a blueprint: embed them by ID.** In a test blueprint,
  `[contact-form-7 id="<hash>"]` showed "Contact form not found"; the numeric
  `$form->id()` worked.
- **The skill had no SVN step.** It ended at submission, so the first upload
  was worked out on the spot: checkout in a separate folder with the slug as
  name, `trunk/` from the `git archive` zip, `svn copy` to the tag, assets
  with `svn:mime-type`, and the commit left to the developer, who made it
  with TortoiseSVN. Added to `release.md`.
- **Check the published plugin, not just the commit.** The plugin API and the
  `downloads.wordpress.org` zip confirm the version, and a `diff -r` showed
  the download identical to the `git archive` zip. WordPress.org now delays
  plugin updates by six hours before sites see them.
