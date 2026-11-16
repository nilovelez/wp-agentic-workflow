# Environment check

Run this before anything else in a session, and again after installing a missing tool.

## Check

From the plugin repo root:

```bash
node <skill>/scripts/check-env.mjs
```

(`--json` for a machine-readable report.) If Node.js itself is missing, the script can't run: say so and offer to install Node.js first.

It checks:

| Tool | Needed for | Required |
|---|---|---|
| Git | Version control, release zips (`git archive`) | Yes |
| Node.js 20.18+ and npm | Playground CLI, asset scripts | Yes |
| PHP CLI 7.4+ | Composer, PHPCS and WP-CLI | Yes |
| WP-CLI (`wp`), installed as a `.phar` | Tasks on the repo alone (`i18n`), and commands on Playground sites (see `playground.md`) | Yes |
| Composer | WordPress Coding Standards (PHPCS) | Yes |
| Studio app and Studio CLI (`studio`) | A persistent test site that stays running with a fixed domain (`studio.md`) | Recommended (not available on Linux) |
| Subversion (`svn`) | Publishing on WordPress.org | No |
| Chrome | WordPress.org screenshots and banners, headless browser tests | No |
| Plugin folder | Folder name = plugin slug (Text Domain) | Yes |

For PHP, also run `php <skill>/scripts/check-php.php`: it checks the version, `php.ini`, the extensions Composer and PHPCS need, and prints the `php.ini` lines to fix.

WP-CLI is used in two ways:

- **On the repo alone**, with no WordPress site: `wp i18n make-pot`, `wp i18n make-json`... Run `wp` from the repo root.
- **On a site**: on a Playground site through `scripts/playground-wp.mjs`, which mounts WP-CLI's `.phar` into it (see `playground.md`); on a Studio site, `studio wp --path <site>`. Never run a site command (`plugin`, `option`, `post`...) with the plain `wp`: there is no site for it to act on.

The script reads the `.phar` path from `wp --info`. Installs that are not a `.phar` (a package manager's wrapper script, for example) can't be mounted: install the `.phar` as below.

Studio is recommended but not required. If the Studio app or the Studio CLI is missing, say so, explain what it is for (a persistent site that stays running), and offer to guide the developer through installing it. Don't block the work on it.

## When something is missing

When a tool fails instead, see "When something fails" in `SKILL.md`.


1. List what is missing and what it is needed for.
2. Ask the developer whether they want the install instructions or want you to install it.
3. Instructions: give the platform's commands (the script prints them) and **stop until the developer confirms it is done**. Put them in your final message, not between tool calls, so they are not missed. Then check again.
4. Install it yourself: only with that explicit yes, one tool at a time, then check again. Installers with a GUI (Studio, Composer-Setup.exe on Windows) need the developer at the computer anyway: give instructions instead.

Install commands:

| Tool | Windows | macOS | Linux |
|---|---|---|---|
| Git | `winget install --id Git.Git -e` | `xcode-select --install` or `brew install git` | Distribution package (`sudo apt install git`) |
| Node.js | `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node` | LTS from <https://nodejs.org/> (distribution packages are often too old) |
| PHP | `winget install --id PHP.PHP.NTS.8.4 -e`, then `check-php.php` | `brew install php` | `sudo apt install php-cli php-curl php-mbstring php-xml php-zip` |
| WP-CLI | Download [`wp-cli.phar`](https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar) to a folder in the PATH, with a `wp.bat` next to it: `@php "%~dp0wp-cli.phar" %*` | `brew install wp-cli` (a `.phar`) | Download `wp-cli.phar`, `chmod +x`, move it to `/usr/local/bin/wp` (<https://wp-cli.org/>) |
| Studio app | Installer from <https://developer.wordpress.com/studio/> | Same; open it once | Not available: Playground covers every test site |
| Studio CLI | Turn it on in the Studio app settings | Same, or `curl -fsSL https://wordpress.studio/install.sh \| bash` | Not available |
| Composer | <https://getcomposer.org/Composer-Setup.exe> (pick the PHP above, add to PATH) | `brew install composer` | <https://getcomposer.org/download/> |
| Subversion | `winget install --id TortoiseSVN.TortoiseSVN -e`, choosing "command line client tools" in the installer | `brew install subversion` | `sudo apt install subversion` |
| Chrome | `winget install --id Google.Chrome -e` | Installer | `google-chrome` or `chromium` package |

After installing, a new terminal is needed to pick up the new PATH. Tools started from an already running session (including Claude Code's shell) may still have the old PATH: call the tool by its full path (for example `C:\ProgramData\ComposerSetup\bin\composer.bat`) or restart the session.

## Folder name = slug

The repo folder must be named exactly like the plugin slug (the Text Domain, usually also the main file name). Mounting or linking a folder under another name needs fragile paths, especially on Windows. If it doesn't match, stop and give rename instructions: close the editor and Claude Code, rename the folder, open it again. Renaming the remote repo to match is recommended, not required.

## Windows shells

In Claude Code on Windows, prefer the PowerShell tool to the Bash tool. The Bash tool (Git Bash) loses half the backslashes of a command before bash sees it, even in single quotes and quoted heredocs: Windows paths and regular expressions break, and files written with `echo` or `cat <<'EOF'` come out wrong. The PowerShell tool passes the text intact.

- **Create and edit files with the Write and Edit tools**, never with `echo`, heredocs or `Set-Content`. For a helper script, write it to a file and run it by its path.
- **`Set-Content` and `Out-File` end the file with CRLF**, even on LF text. For exact contents use `[IO.File]::WriteAllText(<path>, <text>, (New-Object Text.UTF8Encoding($false)))`.
- **Line endings**: the `.gitattributes` template (`* text=auto eol=lf`) keeps LF in the repo whatever Git's `core.autocrlf` is.

If you do use Git Bash:

- **Git Bash can't run `studio` by name**: it is a `.bat` file. Use `studio.bat` in Git Bash, or PowerShell.
- **Git Bash rewrites Unix-looking arguments into Windows paths**: `/wordpress/...` becomes `C:/Program Files/Git/wordpress/...`. Prefix Playground commands with `MSYS_NO_PATHCONV=1`, or use PowerShell.
- **PowerShell pipes corrupt binary output**: write to a file instead (`git archive -o file.zip`, not `git archive | ...`).

## macOS shell

On macOS the Bash tool runs zsh, and backslashes reach it intact. But zsh's `echo` interprets backslash sequences: `echo 'a\\b'` prints `a\b`. To print exact text use `printf '%s\n' '...'`; to write files, the Write and Edit tools, as on Windows.

Linux paths in this skill follow the documentation of each tool but have not been tested yet.
