# Disposable site with Playground

For day-to-day development: a fresh WordPress in seconds, with the plugin mounted from the repo. Nothing persists between runs unless you ask for it. For the Playground CLI itself (flags, snapshots, Xdebug), see the official `wp-playground` skill; for Blueprint syntax, the `blueprint` skill.

## The blueprint

Commit a `blueprint.json` to the repo root (start from `templates/blueprint.json`). It sets up everything the plugin needs to be tested:

- `login`, and debug constants (`WP_DEBUG`, `WP_DEBUG_LOG`, `SCRIPT_DEBUG`).
- Dependencies, for example other plugins from wordpress.org with `installPlugin`.
- `activatePlugin` for the plugin itself. The plugin is **mounted, not installed** by the blueprint.
- Test content (pages, forms, options) with `runPHP` or WP-CLI steps.

A real example: the [blueprint of Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7/blob/main/blueprint.json) installs Contact Form 7 and creates a page with a test form.

Rules:

- Make `runPHP` steps idempotent (check before creating), so the same blueprint can run on a site that already has the content.
- Steps that create test content must not depend on the plugin being active: on Studio the plugin is activated after the blueprint runs (see `studio.md`).
- Playground can't send email. If the plugin sends mail (or depends on one that does, like Contact Form 7), configure the test content so it doesn't need to (in Contact Form 7: `skip_mail: on` in the form's additional settings).

## Run it

From the repo root:

```bash
npx @wp-playground/cli@latest server --blueprint ./blueprint.json --mount-dir . /wordpress/wp-content/plugins/<slug>
```

- `--mount-dir <host> <vfs>` instead of `--mount <host>:<vfs>`: on Windows `--mount` rejects drive-letter paths, and `--mount-dir` works everywhere (relative paths too).
- In Git Bash on Windows, prefix the command with `MSYS_NO_PATHCONV=1` (see `environment.md`).
- The site is at <http://127.0.0.1:9400>. Login: `admin` / `password`.
- When you run it as a background task, give it the maximum timeout: with the default it is killed after a short while (30 minutes in Claude Code's case; the maximum is 2 hours).

## From another machine

The developer may be working from another computer on the network. Playground already listens on all interfaces, but WordPress redirects to the URL it was started with. To use it from another machine, start it with the LAN address of this computer:

```bash
npx @wp-playground/cli@latest server --blueprint ./blueprint.json --mount-dir . /wordpress/wp-content/plugins/<slug> --site-url http://<LAN IP>:9400
```

Then say: "The test site is at `http://<LAN IP>:9400/` (admin / password)." Check the current LAN IP every time; it can change.
