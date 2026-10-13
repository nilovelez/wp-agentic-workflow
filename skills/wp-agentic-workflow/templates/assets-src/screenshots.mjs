/**
 * Takes the WordPress.org screenshots (screenshot-N.png in ../assets) from a
 * running test site, logged in as admin / password.
 *
 * Usage, from this folder:
 *   npm install
 *   node screenshots.mjs [site URL]
 *
 * The site URL defaults to the Playground server (http://localhost:9400).
 * Edit the list below: one entry per screenshot, in the same order as the
 * readme's == Screenshots == section. Uses the installed Google Chrome (or
 * CHROME_PATH).
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { findChrome } from './chrome.mjs';

const site   = ( process.argv[ 2 ] || 'http://localhost:9400' ).replace( /\/$/, '' );
const here   = path.dirname( fileURLToPath( import.meta.url ) );
const assets = path.join( here, '..', 'assets' );

// One entry per screenshot. `prepare` is optional: what to do on the page
// before taking it (open a dialog, fill a field...).
const screenshots = [
	{
		path: '/wp-admin/plugins.php',
	},
	// {
	// 	path: '/wp-admin/options-general.php?page=my-plugin',
	// 	prepare: async ( page ) => {
	// 		await page.click( '#some-button' );
	// 		await page.waitForSelector( 'dialog[open]' );
	// 	},
	// },
];

mkdirSync( assets, { recursive: true } );

const browser = await chromium.launch( { executablePath: findChrome(), headless: true } );
const page    = await browser.newPage( { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } );

// Log in.
await page.goto( `${ site }/wp-login.php` );
await page.fill( '#user_login', 'admin' );
await page.fill( '#user_pass', 'password' );
await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );

for ( let i = 0; i < screenshots.length; i++ ) {
	const screenshot = screenshots[ i ];
	const file       = `screenshot-${ i + 1 }.png`;

	await page.goto( site + screenshot.path );
	await page.waitForLoadState( 'networkidle' );
	if ( screenshot.prepare ) {
		await screenshot.prepare( page );
	}
	// Let animations settle.
	await page.waitForTimeout( 500 );

	await page.screenshot( { path: path.join( assets, file ) } );
	console.log( file );
}

await browser.close();
