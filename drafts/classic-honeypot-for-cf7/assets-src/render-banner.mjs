/**
 * Render banner.html into the WordPress.org banners in ../assets.
 *
 * Usage, from this folder:
 *   npm install
 *   node render-banner.mjs
 *
 * Uses the installed Google Chrome. Set CHROME_PATH to use another browser.
 */
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here   = path.dirname( fileURLToPath( import.meta.url ) );
const assets = path.join( here, '..', 'assets' );

const browser = await chromium.launch( {
	executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	headless: true,
	// Lets the canvas read the local icon file to clean its edges.
	args: [ '--allow-file-access-from-files' ],
} );

// The page is designed at 1544x500; the small banner is the same page at half scale.
const banners = [
	{ file: 'banner-1544x500.png', scale: 1 },
	{ file: 'banner-772x250.png', scale: 0.5 },
];

for ( const banner of banners ) {
	const page = await browser.newPage( {
		viewport: { width: 1544 * banner.scale, height: 500 * banner.scale },
		deviceScaleFactor: 1,
	} );

	await page.goto( pathToFileURL( path.join( here, 'banner.html' ) ).href );
	await page.waitForSelector( 'body[data-ready="1"]' );
	await page.evaluate( () => document.fonts.ready );

	if ( 1 !== banner.scale ) {
		await page.evaluate( ( scale ) => {
			document.body.style.zoom = scale;
		}, banner.scale );
	}

	await page.screenshot( { path: path.join( assets, banner.file ) } );
	await page.close();

	console.log( `${ banner.file }` );
}

await browser.close();
