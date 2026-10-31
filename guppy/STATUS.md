# Status

The first version of the skill (`SKILL.md`, `references/`, `scripts/` and `templates/`) was merged into `main` on 2026-10-13, after testing each piece on Windows 11 with Classic Honeypot for CF7. It was then tried on Quevedo, an existing plugin, and the findings went to `docs/lessons-learned.md`. The plan from here is ongoing: use the workflow on new projects and fold what each one teaches into the skill. On 2026-10-31 the lessons from Quevedo, Cute WP Badges, Camptix Badge Generator, the Classic Honeypot 1.0.2 release and the Windows shell were reviewed with Nilo and folded in: a new `references/testing.md`, Plugin Check on the extracted zip, the SVN update steps, Tailscale-first site addresses (`scripts/site-address.mjs`), Subversion in `check-env.mjs`, and Studio started only when Playground isn't enough. Plugins only so far; macOS/Linux are still untested and themes are not covered (WordPress.tv 27 showed what a theme needs). No blockers.

## Log

Newest entries first. One per work session, brief.

- 2026-10-31: lessons from other projects reviewed and folded into the skill: `references/testing.md` (new), Plugin Check on the extracted zip (validated), SVN updates, Playground ports, permalinks and stopping, Studio link moves, Windows shell, `assets/` reserved. New `scripts/site-address.mjs` (Tailscale IP first) and Subversion in `check-env.mjs`.
- 2026-10-18: Classic Honeypot for CF7 approved and published (1.0.1). The skill now loads for any plugin change, however small (it had not loaded for a review fix, so WPCS was skipped), and `release.md` covers the post-review emails and the SVN upload. Lessons added.
- 2026-10-16: migrated to the new Guppy format (STATUS.json). Status brought up to date: `feat/skill` was merged into `main` on 2026-10-13. Plan confirmed: keep using the workflow on new projects and fold the lessons into the skill.
- 2026-10-13/14: skill tested on Quevedo (Playground, Studio, Plugin Check, SVN); lessons added to `docs/lessons-learned.md`, including the missing SVN update workflow. Update instructions added to the README.
- 2026-10-13: first version of the skill in `feat/skill`, merged into `main` the same day. The script to apply blueprints in Studio is dropped (`studio create --blueprint` already does it); WPCS with Composer validated; `drafts/` integrated and removed.
- 2026-10-13: guppy/STATUS.md created. Repo renamed to `nilovelez/wp-agentic-workflow` (formerly `entorno-desarrollo-wp`).
