# Code quality: WPCS and Plugin Check

Both must be clean before any release. They are not optional and not a matter of taste: they are how WordPress code is written and reviewed.

## WordPress Coding Standards (PHPCS)

Set up once per repo, with Composer as a development dependency:

1. Copy `templates/composer.json` and `templates/phpcs.xml.dist` to the repo root. In `composer.json`, set the package name. In `phpcs.xml.dist`, set the ruleset name, the plugin's text domain, its prefix (functions, options, hooks...) and the minimum WordPress version it supports.
2. `composer install`.
3. Add `/vendor/` to `.gitignore` (see `templates/gitignore`), and `composer.json`, `composer.lock` and `phpcs.xml.dist` to `.gitattributes` as `export-ignore` (see `release.md`).

`composer.json` must allow the `dealerdirect/phpcodesniffer-composer-installer` plugin before installing (the template does): it registers WPCS with PHPCS. Without it, `phpcs -i` doesn't list `WordPress`.

A repo that predates this setup has no WPCS yet: set it up as above. A missing tool means "set it up", never "skip the check".

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

## Translated strings

Once the plugin is translated on translate.wordpress.org, every changed source string loses its translations in every language. Before each commit that touches strings, compare the POT of the last release with the working tree's:

```bash
git archive --format=tar --prefix=<slug>/ -o <temp>/<slug>-release.tar <last release tag>
tar -xf <temp>/<slug>-release.tar -C <temp>
wp i18n make-pot <temp>/<slug> <temp>/release.pot
wp i18n make-pot . <temp>/current.pot --exclude=vendor,node_modules
```

`i18n make-pot` only reads files: the plain `wp`, with no site (see `environment.md`). `<temp>` is a folder outside the repo.

Diff the sorted `msgid` lines of both files. Change a string only when the new wording is worth losing its translations, and say so in the commit.

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
