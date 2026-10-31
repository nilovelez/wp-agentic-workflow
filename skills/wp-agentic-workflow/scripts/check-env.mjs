#!/usr/bin/env node
/**
 * Checks the tools needed to develop a WordPress plugin with this skill, and
 * that the current folder is a plugin whose folder name matches its slug.
 *
 * Usage, from the plugin repo root:
 *   node <skill>/scripts/check-env.mjs          Human-readable report.
 *   node <skill>/scripts/check-env.mjs --json   JSON report.
 *
 * Exit code: 0 if every required check passes, 1 otherwise.
 * It only reads: it never installs or changes anything.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const platform = process.platform; // 'win32', 'darwin' or 'linux'.

// How to install each tool, per platform. Shown only when a tool is missing.
const installHints = {
	git: {
		win32: 'winget install --id Git.Git -e',
		darwin: 'xcode-select --install (or: brew install git)',
		linux: 'sudo apt install git (or your distribution\'s package manager)',
	},
	node: {
		win32: 'winget install --id OpenJS.NodeJS.LTS -e',
		darwin: 'brew install node (or the LTS installer from https://nodejs.org/)',
		linux: 'Node.js LTS from https://nodejs.org/ (distribution packages are often too old)',
	},
	studio: {
		win32: 'Install WordPress Studio from https://developer.wordpress.com/studio/ (the `studio` command comes with it)',
		darwin: 'Install WordPress Studio from https://developer.wordpress.com/studio/ (the `studio` command comes with it)',
		linux: 'WordPress Studio is not available for Linux: use Playground for test sites and install WP-CLI from https://wp-cli.org/',
	},
	php: {
		win32: 'winget install --id PHP.PHP.NTS.8.4 -e, then run scripts/check-php.php to fix php.ini',
		darwin: 'brew install php',
		linux: 'sudo apt install php-cli php-curl php-mbstring php-xml php-zip',
	},
	composer: {
		win32: 'Run the installer from https://getcomposer.org/Composer-Setup.exe',
		darwin: 'brew install composer',
		linux: 'Follow https://getcomposer.org/download/ (or: sudo apt install composer)',
	},
	svn: {
		win32: 'winget install --id TortoiseSVN.TortoiseSVN -e, choosing "command line client tools" in the installer (they are not installed by default)',
		darwin: 'brew install subversion',
		linux: 'sudo apt install subversion',
	},
	chrome: {
		win32: 'winget install --id Google.Chrome -e (or set CHROME_PATH to another Chromium browser)',
		darwin: 'Install Google Chrome (or set CHROME_PATH to another Chromium browser)',
		linux: 'Install Google Chrome or Chromium (or set CHROME_PATH)',
	},
};

/**
 * Runs a command and returns its trimmed output, or null if it fails.
 * A shell is used so that Windows finds .bat and .cmd wrappers (studio, npm).
 */
function run( command ) {
	try {
		return execSync( command, { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ], timeout: 60000 } ).trim();
	} catch ( error ) {
		return null;
	}
}

/**
 * Returns the first version number (x.y or x.y.z) found in a text, or null.
 */
function findVersion( text ) {
	if ( ! text ) {
		return null;
	}
	const match = text.match( /\d+\.\d+(\.\d+)?/ );
	return match ? match[ 0 ] : null;
}

/**
 * Compares two version strings. Returns true if `version` >= `minimum`.
 */
function isAtLeast( version, minimum ) {
	const a = version.split( '.' ).map( Number );
	const b = minimum.split( '.' ).map( Number );
	for ( let i = 0; i < b.length; i++ ) {
		const partA = a[ i ] || 0;
		if ( partA !== b[ i ] ) {
			return partA > b[ i ];
		}
	}
	return true;
}

/**
 * Finds a Chrome executable: CHROME_PATH first, then the usual locations.
 */
function findChrome() {
	if ( process.env.CHROME_PATH ) {
		return existsSync( process.env.CHROME_PATH ) ? process.env.CHROME_PATH : null;
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
	for ( const candidate of candidates[ platform ] || [] ) {
		if ( existsSync( candidate ) ) {
			return candidate;
		}
	}
	return null;
}

/**
 * Looks for the main plugin file (a PHP file in the root with a
 * "Plugin Name:" header) and reads its Text Domain.
 */
function findPlugin( folder ) {
	const phpFiles = readdirSync( folder ).filter( ( file ) => file.endsWith( '.php' ) );
	for ( const file of phpFiles ) {
		// Headers live at the top of the file.
		const head = readFileSync( path.join( folder, file ), 'utf8' ).slice( 0, 8192 );
		const name = head.match( /^[ \t/*#@]*Plugin Name:(.*)$/mi );
		if ( ! name ) {
			continue;
		}
		const textDomain = head.match( /^[ \t/*#@]*Text Domain:(.*)$/mi );
		return {
			mainFile: file,
			name: name[ 1 ].trim(),
			textDomain: textDomain ? textDomain[ 1 ].trim() : null,
		};
	}
	return null;
}

const checks = [];

function addCheck( id, label, required, ok, detail ) {
	const check = { id, label, required, ok, detail };
	if ( ! ok && installHints[ id ] ) {
		check.install = installHints[ id ][ platform ];
	}
	checks.push( check );
}

// Git.
const gitVersion = findVersion( run( 'git --version' ) );
addCheck( 'git', 'Git', true, null !== gitVersion, gitVersion || 'not found' );

// Node.js and npm. Playground CLI needs Node.js 20.18 or later.
const nodeVersion = process.versions.node;
const nodeOk = isAtLeast( nodeVersion, '20.18.0' );
addCheck( 'node', 'Node.js', true, nodeOk, nodeVersion + ( nodeOk ? '' : ' (needs 20.18 or later)' ) );
const npmVersion = findVersion( run( 'npm --version' ) );
addCheck( 'npm', 'npm / npx', true, null !== npmVersion, npmVersion || 'not found (it comes with Node.js)' );

// WordPress Studio CLI: persistent test site and WP-CLI (`studio wp`).
const studioVersion = findVersion( run( 'studio --version' ) );
addCheck( 'studio', 'Studio CLI', true, null !== studioVersion, studioVersion || 'not found' );

// PHP and Composer: only for PHPCS with the WordPress Coding Standards.
const phpVersion = run( 'php -r "echo PHP_VERSION;"' );
const phpOk = null !== phpVersion && isAtLeast( phpVersion, '7.4.0' );
addCheck( 'php', 'PHP CLI', true, phpOk, phpVersion ? phpVersion + ( phpOk ? '' : ' (needs 7.4 or later)' ) : 'not found' );
const composerVersion = findVersion( run( 'composer --version --no-ansi' ) );
addCheck( 'composer', 'Composer', true, null !== composerVersion, composerVersion || 'not found' );

// Subversion: only for publishing on WordPress.org.
const svnVersion = findVersion( run( 'svn --version --quiet' ) );
addCheck( 'svn', 'Subversion', false, null !== svnVersion, svnVersion || 'not found (only needed to publish on WordPress.org)' );

// Chrome: only for WordPress.org screenshots and banners.
const chrome = findChrome();
addCheck( 'chrome', 'Chrome', false, null !== chrome, chrome || 'not found (only needed for WordPress.org assets)' );

// The plugin: folder name must match the slug (Text Domain).
const folder = process.cwd();
const folderName = path.basename( folder );
const plugin = findPlugin( folder );
const project = { folder, folderName, plugin: null, slugMatches: false };
if ( ! plugin ) {
	addCheck( 'plugin', 'Plugin', true, false, 'no PHP file with a "Plugin Name:" header in ' + folder );
} else {
	project.plugin = plugin;
	const slug = plugin.textDomain || path.basename( plugin.mainFile, '.php' );
	project.slugMatches = slug === folderName;
	let detail = plugin.mainFile + ', Text Domain: ' + ( plugin.textDomain || '(missing)' );
	if ( ! project.slugMatches ) {
		detail += ' -- the folder is "' + folderName + '" but the slug is "' + slug + '": rename the folder';
	}
	addCheck( 'plugin', 'Plugin', true, project.slugMatches, detail );
}

const ready = checks.every( ( check ) => check.ok || ! check.required );

if ( process.argv.includes( '--json' ) ) {
	console.log( JSON.stringify( { platform, ready, checks, project }, null, 2 ) );
} else {
	for ( const check of checks ) {
		let status = 'OK  ';
		if ( ! check.ok ) {
			status = check.required ? 'FAIL' : 'WARN';
		}
		console.log( `  [${ status }] ${ check.label.padEnd( 12 ) } ${ check.detail }` );
		if ( check.install ) {
			console.log( `         ${ ''.padEnd( 12 ) } Install: ${ check.install }` );
		}
	}
	console.log( '\n' + ( ready ? 'Result: READY' : 'Result: NOT READY' ) );
}

process.exit( ready ? 0 : 1 );
