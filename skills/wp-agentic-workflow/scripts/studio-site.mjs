#!/usr/bin/env node
/**
 * Creates the persistent Studio test site for the plugin in the current
 * folder, with the plugin linked from the repo (not copied).
 *
 * Usage, from the plugin repo root:
 *   node <skill>/scripts/studio-site.mjs [--sites-dir <dir>] [--php <version>]
 *
 * - Site folder: <sites-dir>/<slug> (default sites dir: ~/Studio).
 * - Domain: <slug>.local. Login: admin / password, the same as Playground.
 * - If the repo has a blueprint.json, Studio applies it when creating the
 *   site. Its step that activates this plugin does nothing at that point
 *   (the plugin is linked afterwards), so the plugin is activated here.
 *
 * The site is created but not started: starting it adds the domain to the
 * hosts file, which asks for confirmation (UAC on Windows). Start it with:
 *   studio start --path <site> --skip-browser
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Reads the value of a "--name value" option, or returns the default.
 */
function getOption( name, defaultValue ) {
	const index = process.argv.indexOf( name );
	if ( -1 === index || index + 1 >= process.argv.length ) {
		return defaultValue;
	}
	return process.argv[ index + 1 ];
}

/**
 * Runs `studio` with the given arguments, showing its output.
 * On Windows `studio` is a .bat file, which needs a shell; arguments with
 * spaces are quoted for it.
 */
function studio( args ) {
	const quoted = args.map( ( arg ) => ( /\s/.test( arg ) ? `"${ arg }"` : arg ) );
	const command = 'studio ' + quoted.join( ' ' );
	const result = spawnSync( command, { stdio: 'inherit', shell: true } );
	if ( 0 !== result.status ) {
		console.error( `\nFailed: ${ command }` );
		process.exit( 1 );
	}
}

/**
 * Returns the plugin name from the "Plugin Name:" header of a root PHP file.
 */
function findPluginName( folder ) {
	const phpFiles = readdirSync( folder ).filter( ( file ) => file.endsWith( '.php' ) );
	for ( const file of phpFiles ) {
		const head = readFileSync( path.join( folder, file ), 'utf8' ).slice( 0, 8192 );
		const name = head.match( /^[ \t/*#@]*Plugin Name:(.*)$/mi );
		if ( name ) {
			return name[ 1 ].trim();
		}
	}
	return null;
}

const repo = process.cwd();
const slug = path.basename( repo );
const sitesDir = path.resolve( getOption( '--sites-dir', path.join( os.homedir(), 'Studio' ) ) );
const php = getOption( '--php', '8.3' );
const site = path.join( sitesDir, slug );
const domain = `${ slug }.local`;

const name = findPluginName( repo );
if ( ! name ) {
	console.error( `No PHP file with a "Plugin Name:" header in ${ repo }. Run this from the plugin repo root.` );
	process.exit( 1 );
}
if ( existsSync( site ) ) {
	console.error( `${ site } already exists. Use that site, or delete it first (studio delete --path "${ site }").` );
	process.exit( 1 );
}

// 1. Create the site, applying the repo's blueprint if there is one.
//    --file-access all-files: the plugin is a link to a folder outside the site.
//    --admin-password: otherwise Studio generates a random one.
const createArgs = [
	'create',
	'--path', site,
	'--name', name,
	'--php', php,
	'--file-access', 'all-files',
	'--domain', domain,
	'--admin-password', 'password',
	'--no-start',
	'--skip-browser',
	'--skip-log-details',
];
const blueprint = path.join( repo, 'blueprint.json' );
if ( existsSync( blueprint ) ) {
	createArgs.push( '--blueprint', blueprint );
}
studio( createArgs );

// 2. Link the plugin from the repo. On Windows a junction, which needs no
//    admin rights; elsewhere a symbolic link.
const link = path.join( site, 'wp-content', 'plugins', slug );
symlinkSync( repo, link, 'win32' === process.platform ? 'junction' : 'dir' );
console.log( `\nLinked ${ link } -> ${ repo }` );

// 3. Activate it.
studio( [ 'wp', '--path', site, 'plugin', 'activate', slug ] );

console.log( `
Site created at ${ site }, not started yet.
Start it with:
  studio start --path "${ site }" --skip-browser
Starting it adds ${ domain } to the hosts file, which asks for confirmation
on this computer. Then the site is at http://${ domain }/ (admin / password).` );
