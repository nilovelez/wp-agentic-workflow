# Code quality: WPCS, Plugin Check and Theme Check

WPCS and Plugin Check (Theme Check for a theme) must be clean before any release. They are not optional and not a matter of taste: they are how WordPress code is written and reviewed.

## WordPress Coding Standards (PHPCS)

Set up once per repo, with Composer as a development dependency:

1. Copy `templates/composer.json` and `templates/phpcs.xml.dist` to the repo root. In `composer.json`, set the package name. In `phpcs.xml.dist`, set the ruleset name, the plugin's text domain, its prefix (functions, options, hooks...) and the minimum WordPress version it supports.
2. `composer install`.
3. Add `/vendor/` to `.gitignore` (see `templates/gitignore`), and `composer.json`, `composer.lock` and `phpcs.xml.dist` to `.gitattributes` as `export-ignore` (see `release.md`).

`composer.json` must allow the `dealerdirect/phpcodesniffer-composer-installer` plugin before installing (the template does): it registers WPCS with PHPCS. Without it, `phpcs -i` doesn't list `WordPress`.

A repo that predates this setup has no WPCS yet: set it up as above. A missing tool means "set it up", never "skip the check".

If the repo already has a PHPCS ruleset, merge the template into it instead of replacing it: it carries the project's own values. A ruleset written for WPCS 2 stops WPCS 3 with an error such as `Property "minimum_supported_wp_version" does not exist`, and nothing is checked. Offer the developer to update it, following the [upgrade guide for ruleset maintainers](https://github.com/WordPress/WordPress-Coding-Standards/wiki/Upgrade-Guide-to-WordPressCS-3.0.0-for-ruleset-maintainers) and keeping its text domain, prefixes and minimum versions. Name it `phpcs.xml.dist`: that is the committed ruleset, and PHPCS reads a `phpcs.xml` before it, as each developer's local override.

Run it:

```bash
composer lint    # phpcs: report
composer fix     # phpcbf: fix what can be fixed automatically
```

Fix the code, don't silence the rule. When a rule must be ignored, ignore that one rule on that line and say why, for the plugin reviewers too:

```php
// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Read-only check, nothing is saved.
```

For a block, name the sniff in both `phpcs:disable` and `phpcs:enable`. A bare `// phpcs:enable` turns every rule back on, including those disabled elsewhere in the file.

In a project that isn't yours, with errors in code you didn't write, check only the lines you change (the project's own command if it has one, such as `phpcs-changed`), and leave the other errors alone: fixing them makes the pull request harder to review.

## Plugin Check

The official tool of the WordPress.org plugin review team. Run it on what reviewers will get, the release zip, not on the repo: on the repo folder (including the plugin linked into the Studio site) it also flags development files (`.git`, `.claude`, `.github`, `vendor/`, `CLAUDE.md`, extra Markdown files, untracked folders) that never reach the zip.

It needs a WordPress site with Plugin Check installed, but not a running one, and the plugin doesn't need to be installed in it: `plugin check` accepts a folder path. From the repo root:

```bash
node <skill>/scripts/playground-wp.mjs --plugin-check
```

It builds the release with `git archive HEAD`, extracts it to a temporary folder outside the repo (`--temp <folder>` to choose it), and runs `plugin check <folder> --include-experimental` on a disposable Playground site that has Plugin Check installed. Extra arguments for `plugin check` go after `--` (for example `-- --format=csv`). It takes about 20 seconds.

`git archive` takes committed files only: commit first.

On a Studio site, the same check is `studio wp --path <site> plugin check <extracted release folder> --include-experimental`, with Plugin Check installed there (`studio wp --path <site> plugin install plugin-check --activate`).

With WPCS clean, Plugin Check usually finds little. A common one: `load_plugin_textdomain()` is not needed for a plugin hosted on WordPress.org (see "Translations" in `release.md`).

For the plugin's code itself (security, Settings API, lifecycle), see the official `wp-plugin-development` skill. For the directory rules (licensing, naming, trialware), `wp-plugin-directory-guidelines`.

## Theme Check

For a theme, the equivalent of Plugin Check is Theme Check, the tool of the WordPress.org theme review team. The same way, on the release zip:

```bash
node <skill>/scripts/playground-wp.mjs --theme-check
```

It runs `wp theme-check run <slug>` with the extracted release mounted as an installed theme (Theme Check takes a theme slug, not a path). Extra arguments go after `--` (for example `-- --format=json`). Its findings come in three levels:

- **REQUIRED**: fix them before submitting; the theme is not accepted with them. The script exits with 1 when there is any.
- **RECOMMENDED**: review them one by one. Many depend on what the theme does (comments, menus, widget areas), and a theme that doesn't need a feature can leave it out.
- **INFO**: notes for the review, such as the extra accessibility review for the `accessibility-ready` tag.

A complete theme like Twenty Twenty-Five comes out with INFO items only. A very small theme can get many REQUIRED and RECOMMENDED items: that is what the check is for.
