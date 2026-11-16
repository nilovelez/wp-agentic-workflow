# Status

The first version of the skill (`SKILL.md`, `references/`, `scripts/` and `templates/`) was merged into `main` on 2026-10-13, after testing each piece on Windows 11 with Classic Honeypot for CF7. It was then tried on Quevedo, an existing plugin, and the findings went to `docs/lessons-learned.md`. The plan from here is ongoing: use the workflow on new projects and fold what each one teaches into the skill. On 2026-10-31 the lessons from Quevedo, Cute WP Badges, Camptix Badge Generator, the Classic Honeypot 1.0.2 release and the Windows shell were reviewed with Nilo and folded in: a new `references/testing.md`, Plugin Check on the extracted zip, the SVN update steps, Tailscale-first site addresses (`scripts/site-address.mjs`), Subversion in `check-env.mjs`, and Studio started only when Playground isn't enough. On 2026-11-04 the environment moved from Windows 11 to a Mac mini (M1): the environment scripts work unchanged on macOS (lessons added); Studio CLI 2.1.1 is installed but not yet tested with the skill, and seven lessons from other projects added since 2026-10-31 are still to be folded in. On 2026-11-16 the November lessons were reviewed and the skill reworked: Playground now covers almost every test site (persistent sites, and WP-CLI and Plugin Check without a web server through the new `scripts/playground-wp.mjs`), WP-CLI is a required tool, Studio is optional for a site that stays running, the blueprint template avoids the `consts.json` corruption (WordPress/wordpress-playground#4615), one address per test site, a working rule to protect the translated strings of published plugins, and one rule for when a tool fails. The lessons file was split: `docs/lessons-learned.md` is the inbox and `docs/lessons-applied.md` the reviewed record; the inbox still holds the theme lessons and three loose ones. Plugins only so far; Linux is still untested and themes are not covered (WordPress.tv 27 showed what a theme needs). No blockers.

## Pending tests on Windows

Written on macOS and not yet tested on Windows (there is no Windows machine at hand now):

- `scripts/playground-wp.mjs`: on Windows it runs `npx` through a shell, quoting every argument. Check that WP-CLI arguments with spaces and quotes (for example `eval 'echo "a b";'`) arrive intact.
- `scripts/check-env.mjs`: the Studio app locations (`%LOCALAPPDATA%\studio\Studio.exe`, `%LOCALAPPDATA%\Programs\Studio\Studio.exe`), and reading the `.phar` path from `wp --info` with a `wp.bat` wrapper.
- `references/environment.md`: the WP-CLI install on Windows (`wp-cli.phar` plus a `wp.bat`).

## Log

Newest entries first. One per work session, brief.

- 2026-11-16: November lessons reviewed and folded in. Playground for almost every site with `scripts/playground-wp.mjs` (WP-CLI and Plugin Check, no server), WP-CLI required, Studio optional, blueprint template fixed for #4615, one address per site, protection of translated strings in published plugins, one rule for failures. Lessons split into an inbox and an applied record; review criteria added to `CLAUDE.md`.
- 2026-11-04: environment moved to a Mac mini (M1): Homebrew tools, Studio CLI 2.1.1, skills reinstalled, GitHub credentials outside the keychain. macOS lessons added. `CLAUDE.md` updated to the current Guppy status contract (`inactive`, `archived`, dates every session).
- 2026-10-31: lessons from other projects reviewed and folded into the skill: `references/testing.md` (new), Plugin Check on the extracted zip (validated), SVN updates, Playground ports, permalinks and stopping, Studio link moves, Windows shell, `assets/` reserved. New `scripts/site-address.mjs` (Tailscale IP first) and Subversion in `check-env.mjs`.
- 2026-10-18: Classic Honeypot for CF7 approved and published (1.0.1). The skill now loads for any plugin change, however small (it had not loaded for a review fix, so WPCS was skipped), and `release.md` covers the post-review emails and the SVN upload. Lessons added.
- 2026-10-16: migrated to the new Guppy format (STATUS.json). Status brought up to date: `feat/skill` was merged into `main` on 2026-10-13. Plan confirmed: keep using the workflow on new projects and fold the lessons into the skill.
- 2026-10-13/14: skill tested on Quevedo (Playground, Studio, Plugin Check, SVN); lessons added to `docs/lessons-learned.md`, including the missing SVN update workflow. Update instructions added to the README.
- 2026-10-13: first version of the skill in `feat/skill`, merged into `main` the same day. The script to apply blueprints in Studio is dropped (`studio create --blueprint` already does it); WPCS with Composer validated; `drafts/` integrated and removed.
- 2026-10-13: guppy/STATUS.md created. Repo renamed to `nilovelez/wp-agentic-workflow` (formerly `entorno-desarrollo-wp`).
