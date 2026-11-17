#!/usr/bin/env node
/**
 * Runs WP-CLI on a Playground site, or Plugin Check on the release zip,
 * without starting a web server. It uses the Playground CLI's `php` command:
 * it builds a WordPress site, runs one PHP script in it (here, WP-CLI's
 * .phar, mounted from this computer) and exits.
 *
 * Usage, from the plugin repo root:
 *
 *   node <skill>/scripts/playground-wp.mjs [options] -- <wp-cli arguments>
 *     WP-CLI on a disposable site built from the repo's blueprint.json, with
 *     the plugin mounted from the repo. Nothing is kept afterwards.
 *     Example: node playground-wp.mjs -- plugin list
 *
 *   node <skill>/scripts/playground-wp.mjs --site <folder> [options] -- <wp-cli arguments>
 *     WP-CLI on a persistent site kept in <folder> (outside the repo). If the
 *     folder is empty or doesn't exist, the site is created there first, from
 *     the blueprint. Works while a Playground server is running on the same
 *     folder (see references/playground.md).
 *
 *   node <skill>/scripts/playground-wp.mjs --plugin-check [--temp <folder>] [-- <extra plugin check arguments>]
 *     Builds the release zip with `git archive HEAD`, extracts it into a
 *     temporary folder and runs Plugin Check on it, on a disposable site.
 *
 * Options:
 *   --blueprint <file>  Blueprint to use instead of ./blueprint.json.
 *   --php <version>     PHP version (the blueprint's preferredVersions wins).
 *   --wp <version>      WordPress version (the same).
 *   --temp <folder>     Where --plugin-check puts the zip (default: the
 *                       system's temporary folder).
 *
 * Needs WP-CLI installed as a .phar (see references/environment.md): its
 * path comes from `wp --info`.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { findProject } from './project.mjs';
import os from 'node:os';
import path from 'node:path';

const isWindows = 'win32' === process.platform;

// Arguments before "--" are this script's; the rest go to WP-CLI.
const separator = process.argv.indexOf( '--' );
const ownArgs = -1 === separator ? process.argv.slice( 2 ) : process.argv.slice( 2, separator );
const wpArgs = -1 === separator ? [] : process.argv.slice( separator + 1 );

/**
 * Reads the value of a "--name value" option, or returns the default.
 */
function getOption( name, defaultValue ) {
	const index = ownArgs.indexOf( name );
	if ( -1 === index || index + 1 >= ownArgs.length ) {
		return defaultValue;
	}
	return ownArgs[ index + 1 ];
}

/**
 * Stops with an error message.
 */
function fail( message ) {
	console.error( message );
	process.exit( 1 );
}

/**
 * Runs a command and returns its output, or null if it fails.
 */
function capture( command ) {
	const result = spawnSync( command, { encoding: 'utf8', shell: true } );
	return 0 === result.status ? result.stdout : null;
}

/**
 * Finds the path of WP-CLI's .phar with `wp --info`. WP-CLI may print PHP
 * deprecation notices before the JSON, so only the line that starts with "{"
 * is read.
 */
function findWpCliPhar() {
	const output = capture( 'wp --info --format=json' );
	if ( ! output ) {
		return null;
	}
	const jsonLine = output.split( /\r?\n/ ).find( ( line ) => line.startsWith( '{' ) );
	if ( ! jsonLine ) {
		return null;
	}
	const info = JSON.parse( jsonLine );
	return info.wp_cli_phar_path ? info.wp_cli_phar_path.replace( /^phar:\/\//, '' ) : null;
}

/**
 * Runs the Playground CLI with the given arguments, showing its output, and
 * returns its exit code. On Windows `npx` is a .cmd file, which needs a
 * shell; arguments are quoted for it. Elsewhere no shell is used, so the
 * arguments reach WP-CLI exactly as given.
 */
function playground( args ) {
	const fullArgs = [ '-y', '@wp-playground/cli@latest', 'php', ...args ];
	let result;
	if ( isWindows ) {
		const quoted = fullArgs.map( ( arg ) => '"' + arg.replace( /"/g, '\\"' ) + '"' );
		result = spawnSync( 'npx ' + quoted.join( ' ' ), { stdio: 'inherit', shell: true } );
	} else {
		result = spawnSync( 'npx', fullArgs, { stdio: 'inherit' } );
	}
	return null === result.status ? 1 : result.status;
}

const repo = process.cwd();
const slug = path.basename( repo );
const project = findProject( repo );
if ( project.error ) {
	fail( project.error + '. Run this from the plugin repo root.' );
}
if ( 'plugin' !== project.type ) {
	fail( `${ repo } is a theme: this script doesn't support themes yet.` );
}

const phar = findWpCliPhar();
if ( ! phar || ! existsSync( phar ) ) {
	fail( 'WP-CLI not found as a .phar. Run check-env.mjs and install it (see references/environment.md).' );
}

// WP-CLI's folder is mounted, and its .phar is run from there.
const commonArgs = [ '--mount-dir', path.dirname( phar ), '/tools/wp-cli' ];
const php = getOption( '--php', null );
const wp = getOption( '--wp', null );
if ( php ) {
	commonArgs.push( '--php', php );
}
if ( wp ) {
	commonArgs.push( '--wp', wp );
}
const wpCli = [ '--', '/tools/wp-cli/' + path.basename( phar ), '--path=/wordpress' ];

// Plugin Check on the extracted release zip.
if ( ownArgs.includes( '--plugin-check' ) ) {
	const tempBase = getOption( '--temp', os.tmpdir() );
	mkdirSync( tempBase, { recursive: true } );
	const temp = mkdtempSync( path.join( tempBase, slug + '-plugin-check-' ) );

	// A tar archive, not a zip: `tar` can extract it on Windows, macOS and Linux.
	const archive = path.join( temp, slug + '.tar' );
	const archived = spawnSync( 'git', [ 'archive', '--format=tar', '--prefix=' + slug + '/', '-o', archive, 'HEAD' ], { stdio: 'inherit' } );
	if ( 0 !== archived.status ) {
		fail( 'git archive failed. Commit first: it only takes committed files.' );
	}
	const extracted = spawnSync( 'tar', [ '-xf', archive, '-C', temp ], { stdio: 'inherit' } );
	if ( 0 !== extracted.status ) {
		fail( 'Could not extract ' + archive );
	}

	// A blueprint that only installs Plugin Check.
	const blueprint = path.join( temp, 'blueprint.json' );
	writeFileSync( blueprint, JSON.stringify( {
		steps: [
			{
				step: 'installPlugin',
				pluginData: { resource: 'wordpress.org/plugins', slug: 'plugin-check' },
				options: { activate: true },
			},
		],
	}, null, '\t' ) );

	console.log( `Plugin Check on the release (git archive HEAD), extracted in ${ temp }\n` );
	const status = playground( [
		'--blueprint', blueprint,
		'--mount-dir', path.join( temp, slug ), '/release/' + slug,
		...commonArgs,
		...wpCli,
		'plugin', 'check', '/release/' + slug, '--include-experimental',
		...wpArgs,
	] );
	rmSync( temp, { recursive: true, force: true } );
	process.exit( status );
}

if ( 0 === wpArgs.length ) {
	fail( 'Nothing to run. Put the WP-CLI command after "--", for example: node playground-wp.mjs -- plugin list' );
}

const blueprintFile = path.resolve( getOption( '--blueprint', 'blueprint.json' ) );
const hasBlueprint = existsSync( blueprintFile );
const pluginMount = [ '--mount-dir', repo, '/wordpress/wp-content/plugins/' + slug ];
const site = getOption( '--site', null );

let siteArgs;
if ( ! site ) {
	// A disposable site, built from the blueprint.
	siteArgs = hasBlueprint ? [ '--blueprint', blueprintFile ] : [];
} else {
	// A persistent site on disk, mounted "before install" as Playground's
	// `start` does: with a plain mount, WP-CLI can't open its database.
	const siteFolder = path.resolve( site );
	if ( siteFolder === repo || siteFolder.startsWith( repo + path.sep ) ) {
		fail( 'Keep the persistent site outside the repo.' );
	}
	const isNew = ! existsSync( siteFolder ) || 0 === readdirSync( siteFolder ).length;
	mkdirSync( siteFolder, { recursive: true } );
	siteArgs = [ '--mount-dir-before-install', siteFolder, '/wordpress' ];
	if ( isNew ) {
		// First run: install WordPress into the folder and apply the blueprint.
		console.log( `Creating the site in ${ siteFolder }\n` );
		siteArgs.push( '--wordpress-install-mode', 'download-and-install' );
		if ( hasBlueprint ) {
			siteArgs.push( '--blueprint', blueprintFile );
		}
	} else {
		// Later runs: reuse it as it is. The blueprint was applied when it was created.
		siteArgs.push( '--wordpress-install-mode', 'install-from-existing-files-if-needed' );
	}
}

process.exit( playground( [ ...siteArgs, ...pluginMount, ...commonArgs, ...wpCli, ...wpArgs ] ) );
