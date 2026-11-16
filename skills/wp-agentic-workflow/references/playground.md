# Disposable site with Playground

For day-to-day development and most testing: a fresh WordPress in seconds, with the plugin mounted from the repo. Nothing persists between runs unless you ask for it. For the Playground CLI itself (flags, snapshots, Xdebug), see the official `wp-playground` skill; for Blueprint syntax, the `blueprint` skill.

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
- **Pretty permalinks need a `runPHP` step.** Setting the `permalink_structure` option (`setSiteOptions`) saves the option but not the rewrite rules, and every pretty URL then silently serves the home page with a 200. Set the structure in a `runPHP` step:

  ```php
  global $wp_rewrite;
  $wp_rewrite->set_permalink_structure( '/%postname%/' );
  flush_rewrite_rules();
  ```

  Then check one pretty URL before trusting any test that depends on them.
- **Every `defineWpConfigConsts` step uses `"method": "rewrite-wp-config"`** (the template does). With the default method, Playground keeps constants in a shared `consts.json` file that each step reads and writes back without a lock. With several workers (the CLI's default), a `login` step followed by `defineWpConfigConsts` can leave that file as invalid JSON, and then none of its constants are defined, including the one that keeps SQLite out of WAL mode: the database ends up "malformed" ([WordPress/wordpress-playground#4615](https://github.com/WordPress/wordpress-playground/issues/4615)). `rewrite-wp-config` writes plain `define()` calls to `wp-config.php` and doesn't touch `consts.json`. Any other step that defines constants carries the same risk.
- **`preferredVersions` wins over `--php` and `--wp`.** Starting the CLI with `--php` or `--wp` and a blueprint that sets `preferredVersions` runs the blueprint's versions, silently. To test other versions (the minimum supported, the latest), write a throwaway copy of the blueprint with other `preferredVersions` outside the repo, and check the PHP version in the `X-Powered-By` header.
- **Content seeded on the first request runs more than once.** Playground serves with several workers and the first page load fires several requests, so a "seed if not done yet" check can pass in two of them at once and duplicate every post. Use `add_option()` as a lock: it fails if the option already exists, so only one request seeds.
- **Seeded data must be complete, as the plugin would store it.** Data created by the blueprint or by a must-use plugin doesn't go through the plugin's own code (sanitizers, defaults, `save_post` handlers): a missing field the plugin always adds can break features later. Check seeded data through the plugin's UI, not only through its REST output.

## Run it

Check that port 9400 is free first: if another Playground (from another session, say) is using it, a new one silently picks another port. On Windows, `Get-NetTCPConnection -LocalPort 9400 -State Listen`; on macOS/Linux, `lsof -i :9400`. If it is taken, pass `--port=<free port>` (and use that port in `--site-url`).

From the repo root:

```bash
npx @wp-playground/cli@latest server --blueprint ./blueprint.json --mount-dir . /wordpress/wp-content/plugins/<slug>
```

- `--mount-dir <host> <vfs>` instead of `--mount <host>:<vfs>`: on Windows `--mount` rejects drive-letter paths, and `--mount-dir` works everywhere (relative paths too).
- In Git Bash on Windows, prefix the command with `MSYS_NO_PATHCONV=1` (see `environment.md`).
- The site is at <http://127.0.0.1:9400>. Login: `admin` / `password`.
- When you run it as a background task, give it the maximum timeout: with the default it is killed after a short while (30 minutes in Claude Code's case; the maximum is 2 hours).

To test exactly what WordPress.org will get, build the release zip (see `release.md`), extract it outside the repo and mount the extracted folder instead of `.`.

## Stop it

Stopping the background task may not stop Playground: on Windows, the `node` processes started by `npx` survive the shell, and the port stays in use. Find them by their command line and stop them:

- Windows (PowerShell): `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object CommandLine -like '*plugins/<slug>*' | ForEach-Object { Stop-Process -Id $_.ProcessId }`
- macOS/Linux: `pkill -f 'plugins/<slug>'`

## From another machine

The developer may be working from another computer. Playground already listens on all interfaces, but WordPress redirects to the URL it was started with, so start it with the address of this computer that the other one can reach:

```bash
node <skill>/scripts/site-address.mjs
```

It prints this computer's Tailscale IP if Tailscale is running (the developer probably connects through it), otherwise its LAN IP. Run it every time: addresses can change.

```bash
npx @wp-playground/cli@latest server --blueprint ./blueprint.json --mount-dir . /wordpress/wp-content/plugins/<slug> --site-url http://<address>:9400
```

Then say: "The test site is at `http://<address>:9400/` (admin / password)."

**A site reached by IP over plain HTTP is not a secure context.** Browsers only expose some APIs on HTTPS or `localhost`: `crypto.subtle`, the clipboard API, service workers... On `http://<address>:9400` they are missing, while on a real site with HTTPS they are there, so a bug can show only on the test site, or only in production. If the plugin uses any of them, give it a fallback and also test on `http://127.0.0.1:9400` on this computer (see `testing.md`).
