# A site that stays running, with Studio

For a site that has to stay running, with a fixed domain (`<slug>.local`): a site to show, to leave open for days, or to connect the MCP Adapter to. The plugin is linked from the repo, so the site always runs the code being edited. For the Studio CLI itself, see the official `studio-cli` skill.

Studio is recommended, not required. Playground covers everything else, persistent data and WP-CLI included (`playground.md`), and Plugin Check (`quality.md`). Use Studio only when the developer wants a site that stays up, and say first that starting it needs them at the computer (see "Start it").

## Create it

Clone the repo into its final folder first: the site links to that path (see "Moving the repo" below).

From the plugin or theme repo root:

```bash
node <skill>/scripts/studio-site.mjs
```

It does, in order:

1. `studio create` in `~/Studio/<slug>` (`--sites-dir` to change it), PHP 8.3 (`--php`), domain `<slug>.local`, login `admin` / `password`, `--file-access all-files` (the plugin is a link to a folder outside the site), not started. Studio applies the repo's `blueprint.json` during creation (or the file given with `--blueprint`, for a repo that isn't yours to add one to). A blueprint is required: without one, Studio creates the site without installing WordPress (there is no `wp-config.php`), and nothing can be activated.
2. Links the repo into `wp-content/plugins/<slug>` (a theme: `wp-content/themes/<slug>`): a junction on Windows (no admin rights needed), a symbolic link elsewhere.
3. Activates it with `studio wp plugin activate` (or `theme activate`).

The blueprint's `activatePlugin` step for the plugin itself does nothing during creation, because the link doesn't exist yet: Studio skips it without an error. That is why the script activates the plugin afterwards, and why test-content steps in the blueprint must not depend on the plugin being active. A theme's `activateTheme` step does leave it as the active theme, but its code isn't there while the blueprint runs either.

## Start it

Starting the site writes `<slug>.local` to the hosts file, which can ask for confirmation (a UAC prompt on Windows, an administrator password on macOS) that someone has to accept at that computer. It is not known yet whether it asks on every start or only when the entry is missing. Unattended, the prompt goes unanswered and the site stays offline. Tell the developer before starting it, and wait for them if they are not at that computer.

```bash
studio start --path <site> --skip-browser
```

On macOS, ask the developer to run the first start in their own terminal. Started by the agent, the administrator prompt appeared but rejected the developer's correct credentials, and Studio reported "User did not grant permission".

Studio updates itself and restarts running sites when it does. The link and the active plugin survive, but check that the site responds before trusting test results run around an update.

Updating the Studio app doesn't update the Studio CLI. After an app update, compare `studio --version` with the app's version; to update the CLI on macOS, `curl -fsSL https://wordpress.studio/install.sh | bash` (the command the CLI's own update notice gives).

## Links and PHP's file access

Studio sites run with `file-access: site-directory` by default: PHP's `open_basedir` covers only the site folder. `studio-site.mjs` creates the site with `all-files`; for an existing site, `studio config set --file-access all-files`. `studio wp` is not restricted, so WP-CLI can see a linked plugin that the web server can't.

On start, Studio adds the targets of the links in the site root and `wp-content` to `open_basedir`. A link added or replaced while the site runs makes Studio restart PHP a moment later, and pages loaded in between can't read the linked folder: WordPress may deactivate the plugin or switch to the default theme. **Change links only with the site stopped**, then start it and check (`wp plugin list`, `wp option get stylesheet`) before loading pages.

When the site and WP-CLI disagree, ask the web server: a throwaway PHP file in the site root that prints what you need (an option, a `realpath()`, `ini_get( 'open_basedir' )`) shows the real state in one request. Delete it afterwards.

## WP-CLI

```bash
studio wp --path <site> <command>
```

It works with the site stopped. `studio wp shell` is not supported; use `studio wp eval`.

## From another machine

Studio's proxy (ports 80 and 443) listens on all interfaces, so another computer only needs a line in its hosts file. Get this computer's address with `node <skill>/scripts/site-address.mjs` (the Tailscale IP if Tailscale is running, otherwise the LAN IP; run it every time). Every time the site is up, say: "The test site is at `http://<slug>.local/` (admin / password). From another computer, add `<address> <slug>.local` to its hosts file." The browser's "not secure" warning on plain HTTP is expected, and the site is not a secure context there (see `playground.md`).

## Moving the repo

The plugin (or theme) folder in the site is a link to the repo's path. If the repo is moved or renamed, the link still points to the old path, now empty, and nothing warns about it. Recreate the link:

- Windows (PowerShell): `(Get-Item <site>\wp-content\plugins\<slug>).Delete()`, then `New-Item -ItemType Junction -Path <site>\wp-content\plugins\<slug> -Target <new repo path>`.
- macOS/Linux: `rm <site>/wp-content/plugins/<slug>`, then `ln -s <new repo path> <site>/wp-content/plugins/<slug>`.

Claude Code's per-project memory is also keyed by the repo path: move it too (`~/.claude/projects/<path-based name>/`).

## Delete it

**Remove the plugin (or theme) link first**, then delete the site. `studio delete` moves the site's files to the trash, and the link points to the repo.

- Windows (PowerShell): `(Get-Item <site>\wp-content\plugins\<slug>).Delete()` removes only the junction.
- macOS/Linux: `rm <site>/wp-content/plugins/<slug>` (no trailing slash, no `-r`).

Then `studio delete --path <site>`.
