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
| Studio CLI (`studio`) | Persistent test site, WP-CLI (`studio wp`) | Yes (not available on Linux) |
| PHP CLI 7.4+ | Composer and PHPCS | Yes |
| Composer | WordPress Coding Standards (PHPCS) | Yes |
| Chrome | WordPress.org screenshots and banners | No |
| Plugin folder | Folder name = plugin slug (Text Domain) | Yes |

For PHP, also run `php <skill>/scripts/check-php.php`: it checks the version, `php.ini`, the extensions Composer and PHPCS need, and prints the `php.ini` lines to fix.

WP-CLI is not installed separately: it comes with Studio as `studio wp`. For tasks that only need the repo, not a site (for example `i18n make-pot`), use `studio wp --studio-no-path`.

## When something is missing

1. List what is missing and what it is needed for.
2. Ask the developer whether they want the install instructions or want you to install it.
3. Instructions: give the platform's commands (the script prints them) and **stop until the developer confirms it is done**. Put them in your final message, not between tool calls, so they are not missed. Then check again.
4. Install it yourself: only with that explicit yes, one tool at a time, then check again. Installers with a GUI (Studio, Composer-Setup.exe on Windows) need the developer at the computer anyway: give instructions instead.

Install commands:

| Tool | Windows | macOS | Linux |
|---|---|---|---|
| Git | `winget install --id Git.Git -e` | `xcode-select --install` or `brew install git` | Distribution package (`sudo apt install git`) |
| Node.js | `winget install --id OpenJS.NodeJS.LTS -e` | `brew install node` | LTS from <https://nodejs.org/> (distribution packages are often too old) |
| Studio | Installer from <https://developer.wordpress.com/studio/> | Same | Not available: Playground only, and WP-CLI from <https://wp-cli.org/> |
| PHP | `winget install --id PHP.PHP.NTS.8.4 -e`, then `check-php.php` | `brew install php` | `sudo apt install php-cli php-curl php-mbstring php-xml php-zip` |
| Composer | <https://getcomposer.org/Composer-Setup.exe> (pick the PHP above, add to PATH) | `brew install composer` | <https://getcomposer.org/download/> |
| Chrome | `winget install --id Google.Chrome -e` | Installer | `google-chrome` or `chromium` package |

After installing, a new terminal is needed to pick up the new PATH. Tools started from an already running session (including Claude Code's shell) may still have the old PATH: call the tool by its full path (for example `C:\ProgramData\ComposerSetup\bin\composer.bat`) or restart the session.

## Folder name = slug

The repo folder must be named exactly like the plugin slug (the Text Domain, usually also the main file name). Mounting or linking a folder under another name needs fragile paths, especially on Windows. If it doesn't match, stop and give rename instructions: close the editor and Claude Code, rename the folder, open it again. Renaming the remote repo to match is recommended, not required.

## Windows shells

- **Git Bash can't run `studio` by name**: it is a `.bat` file. Use `studio.bat` in Git Bash, or PowerShell.
- **Git Bash rewrites Unix-looking arguments into Windows paths**: `/wordpress/...` becomes `C:/Program Files/Git/wordpress/...`. Prefix Playground commands with `MSYS_NO_PATHCONV=1`, or use PowerShell.
- **PowerShell pipes corrupt binary output**: write to a file instead (`git archive -o file.zip`, not `git archive | ...`).

macOS and Linux paths in this skill follow the documentation of each tool but have not been tested yet.
