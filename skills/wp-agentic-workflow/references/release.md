# Release and WordPress.org

## The repo holds the plugin and its development files

The repo holds only the plugin plus its configuration and development files. Development files are kept out of the release zip with `export-ignore` in `.gitattributes` (start from `templates/gitattributes` and add any other development file or folder).

Translations: plugins hosted on WordPress.org are translated on translate.wordpress.org. They don't need a `languages/` folder or a `Domain Path` header. To check the strings, generate a POT without a site:

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
- In PowerShell, always write to a file with `-o`: piping binary output corrupts it.

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

Check out the SVN repository outside the Git repo, in its own folder with the slug as name, never inside the Git working tree:

```bash
svn checkout https://plugins.svn.wordpress.org/<slug> <svn-folder>/<slug>
```

For each version, after WPCS and Plugin Check are clean and the release is committed in Git:

1. Build the zip with `git archive` (see above) and extract it.
2. Replace the contents of `trunk/` with the extracted plugin. `svn add` new files and `svn delete` removed ones.
3. Copy `assets/` from the Git repo to `assets/` and set `svn:mime-type` on the images (`svn propset svn:mime-type image/png assets/*.png`), so browsers show them instead of downloading them.
4. Tag the version: `svn copy trunk tags/<version>`. The readme's `Stable tag` must name that tag.
5. Check `svn status`, and compare `trunk/` and `tags/<version>/` with the zip.
6. Commit: `svn commit -m "Release <version>"`. It publishes the plugin, so it is the developer's call: prepare everything and give them the message, or commit only when asked.

Afterwards, check that the plugin API (`https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=<slug>`) shows the new version and that `https://downloads.wordpress.org/plugin/<slug>.<version>.zip` matches the zip. WordPress.org can delay updates for a few hours before sites see them.

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
