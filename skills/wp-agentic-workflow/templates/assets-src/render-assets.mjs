/**
 * Renders icon.html and banner.html into the WordPress.org icons and banners
 * in ../assets.
 *
 * Usage, from this folder:
 *   npm install
 *   node render-assets.mjs
 *
 * Each page is designed at the large size; the small size is the same page
 * at half scale. Uses the installed Google Chrome (or CHROME_PATH).
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { findChrome } from './chrome.mjs';

const here   = path.dirname( fileURLToPath( import.meta.url ) );
const assets = path.join( here, '..', 'assets' );

const images = [
	{ source: 'icon.html', file: 'icon-256x256.png', width: 256, height: 256, scale: 1 },
	{ source: 'icon.html', file: 'icon-128x128.png', width: 256, height: 256, scale: 0.5 },
	{ source: 'banner.html', file: 'banner-1544x500.png', width: 1544, height: 500, scale: 1 },
	{ source: 'banner.html', file: 'banner-772x250.png', width: 1544, height: 500, scale: 0.5 },
];

mkdirSync( assets, { recursive: true } );

const browser = await chromium.launch( {
	executablePath: findChrome(),
	headless: true,
	// Lets the pages load images next to them (for example, an icon file).
	args: [ '--allow-file-access-from-files' ],
} );

for ( const image of images ) {
	const page = await browser.newPage( {
		viewport: { width: image.width * image.scale, height: image.height * image.scale },
		deviceScaleFactor: 1,
	} );

	await page.goto( pathToFileURL( path.join( here, image.source ) ).href, { waitUntil: 'load' } );
	await page.evaluate( () => document.fonts.ready );

	if ( 1 !== image.scale ) {
		await page.evaluate( ( scale ) => {
			document.body.style.zoom = scale;
		}, image.scale );
	}

	await page.screenshot( { path: path.join( assets, image.file ) } );
	await page.close();

	console.log( image.file );
}

await browser.close();
