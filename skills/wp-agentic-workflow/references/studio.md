# Persistent site with Studio

For a test site that stays: WP-CLI and Plugin Check (both work with the site stopped), and, when started, data that survives between sessions, a fixed URL and the MCP Adapter. The plugin is linked from the repo, so the site always runs the code being edited. For the Studio CLI itself, see the official `studio-cli` skill.

**Start it only when something needs testing that Playground can't cover** (persistent data, a fixed domain, the MCP Adapter...). For everything else, use Playground (`playground.md`).

## Create it

Clone the repo into its final folder first: the site links to that path (see "Moving the repo" below).

From the plugin repo root:

```bash
node <skill>/scripts/studio-site.mjs
```

It does, in order:

1. `studio create` in `~/Studio/<slug>` (`--sites-dir` to change it), PHP 8.3 (`--php`), domain `<slug>.local`, login `admin` / `password`, `--file-access all-files` (the plugin is a link to a folder outside the site), not started. If the repo has a `blueprint.json`, Studio applies it during creation.
2. Links the repo into `wp-content/plugins/<slug>`: a junction on Windows (no admin rights needed), a symbolic link elsewhere.
3. Activates the plugin with `studio wp plugin activate`.

The blueprint's `activatePlugin` step for the plugin itself does nothing during creation, because the link doesn't exist yet: Studio skips it without an error. That is why the script activates the plugin afterwards, and why test-content steps in the blueprint must not depend on the plugin being active.

## Start it

Starting the site writes `<slug>.local` to the hosts file, which can ask for confirmation (a UAC prompt on Windows, an administrator password on macOS) that someone has to accept at that computer. It is not known yet whether it asks on every start or only when the entry is missing. Unattended, the prompt goes unanswered and the site stays offline. Tell the developer before starting it, and wait for them if they are not at that computer.

```bash
studio start --path <site> --skip-browser
```

Studio updates itself and restarts running sites when it does. The link and the active plugin survive, but check that the site responds before trusting test results run around an update.

## WP-CLI

```bash
studio wp --path <site> <command>
```

It works with the site stopped. `studio wp shell` is not supported; use `studio wp eval`.

## From another machine

Studio's proxy (ports 80 and 443) listens on all interfaces, so another computer only needs a line in its hosts file. Get this computer's address with `node <skill>/scripts/site-address.mjs` (the Tailscale IP if Tailscale is running, otherwise the LAN IP; run it every time). Every time the site is up, say: "The test site is at `http://<slug>.local/` (admin / password). From another computer, add `<address> <slug>.local` to its hosts file." The browser's "not secure" warning on plain HTTP is expected, and the site is not a secure context there (see `playground.md`).

## Moving the repo

The plugin folder in the site is a link to the repo's path. If the repo is moved or renamed, the link still points to the old path, now empty, and nothing warns about it. Recreate the link:

- Windows (PowerShell): `(Get-Item <site>\wp-content\plugins\<slug>).Delete()`, then `New-Item -ItemType Junction -Path <site>\wp-content\plugins\<slug> -Target <new repo path>`.
- macOS/Linux: `rm <site>/wp-content/plugins/<slug>`, then `ln -s <new repo path> <site>/wp-content/plugins/<slug>`.

Claude Code's per-project memory is also keyed by the repo path: move it too (`~/.claude/projects/<path-based name>/`).

## Delete it

**Remove the plugin link first**, then delete the site. `studio delete` moves the site's files to the trash, and the link points to the repo.

- Windows (PowerShell): `(Get-Item <site>\wp-content\plugins\<slug>).Delete()` removes only the junction.
- macOS/Linux: `rm <site>/wp-content/plugins/<slug>` (no trailing slash, no `-r`).

Then `studio delete --path <site>`.
