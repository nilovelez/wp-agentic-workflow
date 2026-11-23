# Lessons learned: inbox

New lessons from the projects that use the skill, including dead ends and
wrong assumptions, as they happen, newest project first. Anyone working on a
project can add to it; what is here has not been reviewed yet, and some of
it may turn out to be wrong.

When a lesson is reviewed, it moves to `lessons-applied.md`: to its main
part once it is in the skill, or to "Reviewed, not in the skill" with the
reason.

## Themes in the skill (November 2026)

- **WordPress/wordpress-playground#4615 is fixed in Playground CLI 3.1.66**
  (2026-11-23), which includes #4621 ("Await defineConstant in the login
  step") and #4675 ("Write boot constants only once per Playground server").
  Retested from Intentionally Blank with the default 6 workers; Nilo closed
  the issue with these results:
  - The issue's blueprint (`login` + `defineWpConfigConsts`, default
    method), 12 starts each: on 3.1.65, `consts.json` was invalid in 9 and
    every start lost `SQLITE_JOURNAL_MODE` and ended in WAL; on 3.1.66, 0
    of 12.
  - The theme's blueprint without `rewrite-wp-config`, theme mounted, 6
    starts each: on 3.1.65, `WP_DEBUG` was false in 4 and all 6 ended in
    WAL; on 3.1.66, 0 of 6.

  So the rule that every `defineWpConfigConsts` uses
  `"method": "rewrite-wp-config"` (`references/playground.md`, the blueprint
  templates) is only needed up to 3.1.65, unless the skill keeps it for
  another reason (WP-CLI only sees constants written to `wp-config.php`).
  To decide at review. Testing trap: on 3.1.66 the auto-login cookies are
  set after a redirect, so a check that reads cookies only from the first
  response wrongly reports that auto-login failed; follow redirects with a
  cookie jar.

- **To check: Plugin Check 2.2.0 prints a PHP deprecation notice.** Running
  `playground-wp.mjs --plugin-check` on Classic Honeypot for CF7 printed
  `Deprecated: trim(): Passing null to parameter #1 ($string) of type string
  is deprecated` from its bundled PHP_CodeSniffer
  (`vendor/squizlabs/php_codesniffer/src/Util/Common.php`, line 220), on
  Playground's PHP 8.3, before "No errors found". Nothing breaks. Check
  whether it is already reported or fixed upstream, and report it if not.

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
