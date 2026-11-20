# Lessons learned: inbox

New lessons from the projects that use the skill, including dead ends and
wrong assumptions, as they happen, newest project first. Anyone working on a
project can add to it; what is here has not been reviewed yet, and some of
it may turn out to be wrong.

When a lesson is reviewed, it moves to `lessons-applied.md`: to its main
part once it is in the skill, or to "Reviewed, not in the skill" with the
reason.

## A pull request to the WordPress.org Meta repository (November 2026)

Adding Photo Directory activity to WordPress.org profiles, in a partial
clone of `WordPress/wordpress.org` (`--filter=blob:none --sparse --depth 1`;
the repository is very large). The contribution goes through a pull request
from a fork, linked to a Meta Trac ticket.

- **`git grep` on a commit in a partial clone downloads every blob.** Like
  `git log -S`, `git grep <pattern> HEAD -- <path>` has to read the files
  that aren't checked out, so it fetches them one by one; it ran for over 10
  minutes and had to be stopped. To find files, use `git ls-tree -r
  --name-only HEAD | grep`, which reads only the tree, then add the folders
  to the sparse checkout with `git sparse-checkout add` and search them on
  disk. Adding a single file needs `--skip-checks`.
- **Clone the fork, or set up the remotes before starting.** The repository
  was cloned from `WordPress/wordpress.org`, so `origin` pointed to the
  upstream repository. The fix, before any commit: rename it to `upstream`
  (the partial clone settings move with it, so missing blobs keep coming from
  there), add the fork as `origin`, and block pushes to upstream with `git
  remote set-url --push upstream DISABLED`. A fork whose default branch is at
  the same commit as upstream accepts pushes from a shallow clone.
- **Check the git identity and the active `gh` account before committing.**
  The computer's global git identity and the logged-in `gh` account were not
  the developer's. In WordPress.org repositories this matters beyond the
  author line: Props Bot credits the commit authors and the people in the
  pull request. Set the identity in the repository only (`git config
  user.name` and `user.email`), and switch `gh` with `gh auth login` or `gh
  auth switch`; when git's credential helper for github.com is `gh auth
  git-credential`, the push uses the active `gh` account.
- **Projects with their own tooling keep it.** The repository has its own
  wp-env environments, PHPUnit suites and PHPCS setup; the skill's templates
  (blueprint, `composer.json`) don't apply. Its `composer run lint` reports
  every existing error in a file, so for a change to older files use the
  project's `composer run phpcs-changed`, which checks only the changed lines
  (new files need `git add -N` to be seen).

## Themes in the skill (November 2026)

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
