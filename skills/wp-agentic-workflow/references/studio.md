# Persistent site with Studio

For a test site that stays: data that survives between sessions, a fixed URL, WP-CLI, the MCP Adapter, screenshots. The plugin is linked from the repo, so the site always runs the code being edited. For the Studio CLI itself, see the official `studio-cli` skill.

## Create it

From the plugin repo root:

```bash
node <skill>/scripts/studio-site.mjs
```

It does, in order:

1. `studio create` in `~/Studio/<slug>` (`--sites-dir` to change it), PHP 8.3 (`--php`), domain `<slug>.local`, login `admin` / `password`, `--file-access all-files` (the plugin is a link to a folder outside the site), not started. If the repo has a `blueprint.json`, Studio applies it during creation.
2. Links the repo into `wp-content/plugins/<slug>`: a junction on Windows (no admin rights needed), a symbolic link elsewhere.
3. Activates the plugin with `studio wp plugin activate`.

The blueprint's `activatePlugin` step for the plugin itself does nothing during creation, because the link doesn't exist yet: Studio skips it without an error. That is why the script activates the plugin afterwards, and why test-content steps in the blueprint must not depend on the plugin being active.

The site is not started by the script: starting it adds `<slug>.local` to the hosts file, which asks for confirmation (a UAC prompt on Windows, an administrator password on macOS) that someone has to accept at that computer. Tell the developer before starting it, and wait for them if they are not at that computer.

```bash
studio start --path <site> --skip-browser
```

## WP-CLI

```bash
studio wp --path <site> <command>
```

It works with the site stopped. `studio wp shell` is not supported; use `studio wp eval`.

## From another machine

Studio's proxy (ports 80 and 443) listens on all interfaces, so another computer on the network only needs a line in its hosts file. Every time the site is up, say: "The test site is at `http://<slug>.local/` (admin / password). From another computer on this network, add `<LAN IP> <slug>.local` to its hosts file." Check the current LAN IP every time. The browser's "not secure" warning on plain HTTP is expected.

## Delete it

**Remove the plugin link first**, then delete the site. `studio delete` moves the site's files to the trash, and the link points to the repo.

- Windows (PowerShell): `(Get-Item <site>\wp-content\plugins\<slug>).Delete()` removes only the junction.
- macOS/Linux: `rm <site>/wp-content/plugins/<slug>` (no trailing slash, no `-r`).

Then `studio delete --path <site>`.
