# Code quality: WPCS and Plugin Check

Both must be clean before any release. They are not optional and not a matter of taste: they are how WordPress code is written and reviewed.

## WordPress Coding Standards (PHPCS)

Set up once per repo, with Composer as a development dependency:

1. Copy `templates/composer.json` and `templates/phpcs.xml.dist` to the repo root. In `composer.json`, set the package name. In `phpcs.xml.dist`, set the ruleset name, the plugin's text domain, its prefix (functions, options, hooks...) and the minimum WordPress version it supports.
2. `composer install`.
3. Add `/vendor/` to `.gitignore` (see `templates/gitignore`), and `composer.json`, `composer.lock` and `phpcs.xml.dist` to `.gitattributes` as `export-ignore` (see `release.md`).

`composer.json` must allow the `dealerdirect/phpcodesniffer-composer-installer` plugin before installing (the template does): it registers WPCS with PHPCS. Without it, `phpcs -i` doesn't list `WordPress`.

Run it:

```bash
composer lint    # phpcs: report
composer fix     # phpcbf: fix what can be fixed automatically
```

Fix the code, don't silence the rule. When a rule must be ignored, ignore that one rule on that line and say why, for the plugin reviewers too:

```php
// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Read-only check, nothing is saved.
```

## Plugin Check

The official tool of the WordPress.org plugin review team. Run it on the Studio site, where the plugin is linked:

```bash
studio wp --path <site> plugin install plugin-check --activate
studio wp --path <site> plugin check <slug> --include-experimental --exclude-directories=<dev dirs> --exclude-files=<dev files>
```

Plugin Check only takes a slug, and on a linked site that slug is the whole repo, development files included (it even flags `.git` and `.claude`). Exclude everything that is `export-ignore` in `.gitattributes`: folders in `--exclude-directories` (`.git`, `.claude`, `vendor`, `assets`, `assets-src`...) and files in `--exclude-files` (`.gitignore`, `.gitattributes`, `blueprint.json`, `composer.json`, `composer.lock`, `phpcs.xml.dist`, `README.md`, `CLAUDE.md`...). Then check the release zip itself (see `release.md`): only the files in it are what reviewers see.

For the plugin's code itself (security, Settings API, lifecycle), see the official `wp-plugin-development` skill. For the directory rules (licensing, naming, trialware), `wp-plugin-directory-guidelines`.
