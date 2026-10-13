/**
 * Finds the installed Google Chrome (or the browser in CHROME_PATH), so that
 * playwright-core can drive it without downloading a browser of its own.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

export function findChrome() {
	if ( process.env.CHROME_PATH ) {
		return process.env.CHROME_PATH;
	}
	const chromeExe = path.join( 'Google', 'Chrome', 'Application', 'chrome.exe' );
	const candidates = {
		win32: [
			path.join( process.env.PROGRAMFILES || 'C:/Program Files', chromeExe ),
			path.join( process.env[ 'PROGRAMFILES(X86)' ] || 'C:/Program Files (x86)', chromeExe ),
			path.join( process.env.LOCALAPPDATA || '', chromeExe ),
		],
		darwin: [ '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ],
		linux: [ '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser' ],
	};
	for ( const candidate of candidates[ process.platform ] || [] ) {
		if ( existsSync( candidate ) ) {
			return candidate;
		}
	}
	throw new Error( 'Chrome not found. Install Google Chrome or set CHROME_PATH.' );
}
