# Lessons learned: inbox

New lessons from the projects that use the skill, including dead ends and
wrong assumptions, as they happen, newest project first. Anyone working on a
project can add to it; what is here has not been reviewed yet, and some of
it may turn out to be wrong.

When a lesson is reviewed, it moves to `lessons-applied.md`: to its main
part once it is in the skill, or to "Reviewed, not in the skill" with the
reason.

## WP-CLI on Playground instead of Studio (November 2026)

`studio wp --studio-no-path` stopped working in Studio CLI 2.x, which left
no way to run WP-CLI without a site. Looking for a replacement showed that
Playground can do most of what Studio was used for. Tested on macOS with
Playground CLI 3.1.65, WP-CLI 2.12.0 and Classic Honeypot for CF7.

- **To check again: WP-CLI 2.12.0 on PHP 8.5 prints deprecation notices.**
  Homebrew's `php` is 8.5 now. WP-CLI's bundled `react/promise` uses `case
  ...;`, deprecated in PHP 8.5, and the notice goes to standard output,
  before the command's own output. WP-CLI fixed it in its nightly builds in
  March 2026 ([wp-cli/wp-cli#6271](https://github.com/wp-cli/wp-cli/issues/6271)),
  but 2.12.0 (May 2025) is still the latest stable release, and a request
  for a patch release ([#6435](https://github.com/wp-cli/wp-cli/issues/6435))
  is open with no date. Even the nightly still prints notices from its
  bundled gettext during `i18n make-pot`
  ([wp-cli/i18n-command#521](https://github.com/wp-cli/i18n-command/issues/521)).
  Checked again on 2026-11-17: no new release. Nothing breaks: scripts that read
  WP-CLI's output skip the notices, and Playground runs PHP 8.3, where they
  don't appear. Check for a new stable release; when it ships, update and
  see whether the notices are gone.

## Intentionally Blank: the plugin workflow on a classic theme (November 2026)

First run of the skill on a theme repo, on macOS. The skill's tooling and
templates assume a plugin; everything except Plugin Check carried over with
small changes.

- **`check-env.mjs` fails on a theme.** It looks for a PHP file with a
  `Plugin Name:` header and reports NOT READY. Every tool was fine; the only
  failure was the missing plugin header. A theme check would look for
  `style.css` with a `Theme Name:` header (and folder = Text Domain).
- **Blueprint for a theme:** mount the repo at
  `/wordpress/wp-content/themes/<slug>` and use `activateTheme` with
  `themeFolderName` instead of `activatePlugin`. The landing page makes more
  sense as `/` than `/wp-admin/plugins.php`. Worked first time on macOS.
- **`.gitattributes` for a theme:** don't export-ignore `screenshot.png`
  (the theme needs it); `/.github` and `/guppy` go out of the zip too.
- **Plugin Check doesn't apply.** The theme equivalent is the Theme Check
  plugin (`theme-check`); the skill doesn't cover it yet. (This particular
  theme is flagged as a special case in the WordPress.org theme directory and
  skips Theme Check, but any other theme would need it.)
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
- **Guard the translated strings with WP-CLI.** For a theme or plugin
  already translated on translate.wordpress.org, generate a POT of the last
  release (`git archive <tag>` into scratch, then `i18n make-pot`) and of the
  working tree, and diff their sorted `msgid` lines before each commit. Any
  changed string drops its translations in every language. In this theme the
  `style.css` headers (Theme Name, Description, Author, URIs) are translated
  strings too.

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
