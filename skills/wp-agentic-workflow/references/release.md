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
