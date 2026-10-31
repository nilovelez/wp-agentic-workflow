# Release and WordPress.org

## The repo holds the plugin and its development files

The repo holds only the plugin plus its configuration and development files. Development files are kept out of the release zip with `export-ignore` in `.gitattributes` (start from `templates/gitattributes` and add any other development file or folder).

`git archive` reads `.gitattributes` from the commit it archives: commit changes to it before building the zip.

To ship only part of an ignored folder, ignore the folder and then un-ignore what ships, one line per path:

```
/resources/icons/*.svg export-ignore
/resources/icons/arrow.svg -export-ignore
```

`assets/` is reserved for the WordPress.org images (see below) and always `export-ignore`d, even for a plugin that is only on GitHub today: it may go to the directory later. Files the plugin uses at runtime (icons, images, fonts) go in another folder, such as `resources/`.

## Translations

Plugins hosted on WordPress.org are translated on translate.wordpress.org and get language packs from there. They don't need a `languages/` folder, a `Domain Path` header or a `load_plugin_textdomain()` call. To see whether a plugin already has language packs: `https://api.wordpress.org/translations/plugins/1.0/?slug=<slug>`. To check the strings, generate a POT without a site:

```bash
studio wp --studio-no-path i18n make-pot . <slug>.pot
```

(Delete the `.pot` afterwards, or keep it out of the zip.)

## Build the zip

With Git only, from the repo root:

```bash
git archive --format=zip --prefix=<slug>/ -o <slug>-<version>.zip HEAD
```

- Only committed files are included: commit first.
- `export-ignore` paths are left out.
- In PowerShell, always write to a file with `-o`: piping binary output corrupts it (`git archive | tar -t` fails with a malformed header).

Check its contents (`unzip -l` or open it) before submitting: no development files, nothing missing.

## Before submitting

- WPCS clean and Plugin Check clean (see `quality.md`).
- `readme.txt`: short description of 150 characters or less; `Stable tag` equal to the plugin's `Version`; `Tested up to` the current WordPress version.
- Explain anything reviewers may question, in two places: in the code (`phpcs:ignore` with its reason) and in the submission form's "Additional Information" field.
- Review the directory guidelines with the official `wp-plugin-directory-guidelines` skill.

## After submitting

The automated scan runs first; then the plugin waits in the manual review queue (it can take weeks). If the reviewers ask for changes, **reply to their email**; never submit the plugin again.

Several emails can arrive close together: an AI-assisted pre-review ("Let's improve your plugin") and the approval ("Your review has been successfully completed"). Read them all, in order, before acting. Once approved, the slug is final and no reply is needed. Still go through each pre-review finding: fix the real ones in the next version (they will come up again in later reviews) and leave the rest.

## Upload to SVN

WordPress.org hosts plugins in Subversion, used as a release system: only commit versions ready to use. After approval, an email gives the SVN URL (`https://plugins.svn.wordpress.org/<slug>`). The SVN password is not the WordPress.org password: set it in the profile, under "Account & Security". Write access can take up to an hour after the email.

It needs a command-line `svn` (see `environment.md`). On Windows, TortoiseSVN alone is not enough: its command-line tools are an option of its installer, not installed by default.

Check out the SVN repository outside the Git repo, in its own folder with the slug as name, never inside the Git working tree. For a plugin with many versions, a sparse checkout avoids downloading every old tag and still allows tagging:

```bash
svn checkout --depth immediates https://plugins.svn.wordpress.org/<slug> <svn-folder>/<slug>
cd <svn-folder>/<slug>
svn update --set-depth infinity trunk assets
```

For each version, after WPCS and Plugin Check are clean and the release is committed in Git:

1. Check that the tag doesn't exist yet: `svn ls https://plugins.svn.wordpress.org/<slug>/tags/`.
2. Build the zip with `git archive` (see above) and extract it.
3. Replace the contents of `trunk/` with the extracted plugin: delete everything in `trunk/` and copy the release in, don't copy over the old files. Old trunks often carry development files (`README.md`, `phpcs.xml`, even an `assets/` folder) that reach users; replacing cleans them up. `svn add` new files and `svn delete` removed ones.
4. Compare the repo's `assets/` with the SVN `assets/` (by file hash). If they differ, copy the repo's over and set `svn:mime-type` on new images (`svn propset svn:mime-type image/png assets/*.png`), so browsers show them instead of downloading them.
5. Tag the version: `svn copy trunk tags/<version>`. The readme's `Stable tag` must name that tag.
6. Check `svn status`, and compare `trunk/` and `tags/<version>/` with the zip.
7. Commit: `svn commit -m "Release <version>"`. It publishes the plugin, so it is the developer's call: prepare everything, show what will be committed, and commit only when they say so, or give them the command.

The commit needs the developer's SVN password. It may be cached (the `svn` from TortoiseSVN shares its credential store): check with `svn auth plugins.svn.wordpress.org` before committing. If nothing is cached, the developer enters it in a terminal or makes the commit. Never ask for the password in the chat.

Afterwards, check the published plugin, not just the commit:

- The plugin API (`https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=<slug>`) shows the new version. It lags the commit by a few minutes: wait for it in a loop.
- `https://downloads.wordpress.org/plugin/<slug>.<version>.zip` has the same files as the `git archive` zip (`diff -r` on both, extracted).
- WordPress.org then delays updates for about six hours before sites see them.

## WordPress.org assets

The images of the plugin's page go in an `assets/` folder in the repo root, `export-ignore`d. It is uploaded as is to the `assets/` folder of the plugin's SVN repository:

| File | Size |
|---|---|
| `icon-128x128.png`, `icon-256x256.png` | Icon |
| `banner-772x250.png`, `banner-1544x500.png` | Banner |
| `screenshot-N.png` | One per entry in the readme's `== Screenshots ==`, in the same order |

Their sources go in an `assets-src/` folder, also `export-ignore`d, never in `assets/` (it is uploaded whole). Copy `templates/assets-src/` to the repo:

- `icon.html` and `banner.html`: the icon and banner as web pages, designed at the large size. As they come, they are placeholders with the plugin name; design them later.
- `render-assets.mjs`: renders both pages at both sizes into `../assets/`.
- `screenshots.mjs`: logs in to a running test site and takes the screenshots at 1280x800. Edit its list.

A designed example: the [assets-src of Classic Honeypot for CF7](https://github.com/nilovelez/classic-honeypot-for-cf7/tree/main/assets-src), with web fonts and the icon image cleaned up on a canvas.

They use `playwright-core` driving the installed Chrome (no browser download):

```bash
cd assets-src
npm install
node render-assets.mjs
node screenshots.mjs http://<slug>.local    # or the Playground URL
```

Add `node_modules/` to `.gitignore`.
