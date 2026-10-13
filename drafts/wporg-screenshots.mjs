import { chromium } from 'playwright-core';

const site = 'http://classic-honeypot.local';
const out  = 'D:/repos/classic-honeypot-for-cf7/assets';

const browser = await chromium.launch( {
	executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
	headless: true,
} );
const page = await browser.newPage( { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } );

// Log in.
await page.goto( `${ site }/wp-login.php` );
await page.fill( '#user_login', 'admin' );
await page.fill( '#user_pass', 'password' );
await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );

// 1. Global honeypot settings.
await page.goto( `${ site }/wp-admin/admin.php?page=choneypot4cf7` );
await page.waitForLoadState( 'networkidle' );
await page.screenshot( { path: `${ out }/screenshot-1.png` } );

// 2. Honeypot form tag settings in the CF7 editor.
await page.goto( `${ site }/wp-admin/admin.php?page=wpcf7&post=5&action=edit` );
await page.waitForLoadState( 'networkidle' );
await page.click( 'button[data-target="tag-generator-panel-honeypot"]' );
await page.waitForSelector( 'dialog[open]' );
await page.waitForTimeout( 500 );
await page.screenshot( { path: `${ out }/screenshot-2.png` } );

await browser.close();
console.log( 'done' );
